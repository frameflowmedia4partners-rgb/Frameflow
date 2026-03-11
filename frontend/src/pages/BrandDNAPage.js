import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe,
  Building2,
  UtensilsCrossed,
  Palette,
  MessageSquare,
  Target,
  Plus,
  Trash2,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const businessTypes = [
  { id: "cafe", label: "Café", icon: "☕" },
  { id: "bakery", label: "Bakery", icon: "🥐" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "cloud_kitchen", label: "Cloud Kitchen", icon: "🏭" },
];

const languages = [
  { id: "English", label: "English", flag: "🇺🇸" },
  { id: "Hindi", label: "Hindi", flag: "🇮🇳" },
  { id: "Bengali", label: "Bengali", flag: "🇧🇩" },
];

const tones = [
  { id: "luxury", label: "Luxury" },
  { id: "casual", label: "Casual" },
  { id: "playful", label: "Playful" },
  { id: "professional", label: "Professional" },
];

const niches = ["Café", "Bakery", "Fine Dining", "Street Food", "Desserts", "Health Food"];

export default function BrandDNAPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1
    website_url: "",
    // Step 2
    name: "",
    type: "cafe",
    language: "English",
    // Step 3
    menu_items: [],
    // Step 4 - WHO YOU ARE
    colors: ["#6366f1"],
    fonts: ["Inter"],
    logo_url: "",
    mission: "",
    unique_claims: "",
    use_emojis: true,
    extra_guidelines: "",
    // HOW YOU SPEAK
    tone: "casual",
    words_to_use: "",
    words_to_avoid: "",
    good_copy_examples: "",
    bad_copy_examples: "",
    // WHERE YOU COMPETE
    target_audience: "",
    competitor_urls: [],
    competitor_strengths: "",
    differentiator: "",
    niches: [],
    // Contact
    phone: "",
    show_delivery_badges: true,
  });

  const [newMenuItem, setNewMenuItem] = useState({ name: "", description: "", image: "" });
  const [newCompetitor, setNewCompetitor] = useState("");
  const [identityTab, setIdentityTab] = useState("who");

  useEffect(() => {
    loadExistingDNA();
  }, []);

  const loadExistingDNA = async () => {
    try {
      setLoading(true);
      const response = await api.get("/brand-dna");
      if (response.data && response.data.name) {
        setFormData({ ...formData, ...response.data });
      }
    } catch (error) {
      console.log("No existing DNA");
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeWebsite = async () => {
    if (!formData.website_url) {
      toast.error("Please enter a website URL");
      return;
    }

    setScraping(true);
    try {
      const response = await api.post("/scrape-website", null, {
        params: { url: formData.website_url },
      });
      
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        setFormData({
          ...formData,
          name: response.data.brand_name || formData.name,
          logo_url: response.data.logo_url || formData.logo_url,
          colors: response.data.colors?.length ? response.data.colors : formData.colors,
        });
        toast.success("Website scraped! Info auto-filled.");
      }
    } catch (error) {
      toast.error("Failed to scrape website");
    } finally {
      setScraping(false);
    }
  };

  const addMenuItem = () => {
    if (!newMenuItem.name) {
      toast.error("Please enter item name");
      return;
    }
    setFormData({
      ...formData,
      menu_items: [...formData.menu_items, { ...newMenuItem, id: Date.now() }],
    });
    setNewMenuItem({ name: "", description: "", image: "" });
    toast.success("Menu item added!");
  };

  const removeMenuItem = (id) => {
    setFormData({
      ...formData,
      menu_items: formData.menu_items.filter((item) => item.id !== id),
    });
  };

  const addCompetitor = () => {
    if (!newCompetitor) return;
    setFormData({
      ...formData,
      competitor_urls: [...formData.competitor_urls, newCompetitor],
    });
    setNewCompetitor("");
  };

  const removeCompetitor = (index) => {
    setFormData({
      ...formData,
      competitor_urls: formData.competitor_urls.filter((_, i) => i !== index),
    });
  };

  const addColor = () => {
    if (formData.colors.length >= 3) {
      toast.error("Maximum 3 colors allowed");
      return;
    }
    setFormData({
      ...formData,
      colors: [...formData.colors, "#000000"],
    });
  };

  const updateColor = (index, color) => {
    const newColors = [...formData.colors];
    newColors[index] = color;
    setFormData({ ...formData, colors: newColors });
  };

  const removeColor = (index) => {
    setFormData({
      ...formData,
      colors: formData.colors.filter((_, i) => i !== index),
    });
  };

  const toggleNiche = (niche) => {
    if (formData.niches.includes(niche)) {
      setFormData({
        ...formData,
        niches: formData.niches.filter((n) => n !== niche),
      });
    } else {
      setFormData({
        ...formData,
        niches: [...formData.niches, niche],
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Brand name is required");
      return;
    }

    setSaving(true);
    try {
      await api.post("/brand-dna", formData);
      toast.success("Brand DNA saved!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to save Brand DNA");
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletion = () => {
    const fields = ["name", "type", "colors", "logo_url", "tone", "target_audience", "menu_items"];
    const filled = fields.filter((f) => {
      const val = formData[f];
      if (Array.isArray(val)) return val.length > 0;
      return !!val;
    }).length;
    return Math.round((filled / fields.length) * 100);
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
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold font-outfit text-slate-900">Brand DNA</h1>
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600">
                {calculateCompletion()}% complete
              </div>
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${calculateCompletion()}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  step === s
                    ? "bg-indigo-600 text-white"
                    : step > s
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
                {s === 1 && "Website"}
                {s === 2 && "Business"}
                {s === 3 && "Menu"}
                {s === 4 && "Identity"}
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: Website URL */}
        {step === 1 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">What's your website?</h2>
                <p className="text-slate-600">We'll auto-extract your brand info</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://yourcafe.com"
                  className="flex-1 rounded-xl"
                />
                <Button
                  onClick={handleScrapeWebsite}
                  disabled={scraping}
                  className="rounded-xl bg-indigo-600"
                >
                  {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan"}
                </Button>
              </div>

              <button
                onClick={() => setStep(2)}
                className="text-indigo-600 text-sm hover:underline"
              >
                Don't have a website? Skip →
              </button>
            </div>

            <div className="flex justify-end mt-8">
              <Button onClick={() => setStep(2)} className="rounded-full px-8 bg-indigo-600">
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Business Info */}
        {step === 2 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Business Info</h2>
                <p className="text-slate-600">Tell us about your business</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Brand Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Café Name"
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-3 block">Business Type</Label>
                <div className="grid grid-cols-4 gap-3">
                  {businessTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, type: type.id })}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        formData.type === type.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-3 block">Language</Label>
                <div className="flex gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setFormData({ ...formData, language: lang.id })}
                      className={`px-6 py-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                        formData.language === lang.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="font-medium">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button onClick={() => setStep(1)} variant="outline" className="rounded-full px-8">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="rounded-full px-8 bg-indigo-600">
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Products/Menu */}
        {step === 3 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Menu</h2>
                <p className="text-slate-600">Add your signature dishes (minimum 1)</p>
              </div>
            </div>

            {/* Add Item Form */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  placeholder="Item name"
                  className="rounded-xl"
                />
                <Input
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                  placeholder="Description"
                  className="rounded-xl"
                />
              </div>
              <Button onClick={addMenuItem} className="rounded-xl bg-indigo-600">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {formData.menu_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <button
                    onClick={() => removeMenuItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.menu_items.length === 0 && (
                <p className="text-center text-slate-500 py-8">No menu items yet</p>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <Button onClick={() => setStep(2)} variant="outline" className="rounded-full px-8">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={() => {
                  if (formData.menu_items.length === 0) {
                    toast.error("Please add at least one menu item");
                    return;
                  }
                  setStep(4);
                }}
                className="rounded-full px-8 bg-indigo-600"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Brand Identity */}
        {step === 4 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Brand Identity</h2>
                <p className="text-slate-600">Define your brand's personality</p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 pb-4">
              {[
                { id: "who", label: "WHO YOU ARE" },
                { id: "speak", label: "HOW YOU SPEAK" },
                { id: "compete", label: "WHERE YOU COMPETE" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setIdentityTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    identityTab === tab.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* WHO YOU ARE Tab */}
            {identityTab === "who" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-3 block">
                    Brand Colors (up to 3)
                  </Label>
                  <div className="flex gap-3 items-center">
                    {formData.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => updateColor(i, e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer"
                        />
                        <button
                          onClick={() => removeColor(i)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.colors.length < 3 && (
                      <button
                        onClick={addColor}
                        className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-indigo-400"
                      >
                        <Plus className="w-5 h-5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Logo URL</Label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://..."
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Mission</Label>
                  <Textarea
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    placeholder="What drives your brand?"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Unique Value Claims (comma separated)
                  </Label>
                  <Input
                    value={formData.unique_claims}
                    onChange={(e) => setFormData({ ...formData, unique_claims: e.target.value })}
                    placeholder="Best coffee in town, Organic ingredients"
                    className="rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium">Use Emojis in Content</span>
                  <button
                    onClick={() => setFormData({ ...formData, use_emojis: !formData.use_emojis })}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      formData.use_emojis ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        formData.use_emojis ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* HOW YOU SPEAK Tab */}
            {identityTab === "speak" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-3 block">Tone</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {tones.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setFormData({ ...formData, tone: t.id })}
                        className={`p-3 rounded-xl border-2 text-center font-medium transition-all ${
                          formData.tone === t.id
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Words to Use (comma separated)
                  </Label>
                  <Input
                    value={formData.words_to_use}
                    onChange={(e) => setFormData({ ...formData, words_to_use: e.target.value })}
                    placeholder="artisan, fresh, handcrafted"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Words to Avoid (comma separated)
                  </Label>
                  <Input
                    value={formData.words_to_avoid}
                    onChange={(e) => setFormData({ ...formData, words_to_avoid: e.target.value })}
                    placeholder="cheap, basic, regular"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Good Copy Examples</Label>
                  <Textarea
                    value={formData.good_copy_examples}
                    onChange={(e) => setFormData({ ...formData, good_copy_examples: e.target.value })}
                    placeholder="Paste examples of copy you love..."
                    className="rounded-xl min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* WHERE YOU COMPETE Tab */}
            {identityTab === "compete" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Target Audience</Label>
                  <Textarea
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    placeholder="Who are your ideal customers?"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-3 block">Competitor URLs</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newCompetitor}
                      onChange={(e) => setNewCompetitor(e.target.value)}
                      placeholder="https://competitor.com"
                      className="rounded-xl"
                    />
                    <Button onClick={addCompetitor} className="rounded-xl">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.competitor_urls.map((url, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600 truncate">{url}</span>
                        <button onClick={() => removeCompetitor(i)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    What Makes You Different?
                  </Label>
                  <Textarea
                    value={formData.differentiator}
                    onChange={(e) => setFormData({ ...formData, differentiator: e.target.value })}
                    placeholder="What sets you apart from competitors?"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-3 block">Niches</Label>
                  <div className="flex flex-wrap gap-2">
                    {niches.map((niche) => (
                      <button
                        key={niche}
                        onClick={() => toggleNiche(niche)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.niches.includes(niche)
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {niche}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button onClick={() => setStep(3)} variant="outline" className="rounded-full px-8">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Brand DNA
              </Button>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
