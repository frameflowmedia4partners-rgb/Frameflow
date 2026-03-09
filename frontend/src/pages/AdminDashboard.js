import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
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
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Shield,
  Coffee,
  BarChart3,
  CheckCircle,
  XCircle,
  Trash2,
  Key,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "@/services/api";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Create user dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", cafe_name: "" });

  // Reset password dialog
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== "admin") {
      toast.error("Admin access required");
      navigate("/dashboard");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, statsRes] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getStats(),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load admin data:", error);
      if (error.response?.status === 403) {
        toast.error("Admin access required");
        navigate("/dashboard");
      } else {
        setError("Failed to load admin data");
        toast.error("Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.cafe_name) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setCreating(true);
    try {
      await adminAPI.createUser(newUser);
      toast.success(`Café "${newUser.cafe_name}" created successfully!`);
      setShowCreateDialog(false);
      setNewUser({ email: "", password: "", cafe_name: "" });
      loadData();
    } catch (error) {
      console.error("Failed to create user:", error);
      toast.error(error.response?.data?.detail || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUser(userId, { is_active: !currentStatus });
      toast.success(currentStatus ? "Account deactivated" : "Account activated");
      loadData();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update account status");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setResetting(true);
    try {
      await adminAPI.resetPassword(resetUserId, newPassword);
      toast.success("Password reset successfully");
      setShowResetDialog(false);
      setResetUserId(null);
      setNewPassword("");
    } catch (error) {
      console.error("Failed to reset password:", error);
      toast.error("Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    setDeleting(true);
    try {
      await adminAPI.deleteUser(deleteUserId);
      toast.success("User deleted successfully");
      setShowDeleteDialog(false);
      setDeleteUserId(null);
      loadData();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading admin dashboard..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={loadData} className="rounded-full px-6">
            Try Again
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-4xl font-bold font-outfit text-slate-900">Admin Dashboard</h1>
            </div>
            <p className="text-lg text-slate-600">Manage café accounts and platform users</p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                data-testid="admin-create-user-btn"
                className="rounded-full px-6 py-3 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create Café Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-outfit text-2xl">Create New Café Account</DialogTitle>
                <DialogDescription>
                  Create a new account for a café. They will receive login credentials.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Café Name</Label>
                  <Input
                    data-testid="new-cafe-name-input"
                    value={newUser.cafe_name}
                    onChange={(e) => setNewUser({ ...newUser, cafe_name: e.target.value })}
                    placeholder="Urban Brew Café"
                    className="mt-2"
                    disabled={creating}
                  />
                </div>
                <div>
                  <Label>Owner Email</Label>
                  <Input
                    data-testid="new-user-email-input"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="owner@cafe.com"
                    className="mt-2"
                    disabled={creating}
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    data-testid="new-user-password-input"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                    className="mt-2"
                    disabled={creating}
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                </div>
                <Button
                  data-testid="create-user-submit-btn"
                  onClick={handleCreateUser}
                  disabled={creating}
                  className="w-full rounded-full py-6 bg-indigo-600"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="text-3xl font-bold font-outfit text-slate-900 mb-1">{stats.total_users}</div>
              <div className="text-sm text-slate-600">Total Cafés</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold font-outfit text-slate-900 mb-1">{stats.active_users}</div>
              <div className="text-sm text-slate-600">Active Accounts</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold font-outfit text-slate-900 mb-1">{stats.total_projects}</div>
              <div className="text-sm text-slate-600">Total Campaigns</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="text-3xl font-bold font-outfit text-slate-900 mb-1">{stats.total_contents}</div>
              <div className="text-sm text-slate-600">Content Generated</div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold font-outfit text-slate-900">Café Accounts</h2>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  data-testid="search-users-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search cafés..."
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Café Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Email</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Created</th>
                  <th className="text-right py-4 px-6 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      data-testid={`user-row-${u.id}`}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <Coffee className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{u.full_name}</div>
                            {u.brand && (
                              <div className="text-xs text-slate-500">{u.brand.industry || "Café"}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{u.email}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            u.is_active !== false
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {u.is_active !== false ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            data-testid={`toggle-status-btn-${u.id}`}
                            onClick={() => handleToggleActive(u.id, u.is_active !== false)}
                            variant="ghost"
                            size="sm"
                            className={`rounded-lg ${
                              u.is_active !== false
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                : "text-green-600 hover:text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {u.is_active !== false ? (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            data-testid={`reset-password-btn-${u.id}`}
                            onClick={() => {
                              setResetUserId(u.id);
                              setShowResetDialog(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-slate-600 hover:text-slate-900"
                          >
                            <Key className="w-4 h-4 mr-1" />
                            Reset
                          </Button>
                          <Button
                            data-testid={`delete-user-btn-${u.id}`}
                            onClick={() => {
                              setDeleteUserId(u.id);
                              setShowDeleteDialog(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      {searchTerm ? "No cafés match your search" : "No café accounts yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reset Password Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>Enter a new password for this user.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
              </div>
              <Button
                onClick={handleResetPassword}
                disabled={resetting}
                className="w-full rounded-full py-6 bg-indigo-600"
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this account? This will permanently remove the user
                and all their data including brands, campaigns, and content. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowDeleteDialog(false)}
                variant="outline"
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
