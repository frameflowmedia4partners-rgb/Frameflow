import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
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
  Heart,
  Edit,
  Calendar,
  Layers,
  MoreVertical,
  FolderPlus,
  Grid,
  LayoutGrid,
  Plus,
  Star,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function LibraryPage() {
  const navigate = useNavigate();
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  
  // View state
  const [viewMode, setViewMode] = useState("grid"); // grid, boards
  const [selectedBoard, setSelectedBoard] = useState("all");
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Menu state
  const [openMenu, setOpenMenu] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  const filters = [
    { id: "all", label: "All" },
    { id: "images", label: "Images" },
    { id: "videos", label: "Videos" },
    { id: "ai_generated", label: "AI Generated" },
    { id: "scraped", label: "Scraped" },
    { id: "uploaded", label: "Uploaded" },
    { id: "variation", label: "Variations" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMedia();
  }, [media, searchQuery, activeFilter, selectedBoard]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load media
      const mediaRes = await api.get("/content-library");
      setMedia(mediaRes.data || []);
      
      // Load boards
      const boardsRes = await api.get("/library/boards");
      setBoards(boardsRes.data || []);
    } catch (error) {
      console.error("Failed to load library:", error);
      setMedia([]);
      setBoards([
        { id: "all", name: "All Visuals", is_default: true },
        { id: "favourites", name: "Favourites", is_default: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    let result = [...media];
    
    // Board filter
    if (selectedBoard === "favourites") {
      result = result.filter(item => item.is_favourite);
    } else if (selectedBoard !== "all") {
      result = result.filter(item => item.board_id === selectedBoard);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.filename?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        item.caption?.toLowerCase().includes(query)
      );
    }
    
    // Type/source filter
    if (activeFilter !== "all") {
      if (activeFilter === "images") {
        result = result.filter(item => 
          item.type === "image" || item.url?.includes("image") || item.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        );
      } else if (activeFilter === "videos") {
        result = result.filter(item => 
          item.type === "video" || item.filename?.match(/\.(mp4|mov|avi|webm)$/i)
        );
      } else {
        result = result.filter(item => item.source === activeFilter);
      }
    }
    
    setFilteredMedia(result);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10000000) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        
        await api.post("/content-library", {
          filename: `${cleanName}_${Date.now()}.${file.name.split(".").pop()}`,
          file_data: base64Data,
          tags: cleanName.split("_").filter(t => t.length > 2).join(","),
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
      await api.delete(`/content-library/${id}`);
      setMedia(media.filter(m => m.id !== id));
      toast.success("Deleted");
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleFavourite = async (item) => {
    try {
      const response = await api.post(`/library/items/${item.id}/favourite`);
      setMedia(media.map(m => 
        m.id === item.id ? { ...m, is_favourite: response.data.is_favourite } : m
      ));
      toast.success(response.data.is_favourite ? "Added to favourites" : "Removed from favourites");
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error("Please enter a board name");
      return;
    }

    try {
      const response = await api.post(`/library/boards?name=${encodeURIComponent(newBoardName)}`);
      setBoards([...boards, response.data]);
      setNewBoardName("");
      setShowNewBoard(false);
      toast.success("Board created!");
    } catch (error) {
      toast.error("Failed to create board");
    }
  };

  const handleDownload = (item) => {
    if (item.url) {
      const link = document.createElement("a");
      link.href = item.url;
      link.download = item.filename || `media-${Date.now()}`;
      link.click();
      toast.success("Downloaded!");
    }
  };

  const handleEdit = (item) => {
    navigate("/editor", { 
      state: { 
        post: { 
          image_base64: item.url?.replace("data:image/png;base64,", ""),
          headline: "",
          tagline: "",
        } 
      } 
    });
  };

  const handleGenerateVariations = (item) => {
    navigate("/variations", { state: { selectedPost: item } });
  };

  const handleSchedule = (item) => {
    localStorage.setItem("schedulePost", JSON.stringify({
      image_base64: item.url?.replace("data:image/png;base64,", ""),
      caption: item.caption || "",
    }));
    navigate("/calendar");
  };

  const getSourceBadge = (source) => {
    const badges = {
      ai_generated: { icon: Sparkles, label: "AI", color: "bg-purple-100 text-purple-700" },
      scraped: { icon: Link, label: "Scraped", color: "bg-blue-100 text-blue-700" },
      variation: { icon: Layers, label: "Variation", color: "bg-green-100 text-green-700" },
      edited: { icon: Edit, label: "Edited", color: "bg-orange-100 text-orange-700" },
      uploaded: { icon: CloudUpload, label: "Uploaded", color: "bg-slate-100 text-slate-700" },
    };
    return badges[source] || badges.uploaded;
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900">Library</h1>
            <p className="text-sm md:text-base text-slate-600">Manage your media assets</p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button
              onClick={() => document.getElementById("file-upload").click()}
              disabled={uploading}
              className="rounded-full px-6 bg-indigo-600"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload
            </Button>
          </div>
        </div>

        {/* View Toggle & Boards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              <Grid className="w-4 h-4 inline mr-2" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("boards")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "boards" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              <LayoutGrid className="w-4 h-4 inline mr-2" />
              Boards
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-10 rounded-full"
            />
          </div>
        </div>

        {/* Boards View */}
        {viewMode === "boards" && (
          <div className="flex flex-wrap gap-3 mb-6">
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => setSelectedBoard(board.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedBoard === board.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
                }`}
              >
                {board.id === "favourites" && <Star className="w-4 h-4 inline mr-1" />}
                {board.name}
              </button>
            ))}
            <button
              onClick={() => setShowNewBoard(true)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              New Board
            </button>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Media Grid */}
        {filteredMedia.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery || activeFilter !== "all" || selectedBoard !== "all"
                ? "No matching media"
                : "No media yet"}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchQuery || activeFilter !== "all" || selectedBoard !== "all"
                ? "Try adjusting your search or filters"
                : "Create content to build your library"}
            </p>
            {!searchQuery && activeFilter === "all" && selectedBoard === "all" && (
              <Button
                onClick={() => navigate("/content-swipe")}
                className="rounded-full bg-indigo-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMedia.map((item) => {
              const badge = getSourceBadge(item.source);
              return (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Media Preview */}
                  <div className="aspect-square bg-slate-100 relative">
                    {item.type === "video" ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                        <Video className="w-10 h-10 text-white/60" />
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f1f5f9' width='100' height='100'/%3E%3C/svg%3E";
                        }}
                      />
                    )}

                    {/* Favourite Button */}
                    <button
                      onClick={() => handleToggleFavourite(item)}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
                        item.is_favourite
                          ? "bg-red-500 text-white"
                          : "bg-white/80 text-slate-400 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${item.is_favourite ? "fill-current" : ""}`} />
                    </button>

                    {/* Source Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        <badge.icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </div>

                    {/* 3-dot Menu */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === item.id ? null : item.id);
                          }}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-slate-50"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-600" />
                        </button>

                        {openMenu === item.id && (
                          <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                            <button
                              onClick={() => { handleDownload(item); setOpenMenu(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                            <button
                              onClick={() => { handleEdit(item); setOpenMenu(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => { handleSchedule(item); setOpenMenu(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4" />
                              Schedule
                            </button>
                            <button
                              onClick={() => { handleGenerateVariations(item); setOpenMenu(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Layers className="w-4 h-4" />
                              Generate Variations
                            </button>
                            <hr className="my-2" />
                            <button
                              onClick={() => { setShowDeleteConfirm(item.id); setOpenMenu(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.filename || "Untitled"}
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
              );
            })}
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

        {/* New Board Modal */}
        {showNewBoard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Board</h3>
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name..."
                className="rounded-xl mb-4"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNewBoard(false)}
                  className="flex-1 rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBoard}
                  className="flex-1 rounded-full bg-indigo-600"
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {openMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenMenu(null)}
        />
      )}
    </ClientLayout>
  );
}
