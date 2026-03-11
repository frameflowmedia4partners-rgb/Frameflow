import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Loader2,
  Download,
  Edit,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const briefSuggestions = [
  "Flat lay on marble",
  "Rustic wooden table",
  "Dark moody lighting",
  "Bright minimal",
  "Natural daylight",
  "Artistic angle"
];

export default function PhotoshootPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [brandDna, setBrandDna] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  
  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [productName, setProductName] = useState("");
  const [brief, setBrief] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/brand-dna");
      setBrandDna(response.data);
      setMenuItems(response.data?.menu_items || []);
    } catch (error) {
      console.error("Failed to load brand DNA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemChange = (value) => {
    setSelectedMenuItem(value);
    const item = menuItems.find(i => i.id === value || i.name === value);
    if (item) {
      setProductName(item.name);
    }
  };

  const handleGenerate = async () => {
    if (!productName && !selectedMenuItem) {
      toast.error("Please select a product or enter a name");
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post("/photoshoot/generate", {
        menu_item_id: selectedMenuItem,
        product_name: productName,
        brief: brief
      });

      setResult(response.data);
      toast.success("Photo generated!");
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Failed to generate photo";
      toast.error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (result?.image_base64) {
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${result.image_base64}`;
      link.download = `frameflow-photoshoot-${result.product_name?.replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.click();
      toast.success("Downloaded!");
    }
  };

  const handleEdit = () => {
    if (result) {
      navigate("/editor", { state: { post: { image_base64: result.image_base64 } } });
    }
  };

  const addBriefSuggestion = (suggestion) => {
    setBrief(prev => prev ? `${prev}, ${suggestion}` : suggestion);
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
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-outfit text-slate-900">AI Photoshoot</h1>
              <p className="text-slate-600">Professional product photography powered by AI</p>
            </div>
          </div>
        </div>

        {!result ? (
          /* Form */
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <div className="space-y-6">
              {/* Product Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Product</Label>
                {menuItems.length > 0 ? (
                  <select
                    value={selectedMenuItem}
                    onChange={(e) => handleMenuItemChange(e.target.value)}
                    className="w-full p-3 border rounded-xl text-sm"
                  >
                    <option value="">Choose from your menu...</option>
                    {menuItems.map((item, i) => (
                      <option key={i} value={item.id || item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name..."
                    className="w-full p-3 border rounded-xl text-sm"
                  />
                )}
              </div>

              {/* Or enter manually */}
              {menuItems.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Or Enter Product Name</Label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Custom product name..."
                    className="w-full p-3 border rounded-xl text-sm"
                  />
                </div>
              )}

              {/* Brief */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Photography Brief (Optional)</Label>
                <Textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Describe the style: 'Flat lay on marble', 'Rustic wooden table'..."
                  className="rounded-xl"
                  rows={3}
                />
                
                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {briefSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => addBriefSuggestion(suggestion)}
                      className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || (!productName && !selectedMenuItem)}
                className="w-full py-6 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Generate Photo (1 credit)
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Result */
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setResult(null)}>
              ← Generate Another
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Preview */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={`data:image/png;base64,${result.image_base64}`}
                  alt={result.product_name}
                  className="w-full aspect-square object-cover"
                />
              </div>

              {/* Details & Actions */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">Photo Generated!</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Product</h3>
                  <p className="text-slate-600">{result.product_name}</p>
                </div>

                {brief && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100">
                    <h3 className="font-semibold text-slate-900 mb-2">Brief</h3>
                    <p className="text-slate-600 text-sm">{brief}</p>
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Credits used:</span> 1 • 
                    <span className="font-medium"> Remaining:</span> {result.credits_remaining}
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={handleDownload} variant="outline" className="rounded-full py-5">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handleEdit} variant="outline" className="rounded-full py-5">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>

                <Button
                  onClick={() => setResult(null)}
                  className="w-full rounded-full py-5 bg-rose-500"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Generate Another
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
