import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Heart,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { brandAPI, ideaAPI } from "@/services/api";

export default function IdeasPage() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [currentIdea, setCurrentIdea] = useState(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ideaType, setIdeaType] = useState("general");
  const navigate = useNavigate();
  const typewriterRef = useRef(null);

  const ideaTypes = [
    { id: "general", label: "General" },
    { id: "promotion", label: "Promotion" },
    { id: "seasonal", label: "Seasonal" },
    { id: "engagement", label: "Engagement" },
    { id: "behind-scenes", label: "Behind Scenes" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentIdea?.idea) {
      typewriterEffect(currentIdea.idea);
    }
  }, [currentIdea]);

  const typewriterEffect = (text) => {
    setDisplayedText("");
    setIsTyping(true);
    let index = 0;

    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
    }

    typewriterRef.current = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(typewriterRef.current);
        setIsTyping(false);
      }
    }, 20);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      let brandsData = [];
      
      try {
        const brandsRes = await brandAPI.getAll();
        brandsData = brandsRes.data || [];
      } catch (e) {
        console.log("Brands fetch failed, using empty state");
      }
      
      setBrands(brandsData);
      if (brandsData.length > 0) {
        setSelectedBrand(brandsData[0].id);
        await loadSavedIdeas(brandsData[0].id);
      }
    } catch (error) {
      console.error("Failed to load brands:", error);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedIdeas = async (brandId) => {
    try {
      const response = await ideaAPI.getAll(brandId, "saved");
      setSavedIdeas(response.data || []);
    } catch (error) {
      console.error("Failed to load saved ideas:", error);
      setSavedIdeas([]);
    }
  };

  const generateNewIdea = async () => {
    if (!selectedBrand) {
      toast.error("Please select a brand first");
      return;
    }

    setGenerating(true);
    setCurrentIdea(null);
    setDisplayedText("");

    try {
      const response = await ideaAPI.generate(selectedBrand, ideaType);
      setCurrentIdea(response.data);
    } catch (error) {
      console.error("Failed to generate idea:", error);
      toast.error("Failed to generate idea");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveIdea = async () => {
    if (!currentIdea) return;

    try {
      await ideaAPI.save(selectedBrand, currentIdea);
      toast.success("Idea saved!");
      loadSavedIdeas(selectedBrand);
    } catch (error) {
      toast.error("Failed to save idea");
    }
  };

  const handleCreateNow = () => {
    if (currentIdea) {
      localStorage.setItem("ideaForPost", JSON.stringify(currentIdea));
      navigate("/create-post");
      toast.success("Creating post from this idea...");
    }
  };

  const handleScheduleLater = () => {
    if (currentIdea) {
      localStorage.setItem("ideaForSchedule", JSON.stringify(currentIdea));
      navigate("/calendar");
      toast.success("Redirecting to scheduler...");
    }
  };

  const handleDeleteSavedIdea = async (ideaId) => {
    try {
      await ideaAPI.delete(ideaId);
      setSavedIdeas(savedIdeas.filter((i) => i.id !== ideaId));
      toast.success("Idea removed");
    } catch (error) {
      toast.error("Failed to remove idea");
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading idea engine..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Idea Engine</h1>
          <p className="text-lg text-slate-600">AI-powered content ideas for your café</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generator Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Idea Type Selector */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">What kind of idea?</h2>
              <div className="flex flex-wrap gap-2">
                {ideaTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setIdeaType(type.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      ideaType === type.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <Button
                data-testid="generate-idea-btn"
                onClick={generateNewIdea}
                disabled={generating || !selectedBrand}
                className="w-full mt-6 rounded-full py-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:scale-105 transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Generate Idea
                  </>
                )}
              </Button>
            </div>

            {/* Idea Display with Typewriter */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 min-h-[300px]">
              {generating ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-amber-600 animate-pulse" />
                  </div>
                  <p className="text-slate-600">Brewing creative ideas...</p>
                </div>
              ) : currentIdea ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium text-amber-600">AI Generated Idea</span>
                    {isTyping && (
                      <span className="inline-block w-2 h-5 bg-amber-500 animate-pulse ml-1" />
                    )}
                  </div>

                  <div className="prose prose-slate max-w-none">
                    <p className="text-lg text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {displayedText}
                    </p>
                  </div>

                  {!isTyping && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                      <Button
                        data-testid="save-idea-btn"
                        onClick={handleSaveIdea}
                        variant="outline"
                        className="rounded-full"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        data-testid="create-now-btn"
                        onClick={handleCreateNow}
                        className="rounded-full bg-indigo-600"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Create Now
                      </Button>
                      <Button
                        data-testid="schedule-later-btn"
                        onClick={handleScheduleLater}
                        variant="outline"
                        className="rounded-full"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Later
                      </Button>
                      <Button
                        onClick={generateNewIdea}
                        variant="ghost"
                        className="rounded-full ml-auto"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        New Idea
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Lightbulb className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to inspire</h3>
                  <p className="text-slate-600">Click Generate Idea to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Saved Ideas Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Saved Ideas</h2>
              <span className="text-sm text-slate-500">{savedIdeas.length} saved</span>
            </div>

            {savedIdeas.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No saved ideas yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {savedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="group p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <p className="text-sm text-slate-700 line-clamp-3">{idea.idea}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">
                        {new Date(idea.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteSavedIdea(idea.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
