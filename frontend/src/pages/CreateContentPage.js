import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Sparkles, Loader2, Download, Copy, RefreshCw, Image as ImageIcon, Video, FileText } from "lucide-react";
import { toast } from "sonner";

export default function CreateContentPage() {
  const [brands, setBrands] = useState([]);
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [contentType, setContentType] = useState("caption");
  
  // Prompt builder fields
  const [goal, setGoal] = useState("promotion");
  const [product, setProduct] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("engaging");
  const [contentStyle, setContentStyle] = useState("post");
  const [customPrompt, setCustomPrompt] = useState("");
  
  // Generation state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [currentContentId, setCurrentContentId] = useState(null);
  
  // Editing
  const [editCommand, setEditCommand] = useState("");
  const [editing, setEditing] = useState(false);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadData();
    
    // Check for idea to convert
    const ideaToConvert = localStorage.getItem("ideaToConvert");
    if (ideaToConvert) {
      const idea = JSON.parse(ideaToConvert);
      setCustomPrompt(idea.idea_text);
      localStorage.removeItem("ideaToConvert");
      toast.success("Idea loaded! Ready to create content.");
    }
    
    // Check for template selection
    const selectedTemplate = localStorage.getItem("selectedTemplate");
    if (selectedTemplate) {
      const template = JSON.parse(selectedTemplate);
      setCustomPrompt(template.prompt);
      localStorage.removeItem("selectedTemplate");
      toast.success("Template loaded!");
    }
  }, []);

  const loadData = async () => {
    try {
      const [brandsRes, projectsRes, templatesRes] = await Promise.all([
        axios.get(`${API}/brands`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/templates`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setBrands(brandsRes.data);
      setProjects(projectsRes.data);
      setTemplates(templatesRes.data);
      
      if (brandsRes.data.length > 0) {
        setSelectedBrand(brandsRes.data[0].id);
      }
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const buildPrompt = () => {
    if (customPrompt) return customPrompt;
    
    return `Goal: ${goal}
Product/Service: ${product}
Target Audience: ${targetAudience}
Platform: ${platform}
Tone: ${tone}
Style: ${contentStyle}

Create ${contentType} content for this brand.`;
  };

  const handleGenerate = async () => {
    const prompt = buildPrompt();
    
    if (!prompt.trim()) {
      toast.error("Please enter a prompt or fill in the details");
      return;
    }

    setGenerating(true);
    setResult(null);
    
    try {
      let response;
      
      if (contentType === "caption") {
        response = await axios.post(
          `${API}/generate/caption`,
          {
            prompt,
            brand_id: selectedBrand,
            project_id: selectedProject || undefined,
            platform,
            tone,
            type: "caption"
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResult({ type: "caption", content: response.data.caption });
        setCurrentContentId(response.data.content_id);
        toast.success("Caption generated!");
        
      } else if (contentType === "image") {
        toast.info("Generating image... This may take up to 60 seconds");
        response = await axios.post(
          `${API}/generate/image`,
          { prompt, project_id: selectedProject || undefined },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 90000 }
        );
        setResult({ type: "image", content: response.data.image_url });
        setCurrentContentId(response.data.content_id);
        toast.success("Image generated!");
        
      } else if (contentType === "video") {
        toast.info("Generating video... This may take up to 10 minutes");
        response = await axios.post(
          `${API}/generate/video`,
          { prompt, project_id: selectedProject || undefined, duration: 4, size: "1280x720" },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 600000 }
        );
        setResult({ type: "video", content: response.data.video_url });
        setCurrentContentId(response.data.content_id);
        toast.success("Video generated!");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setResult(null);
    handleGenerate();
  };

  const handleEditContent = async () => {
    if (!editCommand || !currentContentId) {
      toast.error("Enter an edit command");
      return;
    }

    setEditing(true);
    try {
      const response = await axios.post(
        `${API}/contents/${currentContentId}/edit?edit_prompt=${encodeURIComponent(editCommand)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult({ ...result, content: response.data.edited_content });
      setEditCommand("");
      toast.success("Content edited!");
    } catch (error) {
      toast.error("Failed to edit content");
    } finally {
      setEditing(false);
    }
  };

  const handleCopyCaption = () => {
    if (result && result.type === "caption") {
      navigator.clipboard.writeText(result.content);
      toast.success("Copied to clipboard!");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    const link = document.createElement('a');
    
    if (result.type === "caption") {
      const blob = new Blob([result.content], { type: 'text/plain' });
      link.href = URL.createObjectURL(blob);
      link.download = `frameflow-caption-${Date.now()}.txt`;
    } else if (result.type === "image") {
      link.href = result.content;
      link.download = `frameflow-image-${Date.now()}.png`;
    } else if (result.type === "video") {
      link.href = result.content;
      link.download = `frameflow-video-${Date.now()}.mp4`;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded!");
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] overflow-hidden">
        {/* 3-Panel Layout */}
        <div className="h-full grid grid-cols-12 gap-4 p-4">
          
          {/* LEFT PANEL - Creative Controls */}
          <div className="col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-y-auto">
            <h2 className="text-xl font-semibold font-outfit text-slate-900 mb-6">Creative Controls</h2>
            
            {/* Brand & Project Selectors */}
            <div className="space-y-4 mb-6">
              {brands.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Brand</Label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2"
                  >
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {projects.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Project (Optional)</Label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2"
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Content Type Tabs */}
            <Tabs value={contentType} onValueChange={setContentType} className="mb-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="caption" className="text-xs"><FileText className="w-4 h-4 mr-1" />Caption</TabsTrigger>
                <TabsTrigger value="image" className="text-xs"><ImageIcon className="w-4 h-4 mr-1" />Image</TabsTrigger>
                <TabsTrigger value="video" className="text-xs"><Video className="w-4 h-4 mr-1" />Video</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Structured Prompt Builder */}
            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Goal</Label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                >
                  <option value="promotion">Promotion</option>
                  <option value="storytelling">Storytelling</option>
                  <option value="educational">Educational</option>
                  <option value="launch">Product Launch</option>
                  <option value="engagement">Engagement</option>
                </select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Product/Service</Label>
                <Input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g., Espresso machine"
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Target Audience</Label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Coffee enthusiasts"
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Platform</Label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter/X</option>
                </select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Tone</Label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                >
                  <option value="engaging">Engaging</option>
                  <option value="professional">Professional</option>
                  <option value="playful">Playful</option>
                  <option value="luxury">Luxury</option>
                  <option value="bold">Bold</option>
                </select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Content Style</Label>
                <select
                  value={contentStyle}
                  onChange={(e) => setContentStyle(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                >
                  <option value="post">Post</option>
                  <option value="carousel">Carousel</option>
                  <option value="reel">Reel</option>
                  <option value="short">Short Video</option>
                  <option value="story">Story</option>
                </select>
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="mb-6">
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">Custom Prompt</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Or write your own prompt..."
                className="min-h-[100px] text-sm"
              />
            </div>

            {/* Template Picker */}
            {templates.length > 0 && (
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Quick Templates</Label>
                <div className="space-y-2">
                  {templates.slice(0, 4).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setCustomPrompt(template.prompt)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full mt-6 rounded-full py-6 bg-indigo-600 text-white font-semibold shadow-lg hover:scale-105 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>

          {/* CENTER PANEL - Content Canvas */}
          <div className="col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold font-outfit text-slate-900">Content Canvas</h2>
              {result && (
                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center">
              {!result && !generating && (
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center animate-bounce-slow">
                    <Sparkles className="w-16 h-16 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">Ready to Create</h3>
                  <p className="text-slate-600">Configure your settings and generate content</p>
                </div>
              )}

              {generating && (
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center animate-bounce-slow">
                    <Bot className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">Framey is creating...</h3>
                  <p className="text-slate-600">Your content will appear here</p>
                </div>
              )}

              {result && result.type === "caption" && (
                <div className="w-full bg-slate-50 rounded-2xl p-8">
                  <div className="prose max-w-none">
                    <div className="text-slate-900 text-lg leading-relaxed whitespace-pre-wrap">
                      {result.content}
                    </div>
                  </div>
                </div>
              )}

              {result && result.type === "image" && (
                <div className="w-full">
                  <img
                    src={result.content}
                    alt="Generated"
                    className="w-full rounded-2xl shadow-xl"
                  />
                </div>
              )}

              {result && result.type === "video" && (
                <div className="w-full">
                  <video
                    src={result.content}
                    controls
                    className="w-full rounded-2xl shadow-xl"
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL - Editing & Export */}
          <div className="col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-y-auto">
            <h2 className="text-xl font-semibold font-outfit text-slate-900 mb-6">Edit & Export</h2>

            {/* AI Editing Commands */}
            {result && result.type === "caption" && currentContentId && (
              <div className="mb-6">
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">AI Edit Command</Label>
                <div className="space-y-2">
                  <Input
                    value={editCommand}
                    onChange={(e) => setEditCommand(e.target.value)}
                    placeholder="e.g., Make it shorter"
                    className="text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleEditContent()}
                  />
                  <Button
                    onClick={handleEditContent}
                    disabled={editing}
                    className="w-full rounded-lg bg-purple-600 text-white"
                    size="sm"
                  >
                    {editing ? "Editing..." : "Apply Edit"}
                  </Button>
                </div>
                
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-slate-500 font-semibold">Quick Edits:</p>
                  {["Make it shorter", "Add emojis", "More professional", "Add hashtags"].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => setEditCommand(cmd)}
                      className="block w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-xs"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Export Options */}
            {result && (
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-3 block">Export Options</Label>
                <div className="space-y-2">
                  {result.type === "caption" && (
                    <Button
                      onClick={handleCopyCaption}
                      variant="outline"
                      className="w-full rounded-lg justify-start"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Caption
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="w-full rounded-lg justify-start"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download {result.type === "caption" ? "TXT" : result.type === "image" ? "PNG" : "MP4"}
                  </Button>
                </div>
              </div>
            )}

            {!result && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">Generate content to see export options</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
