import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Video, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MediaLibraryPage() {
  const [media, setMedia] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mediaRes, brandsRes] = await Promise.all([
        axios.get(`${API}/media`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/brands`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMedia(mediaRes.data);
      setBrands(brandsRes.data);
      if (brandsRes.data.length > 0) {
        setSelectedBrand(brandsRes.data[0].id);
      }
    } catch (error) {
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedBrand) {
      toast.error("Please select a brand first");
      return;
    }

    if (file.size > 5000000) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        const fileType = file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "other";

        await axios.post(
          `${API}/media/upload`,
          {
            file_name: file.name,
            file_data: base64Data,
            file_type: fileType,
            brand_id: selectedBrand
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success("Media uploaded successfully!");
        loadData();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload media");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId) => {
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
      await axios.delete(`${API}/media/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Media deleted!");
      loadData();
    } catch (error) {
      toast.error("Failed to delete media");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-bounce-slow">
            <ImageIcon className="w-12 h-12 text-indigo-600" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Media Library</h1>
            <p className="text-lg text-slate-600">Upload and manage your brand assets</p>
          </div>
          <div className="flex items-center gap-4">
            {brands.length > 0 && (
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="rounded-xl border-slate-200 bg-white px-4 py-3"
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            )}
            <label htmlFor="file-upload">
              <Button
                data-testid="upload-media-btn"
                disabled={uploading || !selectedBrand}
                className="rounded-full px-8 py-3 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200"
                onClick={() => document.getElementById("file-upload").click()}
              >
                <Upload className="w-5 h-5 mr-2" />
                {uploading ? "Uploading..." : "Upload Media"}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {media.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {media.map((item) => (
              <div
                key={item.id}
                data-testid={`media-item-${item.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="aspect-square bg-slate-100 relative">
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === "video" ? (
                    <video src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      data-testid={`delete-media-btn-${item.id}`}
                      onClick={() => handleDelete(item.id)}
                      variant="destructive"
                      size="sm"
                      className="rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">No media yet</h2>
            <p className="text-slate-600 mb-6">Upload logos, images, and videos to use in your content</p>
            <label htmlFor="file-upload-empty">
              <Button
                onClick={() => document.getElementById("file-upload-empty").click()}
                className="rounded-full px-8 py-3"
              >
                Upload Your First Asset
              </Button>
              <input
                id="file-upload-empty"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </Layout>
  );
}