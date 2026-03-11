import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Film,
  Clapperboard,
  Camera,
  Music,
  Upload,
  Loader2,
  Download,
  Calendar,
  Check,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const reelStyles = [
  {
    id: "cinematic",
    name: "Cinematic Product Showcase",
    icon: Clapperboard,
    description: "Dramatic, visually stunning, premium feel with emotional hooks",
    gradient: "from-purple-500 to-indigo-600"
  },
  {
    id: "casual",
    name: "Casual Behind The Scenes",
    icon: Camera,
    description: "Relaxed, friendly, authentic vibe with natural feel",
    gradient: "from-orange-400 to-pink-500"
  }
];

const languages = ["English", "Hindi", "Bengali"];

const progressStages = [
  "Analyzing brief...",
  "Generating visuals...",
  "Building frames...",
  "Adding music...",
  "Finalizing reel..."
];

export default function ReelGenerationPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [step, setStep] = useState("style"); // style, form, generating, preview
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [brandDna, setBrandDna] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  
  // Form state
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [brief, setBrief] = useState("");
  const [musicChoice, setMusicChoice] = useState("auto");
  const [language, setLanguage] = useState("English");
  
  // Progress state
  const [progressStage, setProgressStage] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Result state
  const [result, setResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/brand-dna");
      setBrandDna(response.data);
      setMenuItems(response.data?.menu_items || []);
      setLanguage(response.data?.language || "English");
    } catch (error) {
      console.error("Failed to load brand DNA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setStep("form");
  };

  const handleGenerate = async () => {
    if (!selectedStyle) {
      toast.error("Please select a reel style");
      return;
    }

    setStep("generating");
    setGenerating(true);
    setProgressStage(0);
    setProgressPercent(0);

    try {
      // Start generation - returns immediately with job_id
      const startResponse = await api.post("/reels/generate", {
        style: selectedStyle.id,
        product: selectedMenuItem,
        brief: brief,
        music_mood: musicChoice === "auto" ? "upbeat" : "calm",
        language: language
      });

      const jobId = startResponse.data.job_id;
      
      if (!jobId) {
        // Old API response - direct result
        if (startResponse.data.video_base64) {
          setProgressPercent(100);
          setProgressStage(progressStages.length - 1);
          setResult(startResponse.data);
          setStep("preview");
          toast.success("Reel generated successfully!");
          setGenerating(false);
          return;
        }
        throw new Error("Invalid response from server");
      }

      toast.info("Your reel is being created...");

      // Poll for status every 3 seconds
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await api.get(`/reels/status/${jobId}`);
          const { status, progress, result: jobResult, error } = statusResponse.data;

          setProgressPercent(progress || 0);
          
          // Update stage based on progress
          if (progress < 20) setProgressStage(0);
          else if (progress < 40) setProgressStage(1);
          else if (progress < 60) setProgressStage(2);
          else if (progress < 80) setProgressStage(3);
          else setProgressStage(4);

          if (status === "completed" && jobResult) {
            clearInterval(pollInterval);
            setProgressPercent(100);
            setProgressStage(progressStages.length - 1);
            setResult(jobResult);
            setStep("preview");
            toast.success("Reel generated successfully!");
            setGenerating(false);
          } else if (status === "failed") {
            clearInterval(pollInterval);
            toast.error(error || "Failed to generate reel");
            setStep("form");
            setGenerating(false);
          }
        } catch (pollError) {
          console.error("Poll error:", pollError);
          // Continue polling unless it's a 404
          if (pollError.response?.status === 404) {
            clearInterval(pollInterval);
            toast.error("Generation job not found");
            setStep("form");
            setGenerating(false);
          }
        }
      }, 3000);

      // Timeout after 3 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (generating) {
          toast.error("Generation timed out. Please try again.");
          setStep("form");
          setGenerating(false);
        }
      }, 180000);

    } catch (error) {
      console.error("Reel generation failed:", error);
      const errorMsg = error.response?.data?.detail || "Failed to start reel generation";
      toast.error(errorMsg);
      setStep("form");
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (result?.video_base64) {
      const link = document.createElement("a");
      link.href = `data:video/mp4;base64,${result.video_base64}`;
      link.download = `frameflow-reel-${Date.now()}.mp4`;
      link.click();
      toast.success("Downloaded!");
    }
  };

  const handleSchedule = () => {
    if (result) {
      localStorage.setItem("scheduleReel", JSON.stringify({
        video_base64: result.video_base64,
        caption: result.caption,
        hashtags: result.hashtags
      }));
      navigate("/calendar");
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
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
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
              <Film className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-outfit text-slate-900">Create Reel</h1>
              <p className="text-slate-600">AI-powered video reels for your brand</p>
            </div>
          </div>
        </div>

        {/* Step 1: Style Selection */}
        {step === "style" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Choose a Style</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reelStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleSelect(style)}
                  className="group relative bg-white rounded-2xl p-6 border border-slate-100 hover:border-indigo-300 hover:shadow-xl transition-all text-left"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <style.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{style.name}</h3>
                  <p className="text-slate-600">{style.description}</p>
                  <div className="mt-4 flex items-center text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Select style <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              ))}
            </div>
            
            <p className="text-center text-slate-500 text-sm mt-4">
              Reels cost <span className="font-bold text-indigo-600">5 credits</span>
            </p>
          </div>
        )}

        {/* Step 2: Form */}
        {step === "form" && selectedStyle && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setStep("style")} className="mb-4">
              ← Back to styles
            </Button>

            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedStyle.gradient} flex items-center justify-center`}>
                  <selectedStyle.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedStyle.name}</h3>
                  <p className="text-sm text-slate-600">{selectedStyle.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Menu Item Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Select Product</Label>
                  <select
                    value={selectedMenuItem}
                    onChange={(e) => setSelectedMenuItem(e.target.value)}
                    className="w-full p-3 border rounded-xl text-sm"
                  >
                    <option value="">Choose from your menu...</option>
                    {menuItems?.map((item, i) => (
                      <option key={i} value={item.id || item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brief */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Brief (Optional)</Label>
                  <Textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="E.g., 'Focus on the latte art', 'Show the making process', 'Highlight seasonal ingredients'..."
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                {/* Music Choice */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Music</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMusicChoice("auto")}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        musicChoice === "auto"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Music className={`w-5 h-5 ${musicChoice === "auto" ? "text-indigo-600" : "text-slate-400"}`} />
                      <div className="text-left">
                        <p className={`font-medium ${musicChoice === "auto" ? "text-indigo-600" : "text-slate-700"}`}>
                          Auto royalty-free
                        </p>
                        <p className="text-xs text-slate-500">Café lofi jazz</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setMusicChoice("none")}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        musicChoice === "none"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Upload className={`w-5 h-5 ${musicChoice === "none" ? "text-indigo-600" : "text-slate-400"}`} />
                      <div className="text-left">
                        <p className={`font-medium ${musicChoice === "none" ? "text-indigo-600" : "text-slate-700"}`}>
                          No music
                        </p>
                        <p className="text-xs text-slate-500">Add later</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Language */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Text Overlay Language</Label>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          language === lang
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-6 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Film className="w-5 h-5 mr-2" />
                  Generate Reel (5 credits)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div 
                className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"
                style={{ animationDuration: '1.5s' }}
              ></div>
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <Film className="w-12 h-12 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-4">Creating your reel...</h2>
            
            {/* Progress stages */}
            <div className="w-full max-w-md mb-6">
              {progressStages.map((stage, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-3 py-2 transition-opacity ${
                    i <= progressStage ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    i < progressStage 
                      ? 'bg-green-500' 
                      : i === progressStage 
                        ? 'bg-indigo-500 animate-pulse' 
                        : 'bg-slate-200'
                  }`}>
                    {i < progressStage ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs text-white font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${i === progressStage ? 'text-indigo-600 font-medium' : 'text-slate-600'}`}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">{progressPercent}% complete</p>
            <p className="text-xs text-slate-400 mt-4">This usually takes 60-90 seconds</p>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === "preview" && result && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => { setStep("style"); setResult(null); }}>
              ← Create Another
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Video Preview */}
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-[9/16] max-h-[600px]">
                <video
                  ref={videoRef}
                  src={`data:video/mp4;base64,${result.video_base64}`}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <button
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                >
                  {isPlaying ? (
                    <Pause className="w-16 h-16 text-white" />
                  ) : (
                    <Play className="w-16 h-16 text-white" />
                  )}
                </button>
                
                {/* Duration badge */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 rounded-full">
                  <span className="text-white text-sm font-medium">{result.duration}s</span>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">Reel Created!</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Style: <span className="font-medium text-slate-700 capitalize">{selectedStyle?.name}</span>
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-2">Caption</h3>
                  <p className="text-slate-600 text-sm">{result.caption}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-2">Hashtags</h3>
                  <div className="flex flex-wrap gap-1">
                    {result.hashtags?.map((tag, i) => (
                      <span key={i} className="text-xs text-indigo-600">
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
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
                </div>

                <Button
                  onClick={() => { setStep("style"); setResult(null); }}
                  className="w-full rounded-full py-5 bg-indigo-600"
                >
                  <Film className="w-4 h-4 mr-2" />
                  Create Another Reel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
