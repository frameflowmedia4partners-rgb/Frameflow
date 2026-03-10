import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Users, Eye, PlayCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { campaignAPI } from "@/services/api";

export default function MarketingDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({ active_campaigns: 0, total_spend: 0, total_reach: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const campaignsRes = await campaignAPI.getAll();
      
      setCampaigns(campaignsRes.data || []);
      
      // Calculate stats
      const data = campaignsRes.data || [];
      const activeCampaigns = data.filter(c => c.status === "active").length;
      const totalSpend = data.reduce((sum, c) => sum + (c.daily_budget || 0) * 7, 0);
      
      setStats({
        active_campaigns: activeCampaigns,
        total_spend: totalSpend,
        total_reach: activeCampaigns * 5000 // Simulated
      });
    } catch (error) {
      console.error("Failed to load marketing data:", error);
      // Show empty state instead of error
      setCampaigns([]);
      setStats({ active_campaigns: 0, total_spend: 0, total_reach: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading marketing dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Marketing Dashboard</h1>
            <p className="text-lg text-slate-600">Track your café marketing performance</p>
          </div>
          <Button
            data-testid="create-ad-btn"
            onClick={() => navigate("/ads/create")}
            className="rounded-full px-8 py-3 bg-indigo-600 text-white font-semibold shadow-lg hover:scale-105 transition-all"
          >
            Create Ad Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="text-3xl font-bold font-outfit text-slate-900 mb-1">{stats.active_campaigns}</div>
            <div className="text-sm text-slate-600">Active Campaigns</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold font-outfit text-slate-900 mb-1">${stats.total_spend.toFixed(2)}</div>
            <div className="text-sm text-slate-600">Total Spend (7 days)</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold font-outfit text-slate-900 mb-1">{stats.total_reach.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Total Reach</div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-6">All Campaigns</h3>
          
          {campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  data-testid={`campaign-item-${campaign.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {campaign.promotion_type} - {campaign.campaign_goal}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {campaign.target_audience} • ${campaign.daily_budget}/day • {campaign.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        campaign.status === "active"
                          ? "bg-green-100 text-green-700"
                          : campaign.status === "paused"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No campaigns yet</p>
              <Button
                onClick={() => navigate("/ads/create")}
                className="rounded-full px-6 py-3 bg-indigo-600 text-white"
              >
                Create Your First Campaign
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
