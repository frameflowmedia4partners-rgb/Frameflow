import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Save } from "lucide-react";
import { toast } from "sonner";

export default function BrandProfilePage() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [name, setName] = useState("");
  const [tone, setTone] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Brand Settings</h1>
          <p className="text-lg text-slate-600">Manage your brand information and preferences</p>
        </div>

        {selectedBrand ? (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
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
