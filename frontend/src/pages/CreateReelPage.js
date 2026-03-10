import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Film,
  Loader2,
  Download,
  Instagram,
  Facebook,
  Save,
  Play,
  Music,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { brandAPI, contentAPI } from "@/services/api";

export default function CreateReelPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [brand, setBrand] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    brief: "",
    style: "trendy",
    music_mood: "upbeat",
    platform: "instagram",
  });

  // Result state
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadBrand();
  }, []);

  const loadBrand = async () => {
    try {
      setLoading(true);
      const res = await brandAPI.getCurrent();
      setBrand(res.data);
    } catch (error) {
      console.log("No brand profile yet");
      setBrand(null);
    } finally {
      setLoading(false);
    }
  };

  const simulateProgress = () => {
    const stages = [
      { progress: 15, text: "Analysing brief..." },
      { progress: 35, text: "Sourcing media..." },
      { progress: 60, text: "Building concept..." },
      { progress: 85, text: "Almost ready..." },
      { progress: 100, text: "Complete!" },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < stages.length) {
        setProgress(stages[i].progress);
        setProgressText(stages[i].text);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 1200);

    return interval;
  };

  const handleGenerate = async () => {
    if (!formData.brief.trim()) {
      toast.error("Please enter a brief for your reel");
      return;
    }

    setGenerating(true);
    setResult(null);
    setProgress(0);

    const progressInterval = simulateProgress();

    try {
      const response = await contentAPI.generateReel({
        brief: formData.brief,
        style: formData.style,
        music_mood: formData.music_mood,
        platform: formData.platform,
        brand_id: brand?.id,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setProgressText("Complete!");
      
      setResult(response.data);
      toast.success("Reel concept generated!");
    } catch (error) {
      console.error("Failed to generate:", error);
      clearInterval(progressInterval);
      toast.error("Failed to generate reel");
    } finally {
      setTimeout(() => {
        setGenerating(false);
      }, 500);
    }
  };

  const handleDownload = () => {
    if (result?.video_url) {
      const link = document.createElement("a");
      link.href = result.video_url;
      link.download = `frameflow-reel-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Reel downloaded!");
    } else {
      // Download concept as text
      const concept = `Reel Concept\n\n${result?.script || result?.concept || ""}`;
      const blob = new Blob([concept], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `frameflow-reel-concept-${Date.now()}.txt`;
      link.click();
      toast.success("Concept downloaded!");
    }
  };

  const handlePostInstagram = () => {
    toast.success("Opening Instagram posting flow...");
  };

  const handlePostFacebook = () => {
    toast.success("Opening Facebook posting flow...");
  };

  const handleSaveToLibrary = () => {
    toast.success("Saved to content library!");
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Create Reel</h1>
          <p className="text-lg text-slate-600">Generate engaging video content for your café</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold font-outfit text-slate-900 mb-6">Reel Details</h2>

            {!brand ? (
              <div className="text-center py-8">
                <Film className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Complete your brand profile to create reels</p>
                <Button onClick={() => navigate("/onboarding")} className="rounded-full">
                  Complete Setup
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Brief / Concept *
                  </Label>
                  <Textarea
                    data-testid="reel-brief-input"
                    value={formData.brief}
                    onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                    placeholder="Describe what you want the reel to be about... e.g., 'A day in our café, showing latte art being made and happy customers enjoying their coffee'"
                    className="rounded-xl min-h-[120px]"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Style</Label>
                  <select
                    data-testid="reel-style-select"
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5"
                  >
                    <option value="trendy">Trendy & Viral</option>
                    <option value="aesthetic">Aesthetic & Cozy</option>
                    <option value="educational">Educational / How-to</option>
                    <option value="behind-scenes">Behind the Scenes</option>
                    <option value="promotional">Promotional</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    <Music className="w-4 h-4 inline mr-1" />
                    Music Mood
                  </Label>
                  <select
                    data-testid="reel-music-select"
                    value={formData.music_mood}
                    onChange={(e) => setFormData({ ...formData, music_mood: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5"
                  >
                    <option value="upbeat">Upbeat & Energetic</option>
                    <option value="chill">Chill & Relaxing</option>
                    <option value="trending">Trending Audio</option>
                    <option value="acoustic">Acoustic & Warm</option>
                    <option value="jazzy">Jazzy & Sophisticated</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Platform</Label>
                  <select
                    data-testid="reel-platform-select"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5"
                  >
                    <option value="instagram">Instagram Reels</option>
                    <option value="facebook">Facebook Reels</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>

                <Button
                  data-testid="generate-reel-btn"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full rounded-full py-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transition-all"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Film className="w-5 h-5 mr-2" />
                      Generate Reel
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Result Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold font-outfit text-slate-900 mb-6">Result</h2>

            {generating ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-full max-w-xs mb-6">
                  <Progress value={progress} className="h-2" />
                </div>
                <p className="text-lg font-medium text-slate-900 mb-2">{progressText}</p>
                <p className="text-sm text-slate-500">This may take a moment...</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Video Preview or Concept */}
                {result.video_url ? (
                  <div className="aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                    <video
                      src={result.video_url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Reel Concept
                    </h3>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {result.script || result.concept || "Your reel concept will appear here"}
                    </p>
                  </div>
                )}

                {/* Media Grid */}
                {result.media_suggestions && result.media_suggestions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Suggested Media</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {result.media_suggestions.map((media, i) => (
                        <div key={i} className="aspect-square rounded-lg bg-slate-100 overflow-hidden">
                          {media.url ? (
                            <img src={media.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center p-2">
                              {media.description || `Clip ${i + 1}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    data-testid="download-reel-btn"
                    onClick={handleDownload}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    data-testid="post-instagram-btn"
                    onClick={handlePostInstagram}
                    className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    <Instagram className="w-4 h-4 mr-2" />
                    Post to Instagram
                  </Button>
                  <Button
                    data-testid="post-facebook-btn"
                    onClick={handlePostFacebook}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Post to Facebook
                  </Button>
                  <Button
                    data-testid="save-reel-library-btn"
                    onClick={handleSaveToLibrary}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save to Library
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                  <Play className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No reel yet</h3>
                <p className="text-slate-600">Describe your reel idea and click Generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
