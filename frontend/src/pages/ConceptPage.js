import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Lightbulb,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Download,
  Calendar,
  Edit,
  Square,
  Smartphone,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const formatOptions = [
  { id: "feed", label: "Feed Post", size: "1080x1080", icon: Square },
  { id: "story", label: "Story", size: "1080x1920", icon: Smartphone },
  { id: "reel_cover", label: "Reel Cover", size: "1080x1080", icon: Film },
];

const angleOptions = [
  { id: "discount", label: "Discount" },
  { id: "announcement", label: "Announcement" },
  { id: "new_item", label: "New Item" },
  { id: "festival", label: "Festival" },
  { id: "weekend", label: "Weekend Special" },
  { id: "behind_scenes", label: "Behind Scenes" },
];

export default function ConceptPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [brandDna, setBrandDna] = useState(null);
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    product: "",
    customProduct: "",
    format_size: "feed",
    angle: "promotion",
    brief: "",
  });

  useEffect(() => {
    loadBrandDNA();
  }, []);

  const loadBrandDNA = async () => {
    try {
      setLoading(true);
      const response = await api.get("/brand-dna");
      setBrandDna(response.data);
    } catch (error) {
      console.error("Failed to load brand DNA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    const product = formData.product === "custom" ? formData.customProduct : formData.product;
    
    if (!product) {
      toast.error("Please select or enter a product");
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post("/concept/generate", {
        product: product,
        format_size: formData.format_size,
        angle: formData.angle,
        brief: formData.brief,
      });

      setResult(response.data);
      toast.success("Concept generated!");
    } catch (error) {
      console.error("Generation failed:", error);
      const errorMsg = error.response?.data?.detail || "Failed to generate";
      toast.error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (result?.image_base64) {
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${result.image_base64}`;
      link.download = `frameflow-concept-${Date.now()}.png`;
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

  const menuItems = brandDna?.menu_items || [];

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
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-outfit text-slate-900">Concept</h1>
              <p className="text-slate-600">Pick a product, format, and angle. AI creates the post.</p>
            </div>
          </div>
        </div>

        {!result ? (
          <div className="space-y-8">
            {/* Step 1: Product */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">1</span>
                <h2 className="text-lg font-semibold text-slate-900">Select Product</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {menuItems.map((item) => (
                  <button
                    key={item.id || item.name}
                    onClick={() => setFormData({ ...formData, product: item.name })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.product === item.name
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.description}</p>
                  </button>
                ))}
                <button
                  onClick={() => setFormData({ ...formData, product: "custom" })}
                  className={`p-4 rounded-xl border-2 border-dashed text-center transition-all ${
                    formData.product === "custom"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <p className="font-medium text-slate-600">+ Something else</p>
                </button>
              </div>

              {formData.product === "custom" && (
                <Input
                  value={formData.customProduct}
                  onChange={(e) => setFormData({ ...formData, customProduct: e.target.value })}
                  placeholder="Enter product name..."
                  className="mt-4 rounded-xl"
                />
              )}
            </div>

            {/* Step 2: Format */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">2</span>
                <h2 className="text-lg font-semibold text-slate-900">Select Format</h2>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {formatOptions.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setFormData({ ...formData, format_size: format.id })}
                    className={`p-6 rounded-xl border-2 text-center transition-all ${
                      formData.format_size === format.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <format.icon className={`w-8 h-8 mx-auto mb-3 ${
                      formData.format_size === format.id ? "text-indigo-600" : "text-slate-400"
                    }`} />
                    <p className="font-semibold text-slate-900">{format.label}</p>
                    <p className="text-xs text-slate-500">{format.size}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Angle & Brief */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">3</span>
                <h2 className="text-lg font-semibold text-slate-900">Angle & Brief</h2>
              </div>

              <div className="mb-4">
                <Label className="text-sm font-semibold text-slate-700 mb-3 block">Quick Angle</Label>
                <div className="flex flex-wrap gap-2">
                  {angleOptions.map((angle) => (
                    <button
                      key={angle.id}
                      onClick={() => setFormData({ ...formData, angle: angle.id })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.angle === angle.id
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {angle.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Brief (optional)</Label>
                <Textarea
                  value={formData.brief}
                  onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                  placeholder="Any specific details or messaging..."
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generating || (!formData.product && !formData.customProduct)}
              className="w-full py-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Generate Concept
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Result View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Preview */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <img
                src={`data:image/png;base64,${result.image_base64}`}
                alt="Generated concept"
                className="w-full aspect-square object-cover"
              />
            </div>

            {/* Details & Actions */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-100">
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
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="rounded-full py-5"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handleSchedule}
                  variant="outline"
                  className="rounded-full py-5"
                >
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
                  onClick={() => setResult(null)}
                  className="rounded-full py-5 bg-indigo-600"
                >
                  Create Another
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
