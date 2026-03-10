import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Target,
  Plus,
  Play,
  Pause,
  Pencil,
  Trash2,
  AlertCircle,
  TrendingUp,
  Eye,
  MousePointer,
  X,
  Loader2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { campaignAPI } from "@/services/api";
import api from "@/services/api";

export default function CampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [metaConnected, setMetaConnected] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    objective: "AWARENESS",
    daily_budget: "",
    start_date: "",
    end_date: "",
    platforms: ["instagram"],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      let campaignsData = [];
      let connected = false;
      
      try {
        const campaignsRes = await campaignAPI.getAll();
        campaignsData = campaignsRes.data || [];
      } catch (e) {
        console.log("Campaigns fetch failed");
      }
      
      try {
        const statusRes = await api.get("/integrations/status");
        connected = statusRes.data?.instagram?.connected || false;
      } catch (e) {
        console.log("Integration status fetch failed");
      }
      
      setCampaigns(campaignsData);
      setMetaConnected(connected);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.name.trim() || !formData.daily_budget) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      const response = await campaignAPI.create({
        ...formData,
        daily_budget: parseFloat(formData.daily_budget),
        status: metaConnected ? "active" : "draft",
      });
      
      setCampaigns([...campaigns, response.data]);
      setShowCreateForm(false);
      setFormData({
        name: "",
        objective: "AWARENESS",
        daily_budget: "",
        start_date: "",
        end_date: "",
        platforms: ["instagram"],
      });
      toast.success(metaConnected ? "Campaign created!" : "Campaign saved as draft");
    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast.error("Failed to create campaign");
    } finally {
      setCreating(false);
    }
  };

  const handlePauseCampaign = async (id) => {
    try {
      await campaignAPI.update(id, { status: "paused" });
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: "paused" } : c));
      toast.success("Campaign paused");
    } catch (error) {
      toast.error("Failed to pause campaign");
    }
  };

  const handleResumeCampaign = async (id) => {
    try {
      await campaignAPI.update(id, { status: "active" });
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: "active" } : c));
      toast.success("Campaign resumed");
    } catch (error) {
      toast.error("Failed to resume campaign");
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    
    try {
      await campaignAPI.delete(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
      toast.success("Campaign deleted");
    } catch (error) {
      toast.error("Failed to delete campaign");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      paused: "bg-yellow-100 text-yellow-700",
      draft: "bg-slate-100 text-slate-700",
      completed: "bg-blue-100 text-blue-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Draft"}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading campaigns..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Campaigns</h1>
            <p className="text-lg text-slate-600">Manage your Meta advertising campaigns</p>
          </div>
          <Button
            data-testid="create-campaign-btn"
            onClick={() => setShowCreateForm(true)}
            className="rounded-full px-6 bg-indigo-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Draft Mode Banner */}
        {!metaConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Meta account not connected</p>
              <p className="text-sm text-amber-700">
                Campaigns will be saved as drafts. Connect your Meta account to launch live ads.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/settings"}
              className="ml-auto rounded-full border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Connect Meta
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{campaigns.length}</p>
                <p className="text-sm text-slate-500">Total Campaigns</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {campaigns.filter(c => c.status === "active").length}
                </p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {campaigns.reduce((sum, c) => sum + (c.reach || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">Total Reach</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(campaigns.reduce((sum, c) => sum + (c.spend || 0), 0))}
                </p>
                <p className="text-sm text-slate-500">Total Spend</p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Objective</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Budget ₹</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Spend ₹</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 mb-2">No campaigns yet</p>
                      <p className="text-sm text-slate-500">Create your first campaign to start advertising</p>
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{campaign.name}</p>
                        <p className="text-sm text-slate-500">
                          {campaign.platforms?.join(", ") || "All platforms"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {campaign.objective?.replace(/_/g, " ") || "Awareness"}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(campaign.status)}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        {formatCurrency(campaign.daily_budget)}/day
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        {formatCurrency(campaign.spend || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {campaign.status === "active" ? (
                            <Button
                              data-testid={`pause-campaign-${campaign.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePauseCampaign(campaign.id)}
                              className="text-amber-600"
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          ) : campaign.status !== "completed" ? (
                            <Button
                              data-testid={`resume-campaign-${campaign.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResumeCampaign(campaign.id)}
                              className="text-green-600"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          ) : null}
                          <Button
                            data-testid={`edit-campaign-${campaign.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(campaign.id)}
                            className="text-slate-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            data-testid={`delete-campaign-${campaign.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Campaign Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-outfit text-slate-900">Create Campaign</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Campaign Name *
                  </Label>
                  <Input
                    data-testid="campaign-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Summer Promotion"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Objective</Label>
                  <select
                    data-testid="campaign-objective-select"
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5"
                  >
                    <option value="AWARENESS">Brand Awareness</option>
                    <option value="REACH">Reach</option>
                    <option value="TRAFFIC">Traffic</option>
                    <option value="ENGAGEMENT">Engagement</option>
                    <option value="LEADS">Lead Generation</option>
                    <option value="SALES">Sales</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Daily Budget (₹) *
                  </Label>
                  <Input
                    data-testid="campaign-budget-input"
                    type="number"
                    value={formData.daily_budget}
                    onChange={(e) => setFormData({ ...formData, daily_budget: e.target.value })}
                    placeholder="500"
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Start Date
                    </Label>
                    <Input
                      data-testid="campaign-start-date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                      End Date
                    </Label>
                    <Input
                      data-testid="campaign-end-date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Platforms</Label>
                  <div className="flex gap-3">
                    {["instagram", "facebook"].map((platform) => (
                      <label
                        key={platform}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer border ${
                          formData.platforms.includes(platform)
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.platforms.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                platforms: [...formData.platforms, platform],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                platforms: formData.platforms.filter((p) => p !== platform),
                              });
                            }
                          }}
                          className="sr-only"
                        />
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                {!metaConnected && (
                  <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
                    This campaign will be saved as a draft until you connect your Meta account.
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-testid="submit-campaign-btn"
                    onClick={handleCreateCampaign}
                    disabled={creating}
                    className="flex-1 rounded-full bg-indigo-600"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Campaign"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
