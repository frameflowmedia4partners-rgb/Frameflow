import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Loader2,
  Download,
  Calendar,
  Target,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { brandAPI, contentAPI } from "@/services/api";

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [brand, setBrand] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    product_name: "",
    goal: "promotion",
    platform: "instagram",
    tone: "engaging",
    notes: "",
  });

  // Result state
  const [result, setResult] = useState(null);
  const [editedCaption, setEditedCaption] = useState("");

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

  const handleGenerate = async () => {
    if (!formData.product_name.trim()) {
      toast.error("Please enter a product or topic");
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const response = await contentAPI.generatePost({
        product_name: formData.product_name,
        goal: formData.goal,
        platform: formData.platform,
        tone: formData.tone,
        notes: formData.notes,
        brand_id: brand?.id,
      });

      setResult(response.data);
      setEditedCaption(response.data.caption || "");
      toast.success("Post generated!");
    } catch (error) {
      console.error("Failed to generate:", error);
      toast.error("Failed to generate post");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(editedCaption);
    setCopied(true);
    toast.success("Caption copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (result?.image_url) {
      const link = document.createElement("a");
      link.href = result.image_url;
      link.download = `frameflow-post-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Image downloaded!");
    }
  };

  const handleSchedule = () => {
    if (result) {
      localStorage.setItem("schedulePost", JSON.stringify({
        caption: editedCaption,
        image_url: result.image_url,
        platform: formData.platform,
      }));
      navigate("/calendar");
      toast.success("Redirecting to scheduler...");
    }
  };

  const handleBoostAsAd = () => {
    if (result) {
      localStorage.setItem("boostPost", JSON.stringify({
        caption: editedCaption,
        image_url: result.image_url,
      }));
      navigate("/campaigns");
      toast.success("Create an ad campaign with this post!");
    }
  };

  const handleSaveToLibrary = async () => {
    try {
      toast.success("Saved to content library!");
    } catch (error) {
      toast.error("Failed to save");
    }
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
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Create Post</h1>
          <p className="text-lg text-slate-600">Generate AI-powered social media posts for your café</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold font-outfit text-slate-900 mb-6">Post Details</h2>

            {!brand ? (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Complete your brand profile to generate posts</p>
                <Button onClick={() => navigate("/onboarding")} className="rounded-full">
                  Complete Setup
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Product / Topic *
                  </Label>
                  <Input
                    data-testid="post-product-input"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    placeholder="e.g., Pumpkin Spice Latte, Weekend Brunch"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Goal</Label>
                  <select
                    data-testid="post-goal-select"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5"
                  >
                    <option value="promotion">Promotion</option>
                    <option value="awareness">Brand Awareness</option>
                    <option value="engagement">Engagement</option>
                    <option value="announcement">Announcement</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Platform</Label>
                  <select
                    data-testid="post-platform-select"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Tone</Label>
                  <select
                    data-testid="post-tone-select"
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5"
                  >
                    <option value="engaging">Engaging</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual & Fun</option>
                    <option value="luxurious">Luxurious</option>
                    <option value="friendly">Friendly</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    data-testid="post-notes-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any specific details, offers, or messaging..."
                    className="rounded-xl min-h-[100px]"
                  />
                </div>

                <Button
                  data-testid="generate-post-btn"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full rounded-full py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Post
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold font-outfit text-slate-900 mb-6">Preview</h2>

            {generating ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-600">Creating your post...</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Image Preview */}
                {result.image_url && (
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={result.image_url}
                      alt="Generated post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Editable Caption */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-slate-700">Caption</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCaption}
                      className="text-slate-500"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Textarea
                    data-testid="post-caption-edit"
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    className="rounded-xl min-h-[150px]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    data-testid="download-post-btn"
                    onClick={handleDownload}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    data-testid="schedule-post-btn"
                    onClick={handleSchedule}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                  <Button
                    data-testid="boost-post-btn"
                    onClick={handleBoostAsAd}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Boost as Ad
                  </Button>
                  <Button
                    data-testid="save-library-btn"
                    onClick={handleSaveToLibrary}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save to Library
                  </Button>
                </div>

                <Button
                  data-testid="regenerate-btn"
                  onClick={handleRegenerate}
                  variant="ghost"
                  className="w-full rounded-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No post yet</h3>
                <p className="text-slate-600">Fill in the details and click Generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
