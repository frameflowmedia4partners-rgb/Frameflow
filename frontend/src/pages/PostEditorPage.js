import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Type,
  Image as ImageIcon,
  Layers,
  Download,
  Undo,
  Redo,
  Save,
  Move,
  Trash2,
  Plus,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const fonts = [
  "Inter",
  "Playfair Display",
  "Poppins",
  "Roboto",
  "Montserrat",
  "Lato",
  "Open Sans",
  "Oswald",
];

const defaultColors = [
  "#ffffff", "#000000", "#6366f1", "#ec4899", "#f59e0b", 
  "#10b981", "#ef4444", "#8b5cf6", "#0ea5e9", "#f97316"
];

export default function PostEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("text"); // text, logo, layers
  
  // Canvas state
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Text editing
  const [newText, setNewText] = useState("");
  const [textFont, setTextFont] = useState("Inter");
  const [textSize, setTextSize] = useState(48);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textAlign, setTextAlign] = useState("center");
  
  // Logo
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(100);

  useEffect(() => {
    // Load post from navigation state
    const post = location.state?.post;
    if (post?.image_base64) {
      setBackgroundImage(`data:image/png;base64,${post.image_base64}`);
      
      // Add initial text elements from the post
      const initialElements = [];
      if (post.headline) {
        initialElements.push({
          id: Date.now(),
          type: "text",
          content: post.headline,
          x: 50,
          y: 70,
          font: "Playfair Display",
          size: 56,
          color: "#ffffff",
          bold: true,
          italic: false,
          align: "center",
        });
      }
      if (post.tagline) {
        initialElements.push({
          id: Date.now() + 1,
          type: "text",
          content: post.tagline,
          x: 50,
          y: 82,
          font: "Inter",
          size: 28,
          color: "#fffef0",
          bold: false,
          italic: false,
          align: "center",
        });
      }
      setElements(initialElements);
      saveToHistory(initialElements);
    } else {
      // Start with blank canvas
      setBackgroundImage(null);
    }
  }, [location.state]);

  const saveToHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  };

  const addTextElement = () => {
    if (!newText.trim()) {
      toast.error("Please enter some text");
      return;
    }

    const newElement = {
      id: Date.now(),
      type: "text",
      content: newText,
      x: 50,
      y: 50,
      font: textFont,
      size: textSize,
      color: textColor,
      bold: textBold,
      italic: textItalic,
      align: textAlign,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setNewText("");
    setSelectedElement(newElement.id);
    toast.success("Text added!");
  };

  const addLogoElement = () => {
    if (!logoUrl) {
      toast.error("Please enter a logo URL or upload an image");
      return;
    }

    const newElement = {
      id: Date.now(),
      type: "logo",
      url: logoUrl,
      x: 85,
      y: 10,
      width: logoSize,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    toast.success("Logo added!");
  };

  const updateElement = (id, updates) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    saveToHistory(newElements);
  };

  const deleteElement = (id) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElement(null);
    toast.success("Element deleted");
  };

  const moveLayer = (id, direction) => {
    const index = elements.findIndex(el => el.id === id);
    if (
      (direction === "up" && index === elements.length - 1) ||
      (direction === "down" && index === 0)
    ) return;

    const newElements = [...elements];
    const swapIndex = direction === "up" ? index + 1 : index - 1;
    [newElements[index], newElements[swapIndex]] = [newElements[swapIndex], newElements[index]];
    setElements(newElements);
    saveToHistory(newElements);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target.result);
      toast.success("Background image updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    // Create a canvas element to composite the final image
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");

    // Draw background
    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 1080, 1080);
        drawElements(ctx);
        downloadCanvas(canvas);
      };
      img.src = backgroundImage;
    } else {
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, 0, 1080, 1080);
      drawElements(ctx);
      downloadCanvas(canvas);
    }
  };

  const drawElements = (ctx) => {
    elements.forEach(el => {
      if (el.type === "text") {
        const x = (el.x / 100) * 1080;
        const y = (el.y / 100) * 1080;
        
        ctx.font = `${el.italic ? "italic " : ""}${el.bold ? "bold " : ""}${el.size * 1.5}px ${el.font}`;
        ctx.fillStyle = el.color;
        ctx.textAlign = el.align;
        ctx.fillText(el.content, x, y);
      } else if (el.type === "logo" && el.url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = el.url;
        const x = (el.x / 100) * 1080;
        const y = (el.y / 100) * 1080;
        const width = el.width * 2;
        ctx.drawImage(img, x - width/2, y, width, width);
      }
    });
  };

  const downloadCanvas = (canvas) => {
    const link = document.createElement("a");
    link.download = `frameflow-edited-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Image downloaded!");
  };

  const handleSaveToLibrary = async () => {
    setSaving(true);
    try {
      // For now, save the background image with metadata
      await api.post("/content-library", {
        type: "image",
        filename: `edited-post-${Date.now()}.png`,
        data: backgroundImage,
        source: "edited",
        is_favourite: false,
      });
      toast.success("Saved to library!");
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <ClientLayout>
      <div className="flex flex-col lg:flex-row h-full">
        {/* Canvas Area */}
        <div className="flex-1 p-4 md:p-6 flex items-center justify-center bg-slate-800/50">
          <div 
            ref={canvasRef}
            className="relative w-full max-w-[500px] aspect-square bg-slate-900 rounded-xl overflow-hidden shadow-2xl"
          >
            {/* Background */}
            {backgroundImage ? (
              <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                <div className="text-center text-slate-500">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                  <p>Upload an image to start</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mt-4 rounded-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>
            )}

            {/* Rendered Elements */}
            {elements.map((el) => (
              <div
                key={el.id}
                onClick={() => setSelectedElement(el.id)}
                className={`absolute cursor-move transition-all ${
                  selectedElement === el.id ? "ring-2 ring-indigo-500 ring-offset-2" : ""
                }`}
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {el.type === "text" && (
                  <p
                    style={{
                      fontFamily: el.font,
                      fontSize: `${el.size}px`,
                      color: el.color,
                      fontWeight: el.bold ? "bold" : "normal",
                      fontStyle: el.italic ? "italic" : "normal",
                      textAlign: el.align,
                      textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {el.content}
                  </p>
                )}
                {el.type === "logo" && el.url && (
                  <img
                    src={el.url}
                    alt="Logo"
                    style={{ width: `${el.width}px`, height: "auto" }}
                    className="filter drop-shadow-lg"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tools Panel */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {[
              { id: "text", label: "Text", icon: Type },
              { id: "logo", label: "Logo", icon: ImageIcon },
              { id: "layers", label: "Layers", icon: Layers },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tool Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Text Tab */}
            {activeTab === "text" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Add New Text</Label>
                  <Input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text..."
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Font</Label>
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm"
                  >
                    {fonts.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Size: {textSize}px</Label>
                  <Slider
                    value={[textSize]}
                    onValueChange={([val]) => setTextSize(val)}
                    min={12}
                    max={120}
                    step={2}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setTextColor(color)}
                        className={`w-8 h-8 rounded-lg border-2 ${
                          textColor === color ? "border-indigo-500" : "border-slate-200"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setTextBold(!textBold)}
                    className={`p-2 rounded-lg ${textBold ? "bg-indigo-100 text-indigo-600" : "bg-slate-100"}`}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTextItalic(!textItalic)}
                    className={`p-2 rounded-lg ${textItalic ? "bg-indigo-100 text-indigo-600" : "bg-slate-100"}`}
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTextAlign("left")}
                    className={`p-2 rounded-lg ${textAlign === "left" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100"}`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTextAlign("center")}
                    className={`p-2 rounded-lg ${textAlign === "center" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100"}`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTextAlign("right")}
                    className={`p-2 rounded-lg ${textAlign === "right" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100"}`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>

                <Button onClick={addTextElement} className="w-full rounded-lg bg-indigo-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Text
                </Button>

                {/* Edit Selected Text */}
                {selectedEl?.type === "text" && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <h4 className="font-medium text-sm mb-3">Edit Selected Text</h4>
                    <Input
                      value={selectedEl.content}
                      onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                      className="mb-3 rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X Position</Label>
                        <Slider
                          value={[selectedEl.x]}
                          onValueChange={([val]) => updateElement(selectedEl.id, { x: val })}
                          min={0}
                          max={100}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y Position</Label>
                        <Slider
                          value={[selectedEl.y]}
                          onValueChange={([val]) => updateElement(selectedEl.id, { y: val })}
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteElement(selectedEl.id)}
                      variant="destructive"
                      size="sm"
                      className="w-full mt-3 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Logo Tab */}
            {activeTab === "logo" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Logo URL</Label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="rounded-lg"
                  />
                </div>

                <div className="text-center text-slate-500 text-sm">or</div>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-600">Upload Logo</span>
                  </label>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Size: {logoSize}px</Label>
                  <Slider
                    value={[logoSize]}
                    onValueChange={([val]) => setLogoSize(val)}
                    min={30}
                    max={200}
                    step={5}
                  />
                </div>

                <Button onClick={addLogoElement} className="w-full rounded-lg bg-indigo-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Logo
                </Button>

                {/* Edit Selected Logo */}
                {selectedEl?.type === "logo" && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <h4 className="font-medium text-sm mb-3">Edit Selected Logo</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X Position</Label>
                        <Slider
                          value={[selectedEl.x]}
                          onValueChange={([val]) => updateElement(selectedEl.id, { x: val })}
                          min={0}
                          max={100}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y Position</Label>
                        <Slider
                          value={[selectedEl.y]}
                          onValueChange={([val]) => updateElement(selectedEl.id, { y: val })}
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="text-xs">Size</Label>
                      <Slider
                        value={[selectedEl.width]}
                        onValueChange={([val]) => updateElement(selectedEl.id, { width: val })}
                        min={30}
                        max={200}
                      />
                    </div>
                    <Button
                      onClick={() => deleteElement(selectedEl.id)}
                      variant="destructive"
                      size="sm"
                      className="w-full mt-3 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Layers Tab */}
            {activeTab === "layers" && (
              <div className="space-y-2">
                {elements.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No elements added yet</p>
                ) : (
                  elements.slice().reverse().map((el, index) => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElement(el.id)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedElement === el.id
                          ? "bg-indigo-50 border border-indigo-200"
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {el.type === "text" ? (
                          <Type className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-sm font-medium truncate max-w-[120px]">
                          {el.type === "text" ? el.content : "Logo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveLayer(el.id, "up"); }}
                          className="p-1 hover:bg-slate-200 rounded"
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveLayer(el.id, "down"); }}
                          className="p-1 hover:bg-slate-200 rounded"
                          disabled={index === elements.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                          className="p-1 hover:bg-red-100 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-200 space-y-2">
            <div className="flex gap-2">
              <Button onClick={undo} variant="outline" size="sm" disabled={historyIndex <= 0}>
                <Undo className="w-4 h-4" />
              </Button>
              <Button onClick={redo} variant="outline" size="sm" disabled={historyIndex >= history.length - 1}>
                <Redo className="w-4 h-4" />
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="bg-upload"
              />
              <label htmlFor="bg-upload">
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="w-4 h-4" /></span>
                </Button>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleDownload} variant="outline" className="rounded-lg">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleSaveToLibrary} disabled={saving} className="rounded-lg bg-indigo-600">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
