import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Palette,
  Link2,
  Lock,
  CreditCard,
  Instagram,
  Facebook,
  CheckCircle,
  XCircle,
  Loader2,
  Upload,
  Save,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import api, { brandAPI, billingAPI, integrationAPI, authAPI } from "@/services/api";

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const { user, impersonation } = useAuth();
  const [activeTab, setActiveTab] = useState("brand");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Brand state
  const [brand, setBrand] = useState({
    name: "",
    tagline: "",
    phone: "",
    address: "",
    website_url: "",
  });
  const [brandDNA, setBrandDNA] = useState(null);
  
  // Integration state
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);
  
  // Password state
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  
  // Billing state
  const [billing, setBilling] = useState(null);

  useEffect(() => {
    loadData();
    
    // Check for Meta OAuth callback
    const metaStatus = searchParams.get("meta");
    if (metaStatus === "connected") {
      toast.success("Meta accounts connected successfully!");
    } else if (metaStatus === "error") {
      toast.error("Failed to connect Meta accounts");
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [brandRes, integRes, billRes] = await Promise.all([
        brandAPI.getCurrent().catch(() => ({ data: null })),
        integrationAPI.getStatus().catch(() => ({ data: null })),
        billingAPI.get().catch(() => ({ data: null })),
      ]);
      
      if (brandRes.data) {
        setBrand({
          name: brandRes.data.name || "",
          tagline: brandRes.data.tagline || "",
          phone: brandRes.data.phone || "",
          address: brandRes.data.address || "",
          website_url: brandRes.data.website_url || "",
        });
        setBrandDNA(brandRes.data.brand_dna);
      }
      
      setIntegrationStatus(integRes.data);
      setBilling(billRes.data);
      
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrand = async () => {
    setSaving(true);
    try {
      await brandAPI.updateCurrent(brand);
      toast.success("Brand settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectMeta = async () => {
    setConnecting(true);
    try {
      const response = await integrationAPI.getMetaOAuthUrl();
      
      if (response.data.setup_required) {
        toast.info("Meta integration being configured by admin — connect later");
        setConnecting(false);
        return;
      }
      
      if (response.data.oauth_url) {
        window.location.href = response.data.oauth_url;
      } else {
        toast.error("Failed to get OAuth URL");
        setConnecting(false);
      }
    } catch (error) {
      toast.error("Failed to start connection");
      setConnecting(false);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!confirm("Are you sure you want to disconnect your Meta accounts?")) return;
    
    try {
      await integrationAPI.disconnectMeta();
      toast.success("Meta accounts disconnected");
      loadData();
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords don't match");
      return;
    }
    
    if (passwords.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setSaving(true);
    try {
      await authAPI.changePassword(passwords.current, passwords.new);
      toast.success("Password changed successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "brand", label: "Brand DNA", icon: Palette },
    { id: "meta", label: "Meta Connection", icon: Link2 },
    { id: "password", label: "Password", icon: Lock },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  // Hide password tab during impersonation
  const visibleTabs = impersonation ? tabs.filter(t => t.id !== "password") : tabs;

  const whatsappLink = "https://wa.me/919330408074?text=" + encodeURIComponent("Hi, I need help with Frameflow settings");

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading settings..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your account and brand settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-100 pb-4">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          {/* Brand DNA Tab */}
          {activeTab === "brand" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Brand DNA</h2>
                <p className="text-slate-600 text-sm">Edit your business information and brand settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Business Name</Label>
                  <Input
                    value={brand.name}
                    onChange={(e) => setBrand({ ...brand, name: e.target.value })}
                    placeholder="Your Café Name"
                    className="mt-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Tagline</Label>
                  <Input
                    value={brand.tagline}
                    onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
                    placeholder="Where coffee meets comfort"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={brand.phone}
                    onChange={(e) => setBrand({ ...brand, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={brand.website_url}
                    onChange={(e) => setBrand({ ...brand, website_url: e.target.value })}
                    placeholder="https://yourcafe.com"
                    className="mt-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={brand.address}
                    onChange={(e) => setBrand({ ...brand, address: e.target.value })}
                    placeholder="Full business address"
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Brand DNA Preview */}
              {brandDNA && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <h4 className="font-medium text-indigo-900 mb-3">Detected Brand Style</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-indigo-600">Tone:</span>
                      <span className="ml-2 text-slate-700 capitalize">{brandDNA.brand_tone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600">Logo Position:</span>
                      <span className="ml-2 text-slate-700">{brandDNA.logo_position || "—"}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600">Font:</span>
                      <span className="ml-2 text-slate-700">{brandDNA.font_style || "—"}</span>
                    </div>
                    {brandDNA.primary_colors && (
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600">Colors:</span>
                        {brandDNA.primary_colors.slice(0, 4).map((color, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button onClick={handleSaveBrand} disabled={saving} className="rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          )}

          {/* Meta Connection Tab */}
          {activeTab === "meta" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Meta Connection</h2>
                <p className="text-slate-600 text-sm">Connect your Facebook and Instagram accounts</p>
              </div>

              {/* Instagram */}
              <div className="p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center">
                      <Instagram className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Instagram</h3>
                      <div className="flex items-center gap-2 text-sm">
                        {integrationStatus?.instagram?.connected ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-500">Not connected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {integrationStatus?.instagram?.connected ? (
                    <Button variant="outline" onClick={handleDisconnectMeta} className="rounded-xl">
                      Disconnect
                    </Button>
                  ) : (
                    <Button onClick={handleConnectMeta} disabled={connecting} className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-500">
                      {connecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Connect
                    </Button>
                  )}
                </div>
                
                {/* Connected accounts */}
                {integrationStatus?.instagram?.accounts?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {integrationStatus.instagram.accounts.map((account, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                        {account.profile_picture_url ? (
                          <img src={account.profile_picture_url} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400" />
                        )}
                        <div>
                          <div className="font-medium text-slate-900">@{account.username}</div>
                          <div className="text-xs text-slate-500">{account.followers_count?.toLocaleString()} followers</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Facebook */}
              <div className="p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Facebook className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Facebook</h3>
                      <div className="flex items-center gap-2 text-sm">
                        {integrationStatus?.facebook?.connected ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-500">Not connected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info notice */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Connect once, works forever. Your data is private and secure. 
                  You can revoke access anytime from here or from Meta settings.
                </p>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && !impersonation && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Change Password</h2>
                <p className="text-slate-600 text-sm">Update your account password</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    required
                    minLength={6}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    required
                    minLength={6}
                    className="mt-2"
                  />
                </div>
                <Button type="submit" disabled={saving} className="rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Change Password
                </Button>
              </form>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Billing</h2>
                <p className="text-slate-600 text-sm">View your plan and payment status</p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <h3 className="text-lg font-semibold mb-1">{billing?.plan || "Frameflow Professional"}</h3>
                <p className="text-white/80">Monthly subscription</p>
                <div className="text-3xl font-bold mt-4">₹{billing?.monthly_fee?.toLocaleString() || "15,000"}<span className="text-lg font-normal">/month</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50">
                  <div className="text-sm text-slate-500">Plan Start</div>
                  <div className="font-semibold text-slate-900">
                    {billing?.plan_start ? new Date(billing.plan_start).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50">
                  <div className="text-sm text-slate-500">Next Due Date</div>
                  <div className="font-semibold text-slate-900">
                    {billing?.current_billing?.due_date ? new Date(billing.current_billing.due_date).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50">
                  <div className="text-sm text-slate-500">Payment Status</div>
                  <div className="font-semibold">
                    {billing?.current_billing?.status === "paid" ? (
                      <span className="text-green-600">Paid ✅</span>
                    ) : (
                      <span className="text-amber-600">Unpaid ⏳</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {billing?.history?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {billing.history.map((payment, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                        <div>
                          <div className="font-medium text-slate-900">₹{payment.amount?.toLocaleString()}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === "paid" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="mt-8 p-6 rounded-2xl bg-green-50 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">Need help with settings?</h3>
              <p className="text-sm text-green-700">Chat with us on WhatsApp for quick support</p>
            </div>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
