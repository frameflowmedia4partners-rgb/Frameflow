import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Image as ImageIcon, Video, FileText, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateContentPage() {
  const [selectedType, setSelectedType] = useState(null);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [projectName, setProjectName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("engaging");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await axios.get(`${API}/brands`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBrands(response.data);
      if (response.data.length > 0) {
        setSelectedBrand(response.data[0].id);
      }
    } catch (error) {
      toast.error("Failed to load brands");
    }
  };

  const contentTypes = [
    { id: "image", name: "Image Post", icon: ImageIcon, description: "Generate marketing images" },
    { id: "video", name: "Video / Reel", icon: Video, description: "Create short videos" },
    { id: "caption", name: "Caption", icon: FileText, description: "Write engaging captions" }
  ];

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt");
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      let project = null;
      if (projectName) {
        const projectRes = await axios.post(
          `${API}/projects`,
          { brand_id: selectedBrand, name: projectName, type: selectedType },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        project = projectRes.data;
      }

      let response;
      if (selectedType === "caption") {
        response = await axios.post(
          `${API}/generate/caption`,
          { prompt, brand_id: selectedBrand, project_id: project?.id, platform, tone },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResult({ type: "caption", content: response.data.caption });
        toast.success("Caption generated!");
      } else if (selectedType === "image") {
        toast.info("Generating image... This may take up to 60 seconds");
        response = await axios.post(
          `${API}/generate/image`,
          { prompt, project_id: project?.id },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 90000 }
        );
        setResult({ type: "image", content: response.data.image_url });
        toast.success("Image generated!");
      } else if (selectedType === "video") {
        toast.info("Generating video... This may take up to 10 minutes");
        response = await axios.post(
          `${API}/generate/video`,
          { prompt, project_id: project?.id, duration: 4, size: "1280x720" },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 600000 }
        );
        setResult({ type: "video", content: response.data.video_url });
        toast.success("Video generated!");
      }

      if (project) {
        toast.info("Project saved! View it in Dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            data-testid="back-btn"
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold text-slate-900">Create Content</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-8">
        {!selectedType ? (
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">What do you want to create?</h1>
            <p className="text-lg text-slate-600 mb-8">Choose a content type to get started</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  data-testid={`content-type-${type.id}`}
                  onClick={() => setSelectedType(type.id)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 p-8 text-left group hover:border-indigo-200 hover:scale-105"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                    <type.icon className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-semibold font-outfit mb-2 text-slate-900">{type.name}</h3>
                  <p className="text-slate-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <Button
              onClick={() => {
                setSelectedType(null);
                setResult(null);
              }}
              variant="ghost"
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to content types
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-6">
                    Generate {contentTypes.find((t) => t.id === selectedType)?.name}
                  </h2>

                  {brands.length > 0 && (
                    <div className="mb-5">
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">Brand</Label>
                      <select
                        data-testid="brand-select"
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      >
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-5">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Project Name (Optional)
                    </Label>
                    <Input
                      data-testid="project-name-input"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                      placeholder="Summer Campaign 2026"
                    />
                  </div>

                  <div className="mb-5">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Prompt</Label>
                    <Textarea
                      data-testid="prompt-input"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base min-h-[120px]"
                      placeholder={
                        selectedType === "caption"
                          ? "Describe your post... e.g., Promote our new summer menu special"
                          : "Describe what you want to create... e.g., A cozy cafe with latte art"
                      }
                    />
                  </div>

                  {selectedType === "caption" && (
                    <>
                      <div className="mb-5">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Platform</Label>
                        <select
                          value={platform}
                          onChange={(e) => setPlatform(e.target.value)}
                          className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                        >
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="twitter">Twitter</option>
                          <option value="linkedin">LinkedIn</option>
                        </select>
                      </div>

                      <div className="mb-5">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Tone</Label>
                        <select
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                        >
                          <option value="engaging">Engaging</option>
                          <option value="professional">Professional</option>
                          <option value="playful">Playful</option>
                          <option value="inspiring">Inspiring</option>
                        </select>
                      </div>
                    </>
                  )}

                  <Button
                    data-testid="generate-btn"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full rounded-full px-8 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
                  <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-4">Preview</h3>
                  {generating && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center mb-4 animate-bounce-slow">
                        <Bot className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-slate-600">Framey is creating your content...</p>
                    </div>
                  )}
                  {!generating && !result && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <Sparkles className="w-16 h-16 mb-4" />
                      <p>Your generated content will appear here</p>
                    </div>
                  )}
                  {result && result.type === "caption" && (
                    <div data-testid="generated-caption" className="bg-slate-50 rounded-xl p-6 whitespace-pre-wrap">
                      {result.content}
                    </div>
                  )}
                  {result && result.type === "image" && (
                    <img
                      data-testid="generated-image"
                      src={result.content}
                      alt="Generated"
                      className="w-full rounded-xl shadow-lg"
                    />
                  )}
                  {result && result.type === "video" && (
                    <video
                      data-testid="generated-video"
                      src={result.content}
                      controls
                      className="w-full rounded-xl shadow-lg"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
