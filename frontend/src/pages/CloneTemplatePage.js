import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Loader2,
  Search,
  Check,
  Download,
  Calendar,
  Edit,
  Filter,
  Grid,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const categories = [
  { id: "all", label: "All" },
  { id: "cafe", label: "Café" },
  { id: "bakery", label: "Bakery" },
  { id: "restaurant", label: "Restaurant" },
  { id: "desserts", label: "Desserts" },
  { id: "festival", label: "Festival" },
  { id: "offers", label: "Offers" },
];

// Default templates when DB is empty
const defaultTemplates = [
  { id: "t1", name: "Morning Coffee", category: "cafe", style: "minimal", preview_color: "#6366f1" },
  { id: "t2", name: "Fresh Bakes", category: "bakery", style: "warm", preview_color: "#f59e0b" },
  { id: "t3", name: "Fine Dining", category: "restaurant", style: "luxury", preview_color: "#1f2937" },
  { id: "t4", name: "Sweet Treats", category: "desserts", style: "playful", preview_color: "#ec4899" },
  { id: "t5", name: "Diwali Special", category: "festival", style: "vibrant", preview_color: "#f97316" },
  { id: "t6", name: "Weekend Deal", category: "offers", style: "bold", preview_color: "#10b981" },
  { id: "t7", name: "Latte Art", category: "cafe", style: "artistic", preview_color: "#8b5cf6" },
  { id: "t8", name: "Croissant Love", category: "bakery", style: "elegant", preview_color: "#d97706" },
  { id: "t9", name: "Gourmet Plate", category: "restaurant", style: "sophisticated", preview_color: "#374151" },
  { id: "t10", name: "Ice Cream", category: "desserts", style: "fun", preview_color: "#f472b6" },
  { id: "t11", name: "Holi Colors", category: "festival", style: "colorful", preview_color: "#a855f7" },
  { id: "t12", name: "Flash Sale", category: "offers", style: "urgent", preview_color: "#ef4444" },
  { id: "t13", name: "Espresso Shot", category: "cafe", style: "bold", preview_color: "#78350f" },
  { id: "t14", name: "Birthday Cake", category: "bakery", style: "celebratory", preview_color: "#e879f9" },
  { id: "t15", name: "Chef Special", category: "restaurant", style: "premium", preview_color: "#0f172a" },
  { id: "t16", name: "Brownie Bliss", category: "desserts", style: "indulgent", preview_color: "#7c2d12" },
  { id: "t17", name: "New Year", category: "festival", style: "glamorous", preview_color: "#fbbf24" },
  { id: "t18", name: "BOGO Offer", category: "offers", style: "exciting", preview_color: "#22c55e" },
  { id: "t19", name: "Cold Brew", category: "cafe", style: "cool", preview_color: "#0ea5e9" },
  { id: "t20", name: "Sourdough", category: "bakery", style: "artisan", preview_color: "#a16207" },
  { id: "t21", name: "Biryani Feast", category: "restaurant", style: "rich", preview_color: "#b45309" },
  { id: "t22", name: "Churros", category: "desserts", style: "crispy", preview_color: "#d97706" },
  { id: "t23", name: "Eid Mubarak", category: "festival", style: "elegant", preview_color: "#059669" },
  { id: "t24", name: "Free Delivery", category: "offers", style: "friendly", preview_color: "#3b82f6" },
  { id: "t25", name: "Matcha Moment", category: "cafe", style: "zen", preview_color: "#84cc16" },
  { id: "t26", name: "Donut Day", category: "bakery", style: "cheerful", preview_color: "#fb7185" },
  { id: "t27", name: "Sushi Roll", category: "restaurant", style: "clean", preview_color: "#f43f5e" },
  { id: "t28", name: "Cheesecake", category: "desserts", style: "creamy", preview_color: "#fcd34d" },
  { id: "t29", name: "Christmas Joy", category: "festival", style: "festive", preview_color: "#dc2626" },
  { id: "t30", name: "Combo Meal", category: "offers", style: "value", preview_color: "#16a34a" },
  { id: "t31", name: "Pour Over", category: "cafe", style: "precise", preview_color: "#44403c" },
  { id: "t32", name: "Cupcake Magic", category: "bakery", style: "sweet", preview_color: "#c084fc" },
  { id: "t33", name: "Thali Platter", category: "restaurant", style: "colorful", preview_color: "#ea580c" },
  { id: "t34", name: "Waffle Wonder", category: "desserts", style: "cozy", preview_color: "#92400e" },
  { id: "t35", name: "Valentine's", category: "festival", style: "romantic", preview_color: "#e11d48" },
  { id: "t36", name: "Happy Hours", category: "offers", style: "fun", preview_color: "#7c3aed" },
  { id: "t37", name: "Mocha Swirl", category: "cafe", style: "rich", preview_color: "#57534e" },
  { id: "t38", name: "Bread Basket", category: "bakery", style: "rustic", preview_color: "#78716c" },
  { id: "t39", name: "Pasta Night", category: "restaurant", style: "italian", preview_color: "#dc2626" },
  { id: "t40", name: "Tiramisu", category: "desserts", style: "classic", preview_color: "#6b7280" },
  { id: "t41", name: "Navratri", category: "festival", style: "traditional", preview_color: "#c2410c" },
  { id: "t42", name: "Loyalty Card", category: "offers", style: "rewarding", preview_color: "#fbbf24" },
  { id: "t43", name: "Iced Latte", category: "cafe", style: "refreshing", preview_color: "#67e8f9" },
  { id: "t44", name: "Bagel Brunch", category: "bakery", style: "morning", preview_color: "#fde047" },
  { id: "t45", name: "Kebab King", category: "restaurant", style: "smoky", preview_color: "#991b1b" },
  { id: "t46", name: "Fruit Tart", category: "desserts", style: "fresh", preview_color: "#4ade80" },
  { id: "t47", name: "Pongal", category: "festival", style: "cultural", preview_color: "#facc15" },
  { id: "t48", name: "Student Deal", category: "offers", style: "young", preview_color: "#3b82f6" },
  { id: "t49", name: "Cappuccino", category: "cafe", style: "frothy", preview_color: "#a8a29e" },
  { id: "t50", name: "Danish Delight", category: "bakery", style: "flaky", preview_color: "#fcd34d" },
];

export default function CloneTemplatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get("/templates/library");
      const loaded = response.data?.length > 6 ? response.data : defaultTemplates;
      setTemplates(loaded);
    } catch (error) {
      console.log("Using default templates");
      setTemplates(defaultTemplates);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.style?.toLowerCase().includes(query)
      );
    }
    
    setFilteredTemplates(filtered);
  };

  const handleClone = async (template) => {
    setSelectedTemplate(template);
    setCloning(true);
    
    try {
      const response = await api.post(`/templates/clone?template_id=${template.id}`);
      setResult(response.data);
      toast.success("Template cloned and rebranded!");
    } catch (error) {
      console.error("Clone failed:", error);
      const errorMsg = error.response?.data?.detail || "Failed to clone template";
      toast.error(errorMsg);
      setSelectedTemplate(null);
    } finally {
      setCloning(false);
    }
  };

  const handleDownload = () => {
    if (result?.image_base64) {
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${result.image_base64}`;
      link.download = `frameflow-clone-${Date.now()}.png`;
      link.click();
      toast.success("Downloaded!");
    }
  };

  const handleSchedule = () => {
    if (result) {
      localStorage.setItem("schedulePost", JSON.stringify({
        image_base64: result.image_base64,
        caption: result.caption,
      }));
      navigate("/calendar");
    }
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
        {!result ? (
          <>
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <Copy className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900">Clone Template</h1>
                    <p className="text-sm md:text-base text-slate-600">Browse 50+ templates. AI rebrands with your DNA.</p>
                  </div>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates..."
                    className="pl-10 rounded-xl"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-indigo-100 text-indigo-600" : "text-slate-400"}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${viewMode === "list" ? "bg-indigo-100 text-indigo-600" : "text-slate-400"}`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 mt-4 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div className={`grid gap-4 ${
              viewMode === "grid" 
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" 
                : "grid-cols-1 md:grid-cols-2"
            }`}>
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleClone(template)}
                  disabled={cloning}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-indigo-300 hover:shadow-xl transition-all text-left disabled:opacity-50"
                >
                  {/* Preview */}
                  <div 
                    className="aspect-square flex items-center justify-center"
                    style={{ backgroundColor: template.preview_color || "#6366f1" }}
                  >
                    {template.preview_url ? (
                      <img src={template.preview_url} alt={template.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/80 text-4xl font-bold">
                        {template.name.charAt(0)}
                      </span>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {cloning && selectedTemplate?.id === template.id ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <div className="text-center text-white">
                          <Copy className="w-8 h-8 mx-auto mb-2" />
                          <span className="text-sm font-medium">Clone & Rebrand</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="font-semibold text-slate-900 text-sm truncate">{template.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{template.category} • {template.style}</p>
                  </div>
                </button>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No templates found matching your criteria</p>
              </div>
            )}
          </>
        ) : (
          /* Result View */
          <div className="max-w-5xl mx-auto">
            <Button
              onClick={() => {
                setResult(null);
                setSelectedTemplate(null);
              }}
              variant="ghost"
              className="mb-6"
            >
              ← Back to Templates
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Preview */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <img
                  src={`data:image/png;base64,${result.image_base64}`}
                  alt="Cloned template"
                  className="w-full aspect-square object-cover"
                />
              </div>

              {/* Details & Actions */}
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">Template Cloned!</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Headline</h3>
                  <p className="text-xl text-slate-800">{result.headline}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-2">Tagline</h3>
                  <p className="text-slate-600">{result.tagline}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-2">Caption</h3>
                  <p className="text-slate-600 text-sm">{result.caption}</p>
                  {result.hashtags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {result.hashtags.map((tag, i) => (
                        <span key={i} className="text-xs text-indigo-600">
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={handleDownload} variant="outline" className="rounded-full py-5">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handleSchedule} variant="outline" className="rounded-full py-5">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                  <Button
                    onClick={() => navigate("/editor", { state: { post: result } })}
                    variant="outline"
                    className="rounded-full py-5"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setResult(null);
                      setSelectedTemplate(null);
                    }}
                    className="rounded-full py-5 bg-indigo-600"
                  >
                    Clone Another
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
