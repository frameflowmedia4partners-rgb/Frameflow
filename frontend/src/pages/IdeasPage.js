import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Lightbulb, Heart, X, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function IdeasPage() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [currentIdea, setCurrentIdea] = useState(null);
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [ideaType, setIdeaType] = useState("general");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const brandsRes = await axios.get(`${API}/brands`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBrands(brandsRes.data);
      if (brandsRes.data.length > 0) {
        setSelectedBrand(brandsRes.data[0].id);
        loadSavedIdeas(brandsRes.data[0].id);
      }
    } catch (error) {
      toast.error("Failed to load brands");
    }
  };

  const loadSavedIdeas = async (brandId) => {
    try {
      const response = await axios.get(`${API}/ideas?brand_id=${brandId}&status=saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedIdeas(response.data);
    } catch (error) {
      console.error("Failed to load saved ideas");
    }
  };

  const generateNewIdea = async () => {
    if (!selectedBrand) {
      toast.error("Please select a brand first");
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post(
        `${API}/ideas/generate`,
        { brand_id: selectedBrand, idea_type: ideaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentIdea(response.data);
    } catch (error) {
      toast.error("Failed to generate idea");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveIdea = async () => {
    if (!currentIdea) return;

    try {
      await axios.post(
        `${API}/ideas/save`,
        {
          brand_id: selectedBrand,
          idea_text: currentIdea.idea_text,
          idea_type: currentIdea.idea_type
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Idea saved!");
      loadSavedIdeas(selectedBrand);
      setCurrentIdea(null);
      generateNewIdea();
    } catch (error) {
      toast.error("Failed to save idea");
    }
  };

  const handleSkipIdea = () => {
    setCurrentIdea(null);
    generateNewIdea();
  };

  const handleConvertToContent = () => {
    if (currentIdea) {
      localStorage.setItem("ideaToConvert", JSON.stringify(currentIdea));
      navigate("/create");
    }
  };

  const ideaTypes = [
    { value: "general", label: "General Idea" },
    { value: "ad_hook", label: "Ad Hook" },
    { value: "social_post", label: "Social Post" },
    { value: "storytelling", label: "Storytelling" },
    { value: "campaign", label: "Campaign" },
    { value: "promotion", label: "Promotion" }
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Idea Engine</h1>
          <p className="text-lg text-slate-600">AI-powered marketing ideas for your brand</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Swipe Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8 min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {brands.length > 0 && (
                    <select
                      value={selectedBrand}
                      onChange={(e) => {
                        setSelectedBrand(e.target.value);
                        loadSavedIdeas(e.target.value);
                        setCurrentIdea(null);
                      }}
                      className="rounded-xl border-slate-200 bg-slate-50 px-4 py-2"
                    >
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  )}
                  <select
                    value={ideaType}
                    onChange={(e) => setIdeaType(e.target.value)}
                    className="rounded-xl border-slate-200 bg-slate-50 px-4 py-2"
                  >
                    {ideaTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!currentIdea && !generating && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6 animate-bounce-slow">
                    <Lightbulb className="w-12 h-12 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">Ready for ideas?</h2>
                  <p className="text-slate-600 mb-6">Let Framey generate creative marketing ideas for you</p>
                  <Button
                    data-testid="generate-idea-btn"
                    onClick={generateNewIdea}
                    className="rounded-full px-8 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Idea
                  </Button>
                </div>
              )}

              {generating && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-600">Generating your next great idea...</p>
                </div>
              )}

              {currentIdea && !generating && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 mb-6">
                    <div className="mb-4">
                      <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold uppercase">
                        {ideaTypes.find(t => t.value === currentIdea.idea_type)?.label}
                      </span>
                    </div>
                    <div className="text-slate-900 text-lg leading-relaxed whitespace-pre-wrap">
                      {currentIdea.idea_text}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      data-testid="skip-idea-btn"
                      onClick={handleSkipIdea}
                      variant="outline"
                      className="flex-1 rounded-full py-6 border-2 border-slate-200 hover:border-slate-300"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Skip
                    </Button>
                    <Button
                      data-testid="save-idea-btn"
                      onClick={handleSaveIdea}
                      variant="outline"
                      className="flex-1 rounded-full py-6 border-2 border-pink-200 hover:border-pink-300 text-pink-600 hover:bg-pink-50"
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Save
                    </Button>
                    <Button
                      data-testid="convert-idea-btn"
                      onClick={handleConvertToContent}
                      className="flex-1 rounded-full py-6 bg-indigo-600 text-white hover:scale-105 transition-all"
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Create Content
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Saved Ideas */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Saved Ideas ({savedIdeas.length})
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {savedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    data-testid={`saved-idea-${idea.id}`}
                    className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => {
                      localStorage.setItem("ideaToConvert", JSON.stringify(idea));
                      navigate("/create");
                    }}
                  >
                    <div className="text-sm text-slate-600 mb-2 capitalize">{idea.idea_type.replace('_', ' ')}</div>
                    <div className="text-sm text-slate-900 line-clamp-3">{idea.idea_text}</div>
                  </div>
                ))}
                {savedIdeas.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">No saved ideas yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}