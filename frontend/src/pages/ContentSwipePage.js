import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import {
  X,
  Heart,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function ContentSwipePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("select"); // select, generating, swipe, complete
  const [count, setCount] = useState(null);
  const [creatives, setCreatives] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const countOptions = [2, 3, 5, 6];

  const handleCountSelect = async (selectedCount) => {
    setCount(selectedCount);
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
        return prev + 10;
      });
    }, 1000);

    try {
      const response = await api.post("/content-swipe/generate", { count: selectedCount });
      clearInterval(progressInterval);
      setProgress(100);
      
      if (response.data.creatives && response.data.creatives.length > 0) {
        setCreatives(response.data.creatives);
        setTimeout(() => {
          setStep("swipe");
        }, 500);
      } else {
        toast.error("No creatives generated. Please try again.");
        setStep("select");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Generation failed:", error);
      const errorMsg = error.response?.data?.detail || "Failed to generate creatives";
      toast.error(errorMsg);
      setStep("select");
    } finally {
      setGenerating(false);
    }
  };

  const handleSwipe = async (action) => {
    const current = creatives[currentIndex];
    
    // Save preference for AI learning
    try {
      await api.post("/content-swipe/save-preference", {
        post_id: current.id,
        action: action,
        style: current.mood_color,
        headline_type: current.headline?.split(" ").length > 4 ? "long" : "short",
      });
    } catch (e) {
      console.log("Preference save failed");
    }

    if (action === "save") {
      setSavedCount((prev) => prev + 1);
      
      // Save to library
      try {
        await api.post("/content-library", {
          type: "image",
          filename: `content-swipe-${Date.now()}.png`,
          data: `data:image/png;base64,${current.image_base64}`,
          caption: current.caption,
          hashtags: current.hashtags,
          source: "ai_generated",
          is_favourite: false,
        });
        toast.success("Saved to Library!");
      } catch (e) {
        console.log("Library save failed");
      }
    }

    if (currentIndex < creatives.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setStep("complete");
    }
  };

  const handleDownload = () => {
    const current = creatives[currentIndex];
    if (current?.image_base64) {
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${current.image_base64}`;
      link.download = `frameflow-${Date.now()}.png`;
      link.click();
      toast.success("Downloaded!");
    }
  };

  const currentCreative = creatives[currentIndex];

  return (
    <ClientLayout>
      <div className="flex flex-col items-center justify-center min-h-full p-8">
        {/* Step: Select Count */}
        {step === "select" && (
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-4">
              How many creatives to generate?
            </h1>
            <p className="text-slate-600 mb-8">
              AI will create unique posts based on your Brand DNA and menu items.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {countOptions.map((num) => (
                <button
                  key={num}
                  onClick={() => handleCountSelect(num)}
                  className="p-8 bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all group"
                >
                  <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-110 inline-block transition-transform">
                    {num}
                  </span>
                  <p className="text-slate-500 mt-2">creatives</p>
                </button>
              ))}
            </div>

            <p className="text-sm text-slate-500 mt-6">Each image post uses 1 credit</p>
          </div>
        )}

        {/* Step: Generating */}
        {step === "generating" && (
          <div className="text-center max-w-md">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Creating your content...</h2>
            <p className="text-slate-600 mb-6">
              AI is crafting {count} unique posts for your brand.
            </p>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">{progress}% complete</p>
          </div>
        )}

        {/* Step: Swipe */}
        {step === "swipe" && currentCreative && (
          <div className="w-full max-w-lg">
            {/* Counter */}
            <div className="text-center mb-6">
              <span className="text-sm font-medium text-slate-500">
                {currentIndex + 1} of {creatives.length}
              </span>
            </div>

            {/* Card */}
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Image */}
              <div className="aspect-square">
                <img
                  src={`data:image/png;base64,${currentCreative.image_base64}`}
                  alt="Generated post"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm mb-2">{currentCreative.caption}</p>
                <div className="flex flex-wrap gap-2">
                  {currentCreative.hashtags?.slice(0, 5).map((tag, i) => (
                    <span key={i} className="text-xs text-white/70">
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="absolute top-4 right-4 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <Download className="w-5 h-5 text-slate-700" />
              </button>
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
              Swipe right or click 💚 to save
            </p>
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Generation complete!</h2>
            <p className="text-slate-600 mb-2">
              You saved <span className="font-bold text-green-600">{savedCount}</span> out of{" "}
              <span className="font-bold">{creatives.length}</span> creatives.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              Your saved posts are now in your Library.
            </p>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate("/library")}
                className="rounded-full px-8 bg-indigo-600"
              >
                View in Library
              </Button>
              <Button
                onClick={() => {
                  setStep("select");
                  setCreatives([]);
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
