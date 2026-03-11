import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Key,
  Copy,
  Check,
  X,
  Search,
  BarChart3,
  CreditCard,
  MessageSquare,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [showAddClient, setShowAddClient] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [tempPassword, setTempPassword] = useState("");
  const [copiedPassword, setCopiedPassword] = useState(false);
  
  // Form states
  const [newClient, setNewClient] = useState({
    business_name: "",
    email: "",
    password: "",
    plan_start_date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsRes, statsRes] = await Promise.all([
        api.get("/admin/clients"),
        api.get("/admin/stats")
      ]);
      setClients(clientsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load admin data:", error);
      if (error.response?.status === 403) {
        toast.error("Admin access required");
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await api.post("/admin/clients", newClient);
      toast.success("Client created successfully");
      setShowAddClient(false);
      setNewClient({ business_name: "", email: "", password: "", plan_start_date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedClient) return;
    setSubmitting(true);
    
    try {
      const response = await api.post(`/admin/clients/${selectedClient.id}/reset-password`);
      setTempPassword(response.data.temporary_password);
      toast.success("Password reset successfully");
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    setSubmitting(true);
    
    try {
      await api.delete(`/admin/clients/${selectedClient.id}`);
      toast.success("Client deleted successfully");
      setShowDeleteConfirm(false);
      setSelectedClient(null);
      loadData();
    } catch (error) {
      toast.error("Failed to delete client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (client) => {
    try {
      await api.put(`/admin/clients/${client.id}`, {
        is_active: !client.is_active
      });
      toast.success(client.is_active ? "Client deactivated" : "Client activated");
      loadData();
    } catch (error) {
      toast.error("Failed to update client");
    }
  };

  const handleImpersonate = async (client) => {
    try {
      const response = await api.post(`/admin/clients/${client.id}/impersonate`);
      // Store the impersonation token
      localStorage.setItem("frameflow_token", response.data.token);
      localStorage.setItem("impersonating", JSON.stringify({
        client_name: response.data.client_name,
        client_email: response.data.client_email
      }));
      toast.success(`Viewing ${response.data.client_name}'s dashboard`);
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Failed to enter client dashboard");
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading admin panel..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-1">Client Management</h1>
            <p className="text-slate-600">Manage your Frameflow clients</p>
          </div>
          <Button
            onClick={() => setShowAddClient(true)}
            className="rounded-full px-6 bg-indigo-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Client
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-sm text-slate-600">Total Clients</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.total_clients}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-slate-600">Active</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.active_clients}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-slate-600">Meta Connected</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.meta_connected}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm text-slate-600">Total Posts</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.total_scheduled_posts}</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/credits")}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-5 text-left hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg">Credit Management</span>
            </div>
            <p className="text-sm text-white/80">
              Manage client credits, add bonuses, set limits, and view usage history
            </p>
          </button>
          <button
            onClick={() => navigate("/admin/billing")}
            className="bg-white border border-slate-200 text-slate-900 rounded-2xl p-5 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-semibold text-lg">Billing & Payments</span>
            </div>
            <p className="text-sm text-slate-600">
              Track payments, mark invoices as paid, view payment history
            </p>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 rounded-xl"
            />
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Plan Start</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Payment</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Last Login</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{client.full_name}</div>
                        {client.brand?.name && client.brand.name !== client.full_name && (
                          <div className="text-xs text-slate-500">{client.brand.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{client.email}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {client.plan_start_date ? new Date(client.plan_start_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {client.billing?.status === "paid" ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid ✅</span>
                        ) : client.billing?.is_overdue ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Overdue 🔴</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Unpaid ⏳</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {client.last_login ? new Date(client.last_login).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(client)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.is_active 
                              ? "bg-green-100 text-green-700" 
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {client.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleImpersonate(client)}
                            className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600"
                            title="View Dashboard"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setTempPassword("");
                              setShowResetPassword(true);
                            }}
                            className="p-2 rounded-lg hover:bg-amber-50 text-amber-600"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit text-xl">Add New Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddClient} className="space-y-4 pt-4">
            <div>
              <Label>Business Name</Label>
              <Input
                value={newClient.business_name}
                onChange={(e) => setNewClient({ ...newClient, business_name: e.target.value })}
                placeholder="Urban Brew Café"
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                placeholder="owner@cafe.com"
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={newClient.password}
                onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                placeholder="Set initial password"
                required
                minLength={6}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Plan Start Date</Label>
              <Input
                type="date"
                value={newClient.plan_start_date}
                onChange={(e) => setNewClient({ ...newClient, plan_start_date: e.target.value })}
                className="mt-2"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full rounded-xl">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Create Client
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit text-xl">Reset Password</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {tempPassword ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Temporary password for <strong>{selectedClient?.email}</strong>:
                </p>
                <div className="flex items-center gap-2 p-4 bg-slate-100 rounded-xl">
                  <code className="flex-1 font-mono text-lg">{tempPassword}</code>
                  <button
                    onClick={copyPassword}
                    className="p-2 rounded-lg hover:bg-slate-200"
                  >
                    {copiedPassword ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  This password is shown only once. Make sure to copy it now.
                </p>
                <Button onClick={() => setShowResetPassword(false)} className="w-full rounded-xl">
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-600">
                  Generate a temporary password for <strong>{selectedClient?.full_name}</strong>?
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowResetPassword(false)} className="flex-1 rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={handleResetPassword} disabled={submitting} className="flex-1 rounded-xl">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Generate Password
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit text-xl text-red-600">Delete Client</DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-4">
            <p className="text-slate-600">
              Are you sure you want to delete <strong>{selectedClient?.full_name}</strong>? 
              This will permanently remove all their data including:
            </p>
            <ul className="text-sm text-slate-500 list-disc list-inside space-y-1">
              <li>Brand profile and assets</li>
              <li>Content library</li>
              <li>Scheduled posts</li>
              <li>Campaigns</li>
              <li>Billing records</li>
            </ul>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteClient} 
                disabled={submitting}
                className="flex-1 rounded-xl"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Delete Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
