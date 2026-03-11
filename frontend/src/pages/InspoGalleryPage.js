import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  Copy,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const categories = [
  { id: "all", label: "All" },
  { id: "cafe", label: "Café" },
  { id: "bakery", label: "Bakery" },
  { id: "restaurant", label: "Restaurant" },
  { id: "festival", label: "Festival" },
  { id: "offers", label: "Offers" },
  { id: "desserts", label: "Desserts" },
];

export default function InspoGalleryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(null);
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    loadGallery();
  }, [selectedCategory]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const response = await api.get("/inspo/gallery", {
        params: { category: selectedCategory }
      });
      setPosts(response.data?.posts || []);
      setMessage(response.data?.message || "");
    } catch (error) {
      console.error("Failed to load inspo gallery:", error);
      setMessage("Inspiration gallery fills up as brands create and share content. Check back soon!");
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (post) => {
    setCloning(post.id);
    try {
      const response = await api.post("/inspo/clone", { post_id: post.id });
      toast.success("Post cloned and rebranded!");
      // Navigate to editor with the result
      navigate("/editor", { state: { post: response.data } });
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Failed to clone post";
      toast.error(errorMsg);
    } finally {
      setCloning(null);
    }
  };

  const getNicheBadgeColor = (niche) => {
    const colors = {
      cafe: "bg-amber-100 text-amber-700",
      bakery: "bg-orange-100 text-orange-700",
      restaurant: "bg-red-100 text-red-700",
      festival: "bg-purple-100 text-purple-700",
      offers: "bg-green-100 text-green-700",
      desserts: "bg-pink-100 text-pink-700",
    };
    return colors[niche] || "bg-slate-100 text-slate-700";
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
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900">Inspiration Gallery</h1>
              <p className="text-sm md:text-base text-slate-600">Browse trending creatives from other brands</p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {posts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-slate-100">
            <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No inspiration yet</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              {message || "Inspiration gallery fills up as brands create and share content. Check back soon!"}
            </p>
            <Button 
              onClick={() => navigate("/content-swipe")} 
              className="mt-6 rounded-full bg-indigo-600"
            >
              Create Content First
            </Button>
          </div>
        ) : (
          /* Masonry Grid */
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="break-inside-avoid bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all group"
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={post.url}
                    alt="Inspiration"
                    className="w-full object-cover"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23f1f5f9' width='300' height='300'/%3E%3C/svg%3E";
                    }}
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      onClick={() => handleClone(post)}
                      disabled={cloning === post.id}
                      className="rounded-full bg-white text-slate-900 hover:bg-slate-100"
                    >
                      {cloning === post.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Clone for my brand
                    </Button>
                  </div>

                  {/* Niche Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getNicheBadgeColor(post.niche)}`}>
                      {post.niche || post.brand_type}
                    </span>
                  </div>
                </div>

                {/* Caption */}
                {post.caption && (
                  <div className="p-3">
                    <p className="text-sm text-slate-600 line-clamp-2">{post.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
