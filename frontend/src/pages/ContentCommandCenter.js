import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Sparkles,
  Send,
  Clock,
  Save,
  Upload,
  Calendar,
  Instagram,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  Wand2,
  Film,
  Zap,
  Coffee,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { brandAPI, contentAPI, mediaAPI } from "@/services/api";
import api from "@/services/api";

export default function ContentCommandCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  
  // Content creation state
  const [contentType, setContentType] = useState("post");
  const [topic, setTopic] = useState("");
  const [promotionDetails, setPromotionDetails] = useState("");
  const [generatedContent, setGeneratedContent] = useState(null);
  
  // Reel generation state
  const [showReelDialog, setShowReelDialog] = useState(false);
  const [reelTheme, setReelTheme] = useState("");
  const [reelDuration, setReelDuration] = useState(30);
  const [clipsDescription, setClipsDescription] = useState("");
  const [reelConcept, setReelConcept] = useState(null);
  
  // Schedule dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("18:30");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const brandsRes = await brandAPI.getAll();
      setBrands(brandsRes.data || []);
      if (brandsRes.data?.length > 0) {
        setSelectedBrand(brandsRes.data[0]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!selectedBrand) {
      toast.error("Please select a brand first");
      return;
    }
    if (!topic.trim()) {
      toast.error("Please enter a topic or prompt");
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post("/cafe/generate-content", {
        brand_id: selectedBrand.id,
        content_type: contentType,
        topic: topic,
        promotion_details: promotionDetails || null
      });

      setGeneratedContent({
        type: contentType,
        content: response.data.generated_content,
        content_id: response.data.content_id
      });
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error("Failed to generate content:", error);
      toast.error("Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReel = async () => {
    if (!selectedBrand) {
      toast.error("Please select a brand first");
      return;
    }
    if (!reelTheme.trim()) {
      toast.error("Please enter a reel theme");
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post("/reels/generate-concept", {
        brand_id: selectedBrand.id,
        theme: reelTheme,
        clips_description: clipsDescription || null,
        duration_seconds: reelDuration
      });

      setReelConcept(response.data);
      setShowReelDialog(false);
      setGeneratedContent({
        type: "reel",
        content: response.data.concept,
        content_id: response.data.reel_id
      });
      toast.success("Reel concept generated!");
    } catch (error) {
      console.error("Failed to generate reel:", error);
      toast.error("Failed to generate reel concept");
    } finally {
      setGenerating(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!generatedContent || !scheduleDate) {
      toast.error("Please generate content and select a date");
      return;
    }

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);

    try {
      await api.post("/scheduled-posts", {
        content_type: generatedContent.type === "post" ? "image" : generatedContent.type,
        caption: generatedContent.content,
        scheduled_at: scheduledAt.toISOString(),
        platform: "instagram",
        brand_id: selectedBrand?.id
      });

      toast.success("Post scheduled successfully!");
      setShowScheduleDialog(false);
      navigate("/calendar");
    } catch (error) {
      toast.error("Failed to schedule post");
    }
  };

  const handleCopyContent = () => {
    if (generatedContent?.content) {
      navigator.clipboard.writeText(generatedContent.content);
      toast.success("Content copied to clipboard!");
    }
  };

  const handlePostNow = async () => {
    toast.info("To post directly, connect your Instagram account in Integrations");
    navigate("/integrations");
  };

  const handleSaveDraft = async () => {
    if (!generatedContent) return;
    
    try {
      await api.post("/scheduled-posts", {
        content_type: generatedContent.type === "post" ? "image" : generatedContent.type,
        caption: generatedContent.content,
        scheduled_at: new Date().toISOString(),
        platform: "instagram",
        brand_id: selectedBrand?.id,
        status: "draft"
      });
      toast.success("Saved as draft!");
    } catch (error) {
      toast.error("Failed to save draft");
    }
  };

  const contentTypes = [
    { id: "post", icon: ImageIcon, label: "Post", desc: "Instagram feed post" },
    { id: "reel", icon: Film, label: "Reel", desc: "Short video content" },
    { id: "story", icon: Zap, label: "Story", desc: "24-hour content" },
    { id: "ad", icon: Coffee, label: "Ad", desc: "Promotional content" },
  ];

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading content studio..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Content Command Center</h1>
          <p className="text-lg text-slate-600">Create, schedule, and publish café content with AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content Creation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Brand Selector */}
            {brands.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <Label className="text-sm font-medium text-slate-700 mb-3 block">Select Brand</Label>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => setSelectedBrand(brand)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all whitespace-nowrap ${
                        selectedBrand?.id === brand.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-900">{brand.name}</div>
                        <div className="text-xs text-slate-500 capitalize">{brand.tone || "Café"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content Type Selector */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <Label className="text-sm font-medium text-slate-700 mb-3 block">Content Type</Label>
              <div className="grid grid-cols-4 gap-3">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      if (type.id === "reel") {
                        setShowReelDialog(true);
                      } else {
                        setContentType(type.id);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-center group ${
                      contentType === type.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <type.icon className={`w-6 h-6 mx-auto mb-2 ${
                      contentType === type.id ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500"
                    }`} />
                    <div className={`font-medium ${contentType === type.id ? "text-indigo-700" : "text-slate-700"}`}>
                      {type.label}
                    </div>
                    <div className="text-xs text-slate-500">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    What do you want to post about?
                  </Label>
                  <Textarea
                    data-testid="content-topic-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="E.g., New pumpkin spice latte launch, Weekend brunch special, Cozy autumn vibes..."
                    className="min-h-[100px] text-base"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Promotion Details (optional)
                  </Label>
                  <Input
                    value={promotionDetails}
                    onChange={(e) => setPromotionDetails(e.target.value)}
                    placeholder="E.g., 20% off today only, Buy one get one free, Limited time offer..."
                  />
                </div>

                <Button
                  data-testid="generate-content-btn"
                  onClick={handleGenerateContent}
                  disabled={generating || !topic.trim()}
                  className="w-full rounded-xl py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate {contentType === "post" ? "Post" : contentType === "story" ? "Story" : "Ad"} Content
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Generated Content */}
            {generatedContent && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-in fade-in slide-in-from-bottom duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold font-outfit text-slate-900 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-indigo-600" />
                    Generated {generatedContent.type === "post" ? "Post" : generatedContent.type === "reel" ? "Reel Concept" : "Content"}
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyContent} className="rounded-lg">
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGenerateContent} disabled={generating} className="rounded-lg">
                      <RefreshCw className={`w-4 h-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
                      Regenerate
                    </Button>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 mb-6 max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-slate-700 font-sans text-sm leading-relaxed">
                    {generatedContent.content}
                  </pre>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    data-testid="post-now-btn"
                    onClick={handlePostNow}
                    className="rounded-xl py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Post Now
                  </Button>
                  <Button
                    data-testid="schedule-btn"
                    onClick={() => setShowScheduleDialog(true)}
                    variant="outline"
                    className="rounded-xl py-4"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                  <Button
                    onClick={handleSaveDraft}
                    variant="outline"
                    className="rounded-xl py-4"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    onClick={() => navigate("/media")}
                    variant="outline"
                    className="rounded-xl py-4"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Media
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions & Tips */}
          <div className="space-y-6">
            {/* Quick Generate */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Quick Generate</h3>
              <div className="space-y-3">
                {[
                  { label: "Daily Special", prompt: "Today's featured drink special" },
                  { label: "Morning Vibes", prompt: "Cozy morning coffee atmosphere" },
                  { label: "Weekend Promo", prompt: "Weekend brunch special offer" },
                  { label: "New Menu Item", prompt: "Exciting new addition to our menu" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTopic(item.prompt);
                      setContentType("post");
                    }}
                    className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reel Ideas */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold font-outfit text-slate-900 mb-4 flex items-center gap-2">
                <Film className="w-5 h-5 text-pink-500" />
                Trending Reel Ideas
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Latte Art Pour", desc: "Satisfying coffee art" },
                  { label: "Day in the Life", desc: "Behind the scenes" },
                  { label: "ASMR Coffee", desc: "Brewing sounds" },
                  { label: "Menu Reveal", desc: "New item showcase" },
                ].map((idea, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setReelTheme(idea.label);
                      setShowReelDialog(true);
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-pink-300 hover:bg-pink-50 transition-all"
                  >
                    <div className="font-medium text-slate-900">{idea.label}</div>
                    <div className="text-xs text-slate-500">{idea.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  Post during peak café hours: 7-9 AM & 6-8 PM
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  Use warm, inviting language
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  Include café-specific hashtags
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  Reels get 2x more engagement
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Reel Generation Dialog */}
      <Dialog open={showReelDialog} onOpenChange={setShowReelDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-outfit text-2xl flex items-center gap-2">
              <Film className="w-6 h-6 text-pink-500" />
              Generate Reel Concept
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Reel Theme / Idea</Label>
              <Input
                value={reelTheme}
                onChange={(e) => setReelTheme(e.target.value)}
                placeholder="E.g., Latte art pour, Behind the scenes, New drink reveal..."
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>Available Clips (optional)</Label>
              <Textarea
                value={clipsDescription}
                onChange={(e) => setClipsDescription(e.target.value)}
                placeholder="Describe what footage you have available..."
                className="mt-2"
              />
            </div>

            <div>
              <Label>Target Duration</Label>
              <div className="flex gap-2 mt-2">
                {[15, 30, 60].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setReelDuration(duration)}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      reelDuration === duration
                        ? "border-pink-500 bg-pink-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className={`font-bold ${reelDuration === duration ? "text-pink-600" : "text-slate-700"}`}>
                      {duration}s
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerateReel}
              disabled={generating || !reelTheme.trim()}
              className="w-full rounded-xl py-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Reel Concept...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Reel Concept
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit text-2xl">Schedule Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                Recommended: 6:30 PM for highest engagement
              </p>
            </div>
            <Button
              onClick={handleSchedulePost}
              disabled={!scheduleDate}
              className="w-full rounded-xl py-6 bg-indigo-600"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
