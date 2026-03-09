import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateAdCampaign() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("engagement");
  const [targetAudience, setTargetAudience] = useState("");
  const [dailyBudget, setDailyBudget] = useState("10");
  const [promotionType, setPromotionType] = useState("");
  const [location, setLocation] = useState("");
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState(null);
  const [campaignId, setCampaignId] = useState(null);
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

  const handleGenerateStrategy = async () => {
    if (!targetAudience || !promotionType || !location) {
      toast.error("Please fill in all fields");
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post(
        `${API}/ads/campaign/strategy`,
        {
          brand_id: selectedBrand,
          campaign_goal: campaignGoal,
          target_audience: targetAudience,
          daily_budget: parseFloat(dailyBudget),
          promotion_type: promotionType,
          location: location
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStrategy(response.data.strategy);
      setCampaignId(response.data.campaign_id);
      toast.success("Campaign strategy generated!");
    } catch (error) {
      toast.error("Failed to generate strategy");
    } finally {
      setGenerating(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!campaignId) return;

    try {
      await axios.post(
        `${API}/ads/campaign/${campaignId}/launch`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Campaign launched successfully!");
      navigate("/marketing");
    } catch (error) {
      toast.error("Failed to launch campaign");
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Create Ad Campaign</h1>
          <p className="text-lg text-slate-600">AI-powered campaign strategy for your café</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Campaign Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-6">Campaign Details</h3>
            
            <div className="space-y-5">
              {brands.length > 0 && (
                <div>
                  <Label>Café Brand</Label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full mt-2 rounded-xl border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label>Campaign Goal</Label>
                <select
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  className="w-full mt-2 rounded-xl border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <option value="engagement">Engagement</option>
                  <option value="traffic">Website Traffic</option>
                  <option value="awareness">Brand Awareness</option>
                  <option value="conversions">Conversions</option>
                </select>
              </div>

              <div>
                <Label>Target Audience</Label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Coffee lovers aged 25-45"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Daily Budget ($)</Label>
                <Input
                  type="number"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  placeholder="10"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Promotion Type</Label>
                <Input
                  value={promotionType}
                  onChange={(e) => setPromotionType(e.target.value)}
                  placeholder="e.g., New Seasonal Drink Launch"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Location Targeting</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Downtown Seattle, 5-mile radius"
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleGenerateStrategy}
                disabled={generating}
                className="w-full rounded-full py-6 bg-indigo-600 text-white font-semibold shadow-lg hover:scale-105 transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Strategy...
                  </>
                ) : (
                  "Generate AI Campaign Strategy"
                )}
              </Button>
            </div>
          </div>

          {/* Right: Strategy Preview */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-6">Campaign Strategy</h3>
            
            {!strategy && !generating && (
              <div className="text-center py-16">
                <Rocket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Fill in campaign details to generate AI strategy</p>
              </div>
            )}

            {generating && (
              <div className="text-center py-16">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-slate-600">AI Performance Marketer is creating your strategy...</p>
              </div>
            )}

            {strategy && (
              <div>
                <div className="bg-slate-50 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-900">
                    {strategy}
                  </div>
                </div>

                <Button
                  onClick={handleLaunchCampaign}
                  className="w-full rounded-full py-6 bg-green-600 text-white font-semibold shadow-lg hover:scale-105 transition-all"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Launch Campaign
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}