import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Save, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BrandProfilePage() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [name, setName] = useState("");
  const [tone, setTone] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
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
        const brand = response.data[0];
        setSelectedBrand(brand);
        setName(brand.name);
        setTone(brand.tone || "");
        setIndustry(brand.industry || "");
        setWebsiteUrl(brand.website_url || "");
        setAnalysis(brand.brand_analysis || null);
      }
    } catch (error) {
      toast.error("Failed to load brands");
    }
  };

  const handleSave = async () => {
    if (!selectedBrand) return;

    setLoading(true);
    try {
      await axios.put(
        `${API}/brands/${selectedBrand.id}`,
        { name, tone, industry },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Brand updated!");
      loadBrands();
    } catch (error) {
      toast.error("Failed to update brand");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      toast.error("Please enter a website URL");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await axios.post(
        `${API}/brands/${selectedBrand.id}/analyze`,
        { website_url: websiteUrl, brand_id: selectedBrand.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalysis(response.data.analysis);
      toast.success("Website analyzed successfully!");
      loadBrands();
    } catch (error) {
      toast.error("Failed to analyze website");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Brand Settings</h1>
          <p className="text-lg text-slate-600\">Manage your brand information and AI insights</p>
        </div>

        {selectedBrand ? (
          <div className="max-w-4xl space-y-6">
            {/* Brand Intelligence */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
              <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Brand Intelligence
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Analyze your website to extract brand insights for better AI-generated content
              </p>
              <div className="flex gap-3">
                <Input
                  data-testid="website-url-input"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="flex-1 rounded-xl"
                />
                <Button
                  data-testid="analyze-website-btn"
                  onClick={handleAnalyzeWebsite}
                  disabled={analyzing}
                  className="rounded-full px-6 bg-indigo-600 text-white"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Website"
                  )}
                </Button>
              </div>

              {analysis && (
                <div className="mt-6 bg-white rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-slate-900">AI Brand Analysis:</h4>
                  {Object.entries(analysis).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-sm font-medium text-slate-700">{key}: </span>
                      <span className="text-sm text-slate-600">
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Brand Profile */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-6">Brand Profile</h3>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700 mb-2 block">
                    Brand Name
                  </Label>
                  <Input
                    data-testid="brand-name-input"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                    placeholder="My Brand"
                  />
                </div>

                <div>
                  <Label htmlFor="tone" className="text-sm font-semibold text-slate-700 mb-2 block">
                    Brand Tone
                  </Label>
                  <Input
                    data-testid="brand-tone-input"
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                    placeholder="Professional, Friendly, Playful..."
                  />
                </div>

                <div>
                  <Label htmlFor="industry" className="text-sm font-semibold text-slate-700 mb-2 block">
                    Industry
                  </Label>
                  <Input
                    data-testid="brand-industry-input"
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                    placeholder="Restaurant, Tech, Fashion..."
                  />
                </div>

                <Button
                  data-testid="save-brand-btn"
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full rounded-full px-8 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <Bot className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">No brand yet</h2>
            <p className="text-slate-600 mb-6">Create your first brand to get started</p>
            <Button
              onClick={() => navigate("/onboarding")}
              className="rounded-full px-8 py-3 bg-indigo-600 text-white font-semibold"
            >
              Create Brand
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
