import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Zap,
  Plus,
  Minus,
  RefreshCw,
  Settings,
  ArrowLeft,
  Loader2,
  History,
  User,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function AdminCreditManagement() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creditData, setCreditData] = useState(null);
  const [overview, setOverview] = useState(null);
  
  // Dialog state
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionAmount, setActionAmount] = useState("");
  const [actionReason, setActionReason] = useState("");

  useEffect(() => {
    if (clientId) {
      loadClientCredits();
    } else {
      loadOverview();
    }
  }, [clientId]);

  const loadClientCredits = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/clients/${clientId}/credits`);
      setCreditData(response.data);
    } catch (error) {
      console.error("Failed to load credit data:", error);
      toast.error("Failed to load credit data");
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/credits/overview");
      setOverview(response.data);
    } catch (error) {
      console.error("Failed to load overview:", error);
      toast.error("Failed to load credit overview");
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (type) => {
    setActionType(type);
    setActionAmount("");
    setActionReason("");
    setShowActionDialog(true);
  };

  const handleSubmitAction = async () => {
    if (!actionType) return;
    
    if ((actionType === "add_bonus" || actionType === "set_limit" || actionType === "deduct") && !actionAmount) {
      toast.error("Please enter an amount");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/admin/clients/${clientId}/credits`, {
        action: actionType,
        amount: actionAmount ? parseInt(actionAmount) : null,
        reason: actionReason
      });
      
      toast.success(response.data.message);
      setShowActionDialog(false);
      loadClientCredits();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Failed to update credits";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getActionTitle = () => {
    switch (actionType) {
      case "add_bonus": return "Add Bonus Credits";
      case "set_limit": return "Set Monthly Limit";
      case "reset": return "Reset Credits";
      case "deduct": return "Deduct Credits";
      default: return "Manage Credits";
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case "add_bonus": return <Plus className="w-5 h-5 text-green-500" />;
      case "set_limit": return <Settings className="w-5 h-5 text-blue-500" />;
      case "reset": return <RefreshCw className="w-5 h-5 text-orange-500" />;
      case "deduct": return <Minus className="w-5 h-5 text-red-500" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  // Overview page (all clients)
  if (!clientId && overview) {
    return (
      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Credit Management</h1>
                <p className="text-slate-600">Manage client credits and limits</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-500">Total Clients</p>
              <p className="text-2xl font-bold text-slate-900">{overview.totals.total_clients}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-500">Credits Used</p>
              <p className="text-2xl font-bold text-indigo-600">{overview.totals.total_credits_used.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-500">Credits Available</p>
              <p className="text-2xl font-bold text-green-600">{overview.totals.total_credits_available.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-500">Avg Usage</p>
              <p className="text-2xl font-bold text-amber-600">{overview.totals.average_usage_percent}%</p>
            </div>
          </div>

          {/* Clients List */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">All Clients</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {overview.clients.map((client) => (
                <div
                  key={client.client_id}
                  className="p-4 hover:bg-slate-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{client.client_name || "Unnamed"}</p>
                      <p className="text-sm text-slate-500">{client.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Progress bar */}
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">{client.credits_used} / {client.total_limit}</span>
                        <span className={`font-medium ${
                          client.usage_percent > 90 ? "text-red-600" : 
                          client.usage_percent > 70 ? "text-amber-600" : "text-green-600"
                        }`}>
                          {client.usage_percent}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            client.usage_percent > 90 ? "bg-red-500" : 
                            client.usage_percent > 70 ? "bg-amber-500" : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(client.usage_percent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bonus badge */}
                    {client.bonus_credits > 0 && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        +{client.bonus_credits} bonus
                      </span>
                    )}

                    <Button
                      onClick={() => navigate(`/admin/credits/${client.client_id}`)}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Single client credit management
  if (clientId && creditData) {
    const totalLimit = creditData.monthly_credits + creditData.bonus_credits;
    const remaining = totalLimit - creditData.credits_used;
    const usagePercent = totalLimit > 0 ? (creditData.credits_used / totalLimit * 100) : 0;

    return (
      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/admin/credits" className="p-2 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{creditData.client_name || "Client"}</h1>
                <p className="text-slate-600">{creditData.email}</p>
              </div>
            </div>
          </div>

          {/* Credit Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-slate-500">Credits Used</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{creditData.credits_used}</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-sm text-slate-500">Monthly Limit</span>
              </div>
              <p className="text-3xl font-bold text-indigo-600">{creditData.monthly_credits}</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-slate-500">Bonus Credits</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">{creditData.bonus_credits}</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-slate-500">Remaining</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{remaining}</p>
            </div>
          </div>

          {/* Usage Bar */}
          <div className="bg-white rounded-xl p-6 border border-slate-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Credit Usage</h3>
              <span className={`text-lg font-bold ${
                usagePercent > 90 ? "text-red-600" : 
                usagePercent > 70 ? "text-amber-600" : "text-green-600"
              }`}>
                {usagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all ${
                  usagePercent > 90 ? "bg-red-500" : 
                  usagePercent > 70 ? "bg-amber-500" : "bg-gradient-to-r from-green-400 to-green-500"
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">
              {creditData.credits_used} used of {totalLimit} total ({creditData.monthly_credits} monthly + {creditData.bonus_credits} bonus)
            </p>
            {creditData.credits_reset_date && (
              <p className="text-xs text-slate-400 mt-2">
                Last reset: {formatDate(creditData.credits_reset_date)}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Button
              onClick={() => openActionDialog("add_bonus")}
              className="bg-green-500 hover:bg-green-600 text-white rounded-xl py-6 flex flex-col items-center gap-2"
            >
              <Plus className="w-6 h-6" />
              <span>Add Bonus</span>
            </Button>
            <Button
              onClick={() => openActionDialog("set_limit")}
              variant="outline"
              className="rounded-xl py-6 flex flex-col items-center gap-2 border-2"
            >
              <Settings className="w-6 h-6 text-indigo-600" />
              <span>Set Limit</span>
            </Button>
            <Button
              onClick={() => openActionDialog("reset")}
              variant="outline"
              className="rounded-xl py-6 flex flex-col items-center gap-2 border-2 border-orange-200 hover:bg-orange-50"
            >
              <RefreshCw className="w-6 h-6 text-orange-500" />
              <span>Reset Credits</span>
            </Button>
            <Button
              onClick={() => openActionDialog("deduct")}
              variant="outline"
              className="rounded-xl py-6 flex flex-col items-center gap-2 border-2 border-red-200 hover:bg-red-50"
            >
              <Minus className="w-6 h-6 text-red-500" />
              <span>Deduct</span>
            </Button>
          </div>

          {/* Credit History */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Credit History</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {creditData.credit_history?.length > 0 ? (
                creditData.credit_history.map((entry) => (
                  <div key={entry.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {entry.action === "add_bonus" && <Plus className="w-4 h-4 text-green-500" />}
                        {entry.action === "set_limit" && <Settings className="w-4 h-4 text-blue-500" />}
                        {entry.action === "reset" && <RefreshCw className="w-4 h-4 text-orange-500" />}
                        {entry.action === "deduct" && <Minus className="w-4 h-4 text-red-500" />}
                        <span className="font-medium text-slate-900 capitalize">
                          {entry.action.replace("_", " ")}
                        </span>
                        {entry.amount && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.action === "add_bonus" ? "bg-green-100 text-green-700" :
                            entry.action === "deduct" ? "bg-red-100 text-red-700" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {entry.action === "set_limit" ? "" : entry.action === "deduct" ? "-" : "+"}
                            {entry.amount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(entry.timestamp)}</span>
                    </div>
                    {entry.reason && (
                      <p className="text-sm text-slate-600 mb-1">"{entry.reason}"</p>
                    )}
                    <p className="text-xs text-slate-400">
                      By: {entry.admin_email} | 
                      Before: {entry.before_state?.credits_used}/{entry.before_state?.monthly_credits} → 
                      After: {entry.after_state?.credits_used}/{entry.after_state?.monthly_credits}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No credit history yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Dialog */}
          <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getActionIcon()}
                  {getActionTitle()}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {actionType !== "reset" && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      {actionType === "set_limit" ? "New Monthly Limit" : "Amount"}
                    </Label>
                    <Input
                      type="number"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      placeholder={actionType === "set_limit" ? "e.g., 500" : "e.g., 50"}
                      min="0"
                      className="rounded-xl"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Reason (optional)</Label>
                  <Textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="e.g., Campaign bonus, Promotional offer..."
                    rows={2}
                    className="rounded-xl"
                  />
                </div>
                {actionType === "reset" && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">This will reset credits used to 0</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowActionDialog(false)}
                    variant="outline"
                    className="flex-1 rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitAction}
                    disabled={submitting}
                    className={`flex-1 rounded-full ${
                      actionType === "add_bonus" ? "bg-green-500 hover:bg-green-600" :
                      actionType === "reset" ? "bg-orange-500 hover:bg-orange-600" :
                      actionType === "deduct" ? "bg-red-500 hover:bg-red-600" :
                      "bg-indigo-600"
                    }`}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    );
  }

  return null;
}
