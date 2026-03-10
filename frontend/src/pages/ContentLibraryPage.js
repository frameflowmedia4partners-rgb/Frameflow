import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Search,
  Filter,
  Download,
  Sparkles,
  Link,
  CloudUpload,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { mediaAPI, brandAPI } from "@/services/api";

export default function ContentLibraryPage() {
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const filters = [
    { id: "all", label: "All" },
    { id: "image", label: "Images" },
    { id: "video", label: "Videos" },
    { id: "ai", label: "AI Generated" },
    { id: "scraped", label: "Scraped" },
    { id: "uploaded", label: "Uploaded" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMedia();
  }, [media, searchQuery, activeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      let mediaData = [];
      
      try {
        const mediaRes = await mediaAPI.getAll();
        mediaData = mediaRes.data || [];
      } catch (e) {
        console.log("Media fetch failed, using empty state");
      }
      
      setMedia(mediaData);
    } catch (error) {
      console.error("Failed to load media:", error);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    let result = [...media];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        item.filename?.toLowerCase().includes(query)
      );
    }
    
    // Apply type filter
    if (activeFilter !== "all") {
      if (activeFilter === "image" || activeFilter === "video") {
        result = result.filter(item => item.type === activeFilter);
      } else if (activeFilter === "ai") {
        result = result.filter(item => item.source === "ai_generated");
      } else if (activeFilter === "scraped") {
        result = result.filter(item => item.source === "scraped");
      } else if (activeFilter === "uploaded") {
        result = result.filter(item => item.source === "uploaded" || !item.source);
      }
    }
    
    setFilteredMedia(result);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10000000) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Generate keyword-based filename
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const cleanName = file.name.replace(`.${extension}`, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      const newFilename = `${cleanName}-${timestamp}.${extension}`;
      
      const fileType = file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "other";

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        
        await mediaAPI.upload({
          name: file.name,
          filename: newFilename,
          type: fileType,
          data: base64Data,
          source: "uploaded",
          tags: cleanName.split("-").filter(t => t.length > 2),
        });
        
        toast.success("File uploaded!");
        loadData();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await mediaAPI.delete(id);
      setMedia(media.filter(m => m.id !== id));
      toast.success("File deleted");
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (item) => {
    if (item.url || item.data) {
      const link = document.createElement("a");
      link.href = item.url || item.data;
      link.download = item.filename || item.name || `media-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Downloaded!");
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case "ai_generated":
        return <Sparkles className="w-3 h-3" />;
      case "scraped":
        return <Link className="w-3 h-3" />;
      default:
        return <CloudUpload className="w-3 h-3" />;
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case "ai_generated":
        return "AI";
      case "scraped":
        return "Scraped";
      default:
        return "Uploaded";
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading content library..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Content Library</h1>
            <p className="text-lg text-slate-600">Manage your media assets</p>
          </div>
          <div>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button
              data-testid="upload-media-btn"
              onClick={() => document.getElementById("file-upload").click()}
              disabled={uploading}
              className="rounded-full px-6 bg-indigo-600"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Upload className="w-5 h-5 mr-2" />
              )}
              Upload Media
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              data-testid="library-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword or tags..."
              className="pl-12 rounded-full"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter.id}
                data-testid={`filter-${filter.id}`}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        {filteredMedia.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery || activeFilter !== "all" ? "No matching media" : "No media yet"}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchQuery || activeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Upload images and videos to build your content library"}
            </p>
            {!searchQuery && activeFilter === "all" && (
              <Button
                onClick={() => document.getElementById("file-upload").click()}
                className="rounded-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload First File
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Media Preview */}
                <div className="aspect-square bg-slate-100">
                  {item.type === "video" ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <Video className="w-10 h-10 text-white/60" />
                    </div>
                  ) : (
                    <img
                      src={item.url || item.data}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f1f5f9' width='100' height='100'/%3E%3C/svg%3E";
                      }}
                    />
                  )}
                </div>

                {/* Source Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    item.source === "ai_generated"
                      ? "bg-purple-100 text-purple-700"
                      : item.source === "scraped"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {getSourceIcon(item.source)}
                    {getSourceLabel(item.source)}
                  </span>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(item)}
                    className="rounded-full"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(item.id)}
                    className="rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.name || item.filename}
                  </p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs text-slate-500">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Media?</h3>
              <p className="text-slate-600 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deleting === showDeleteConfirm}
                  className="flex-1 rounded-full"
                >
                  {deleting === showDeleteConfirm ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
