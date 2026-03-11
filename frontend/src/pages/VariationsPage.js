import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Loader2,
  Check,
  X,
  Heart,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function VariationsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("select"); // select, generating, swipe, complete
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [library, setLibrary] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [variations, setVariations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const response = await api.get("/content-library", {
        params: { source: "ai_generated" }
      });
      // Filter for posts with images
      const postsWithImages = (response.data || []).filter(item => 
        item.url?.startsWith("data:image") || item.url?.startsWith("http")
      );
      setLibrary(postsWithImages);
    } catch (error) {
      console.error("Failed to load library:", error);
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPost = (post) => {
    setSelectedPost(post);
  };

  const handleGenerateVariations = async () => {
    if (!selectedPost) {
      toast.error("Please select a post first");
      return;
    }

    setStep("generating");
    setGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 800);

    try {
      const response = await api.post("/variations/generate", {
        post_id: selectedPost.id,
        count: 3
      });
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.data.variations && response.data.variations.length > 0) {
        // Map variations to include the original post's image with new text
        const variationsWithImages = response.data.variations.map((v, i) => ({
          ...v,
          // Use original image as base (in real app, would regenerate)
          image_url: selectedPost.url,
          original_post: selectedPost
        }));
        setVariations(variationsWithImages);
        setTimeout(() => setStep("swipe"), 500);
      } else {
        toast.error("No variations generated");
        setStep("select");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Variation generation failed:", error);
      const errorMsg = error.response?.data?.detail || "Failed to generate variations";
      toast.error(errorMsg);
      setStep("select");
    } finally {
      setGenerating(false);
    }
  };

  const handleSwipe = async (action) => {
    const current = variations[currentIndex];

    if (action === "save") {
      setSavedCount((prev) => prev + 1);
      
      // Save variation to library
      try {
        await api.post("/content-library", {
          type: "image",
          filename: `variation-${Date.now()}.png`,
          data: current.image_url,
          caption: current.caption,
          source: "variation",
          original_id: selectedPost.id,
          is_favourite: false,
        });
        toast.success("Variation saved!");
      } catch (e) {
        console.log("Save failed");
      }
    }

    if (currentIndex < variations.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setStep("complete");
    }
  };

  const handleDownload = () => {
    const current = variations[currentIndex];
    if (current?.image_url) {
      const link = document.createElement("a");
      link.href = current.image_url;
      link.download = `frameflow-variation-${Date.now()}.png`;
      link.click();
      toast.success("Downloaded!");
    }
  };

  const currentVariation = variations[currentIndex];

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
        {/* Step: Select Post */}
        {step === "select" && (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <Layers className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900">Variations</h1>
                  <p className="text-sm md:text-base text-slate-600">Pick a saved post. AI generates fresh variations.</p>
                </div>
              </div>
            </div>

            {library.length === 0 ? (
              <div className="text-center py-12 bg-white/80 rounded-2xl border border-slate-100">
                <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No posts in library</h3>
                <p className="text-slate-600 mb-6">Create some content first using Content Swipe or Concept mode</p>
                <Button onClick={() => navigate("/content-swipe")} className="rounded-full bg-indigo-600">
                  Create Content
                </Button>
              </div>
            ) : (
              <>
                <p className="text-slate-600 mb-4">Select a post to generate variations:</p>
                
                {/* Library Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                  {library.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectPost(item)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all ${
                        selectedPost?.id === item.id
                          ? "border-indigo-500 ring-4 ring-indigo-200"
                          : "border-transparent hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-full h-full object-cover"
                      />
                      {selectedPost?.id === item.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateVariations}
                  disabled={!selectedPost || generating}
                  className="w-full py-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Layers className="w-5 h-5 mr-2" />
                      Generate 3 Variations
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step: Generating */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Creating variations...</h2>
            <p className="text-slate-600 mb-6">AI is generating fresh takes on your post.</p>
            <div className="w-64 h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">{progress}% complete</p>
          </div>
        )}

        {/* Step: Swipe */}
        {step === "swipe" && currentVariation && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            {/* Counter */}
            <div className="text-center mb-6">
              <span className="text-sm font-medium text-slate-500">
                Variation {currentIndex + 1} of {variations.length}
              </span>
            </div>

            {/* Card */}
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Image */}
              <div className="aspect-square relative">
                <img
                  src={currentVariation.image_url}
                  alt="Variation"
                  className="w-full h-full object-cover"
                />
                {/* Overlay with new text */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-bold text-xl mb-1">{currentVariation.headline}</p>
                  <p className="text-white/80 text-sm">{currentVariation.tagline}</p>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="absolute top-4 right-4 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <Download className="w-5 h-5 text-slate-700" />
                </button>
              </div>

              {/* Variation Info */}
              <div className="p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium capitalize">
                    {currentVariation.angle} angle
                  </span>
                </div>
                <p className="text-slate-600 text-sm">{currentVariation.caption}</p>
              </div>
            </div>

            {/* Swipe Buttons */}
            <div className="flex items-center justify-center gap-8 mt-8">
              <button
                onClick={() => handleSwipe("discard")}
                className="w-16 h-16 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors group"
              >
                <X className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={() => handleSwipe("save")}
                className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 transition-all group"
              >
                <Heart className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <p className="text-center text-slate-500 text-sm mt-4">
              Click 💚 to save variation
            </p>
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">All done!</h2>
            <p className="text-slate-600 mb-2">
              You saved <span className="font-bold text-green-600">{savedCount}</span> out of{" "}
              <span className="font-bold">{variations.length}</span> variations.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              Check your Library to view saved variations.
            </p>

            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/library")}
                className="rounded-full px-8 bg-indigo-600"
              >
                View in Library
              </Button>
              <Button
                onClick={() => {
                  setStep("select");
                  setSelectedPost(null);
                  setVariations([]);
                  setCurrentIndex(0);
                  setSavedCount(0);
                }}
                variant="outline"
                className="rounded-full px-8"
              >
                Create More
              </Button>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
