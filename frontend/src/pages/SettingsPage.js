import { useState, useEffect, useRef } from "react";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  User,
  Link2,
  Bell,
  CreditCard,
  Instagram,
  Loader2,
  Save,
  Upload,
  Check,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "preferences", label: "Preferences", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState(null);
  const fileInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    brand_name: "",
    email: "",
    phone: "",
    swiggy_url: "",
    zomato_url: "",
    show_delivery_badges: true,
    default_language: "English",
    default_post_format: "feed",
    default_reel_style: "cinematic",
    notifications_enabled: true,
    share_to_inspo: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/settings");
      setSettings(response.data);
      
      // Populate form
      setFormData({
        brand_name: response.data?.profile?.brand_name || "",
        email: response.data?.profile?.email || "",
        phone: response.data?.profile?.phone || "",
        swiggy_url: response.data?.integrations?.swiggy_url || "",
        zomato_url: response.data?.integrations?.zomato_url || "",
        show_delivery_badges: response.data?.integrations?.show_delivery_badges ?? true,
        default_language: response.data?.preferences?.default_language || "English",
        default_post_format: response.data?.preferences?.default_post_format || "feed",
        default_reel_style: response.data?.preferences?.default_reel_style || "cinematic",
        notifications_enabled: response.data?.preferences?.notifications_enabled ?? true,
        share_to_inspo: response.data?.preferences?.share_to_inspo ?? false,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", formData);
      toast.success("Settings saved!");
      loadSettings();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Failed to save settings";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const formDataObj = new FormData();
        formDataObj.append("photo_data", event.target.result);
        
        await api.post("/settings/upload-photo", formDataObj, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        toast.success("Photo updated!");
        loadSettings();
      } catch (error) {
        toast.error("Failed to upload photo");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWhatsAppContact = () => {
    window.open("https://wa.me/919330408074?text=Hi, I need help with my Frameflow account", "_blank");
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
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900">Settings</h1>
              <p className="text-slate-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Profile Information</h3>
                
                {/* Photo Upload */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    {settings?.profile?.profile_photo ? (
                      <img
                        src={settings.profile.profile_photo}
                        alt="Profile"
                        className="w-20 h-20 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Brand Name</Label>
                    <Input
                      value={formData.brand_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Integrations</h3>
              
              {/* Instagram */}
              <div className="p-4 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                      <Instagram className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Instagram</p>
                      <p className={`text-sm ${settings?.integrations?.instagram_connected ? "text-green-600" : "text-slate-500"}`}>
                        {settings?.integrations?.instagram_connected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Button variant={settings?.integrations?.instagram_connected ? "outline" : "default"} className="rounded-full">
                    {settings?.integrations?.instagram_connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>

              {/* Delivery URLs */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Swiggy URL</Label>
                <Input
                  value={formData.swiggy_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, swiggy_url: e.target.value }))}
                  placeholder="https://swiggy.com/your-restaurant"
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Zomato URL</Label>
                <Input
                  value={formData.zomato_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, zomato_url: e.target.value }))}
                  placeholder="https://zomato.com/your-restaurant"
                  className="rounded-xl"
                />
              </div>

              {/* Show Delivery Badges */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">Show Delivery Badges</p>
                  <p className="text-sm text-slate-500">Display Swiggy & Zomato badges on posts</p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, show_delivery_badges: !prev.show_delivery_badges }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.show_delivery_badges ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    formData.show_delivery_badges ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Preferences</h3>
              
              {/* Language */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Default Language</Label>
                <div className="flex gap-2">
                  {["English", "Hindi", "Bengali"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setFormData(prev => ({ ...prev, default_language: lang }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        formData.default_language === lang
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Post Format */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Default Post Format</Label>
                <div className="flex gap-2">
                  {["feed", "story"].map((format) => (
                    <button
                      key={format}
                      onClick={() => setFormData(prev => ({ ...prev, default_post_format: format }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                        formData.default_post_format === format
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Reel Style */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Default Reel Style</Label>
                <div className="flex gap-2">
                  {["cinematic", "casual"].map((style) => (
                    <button
                      key={style}
                      onClick={() => setFormData(prev => ({ ...prev, default_reel_style: style }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                        formData.default_reel_style === style
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">Email Notifications</p>
                  <p className="text-sm text-slate-500">Receive updates and alerts via email</p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, notifications_enabled: !prev.notifications_enabled }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.notifications_enabled ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    formData.notifications_enabled ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              {/* Share to Inspo */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">Share to Inspiration Gallery</p>
                  <p className="text-sm text-slate-500">Allow your posts to appear in public gallery</p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, share_to_inspo: !prev.share_to_inspo }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.share_to_inspo ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    formData.share_to_inspo ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Billing & Credits</h3>
              
              {/* Credits Info */}
              <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl text-white">
                <p className="text-white/80 mb-2">Credits Used This Month</p>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-bold">{settings?.billing?.credits_used || 0}</span>
                  <span className="text-white/80 text-xl mb-1">/ {settings?.billing?.monthly_credits || 250}</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{ width: `${((settings?.billing?.credits_used || 0) / (settings?.billing?.monthly_credits || 250)) * 100}%` }}
                  />
                </div>
                <p className="text-white/60 text-sm mt-2">
                  Credits reset monthly
                </p>
              </div>

              {/* Contact */}
              <div className="p-4 border border-slate-200 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-2">Need more credits?</h4>
                <p className="text-slate-600 text-sm mb-4">
                  Contact your account manager to discuss upgrading your plan.
                </p>
                <Button
                  onClick={handleWhatsAppContact}
                  className="rounded-full bg-green-500 hover:bg-green-600"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact on WhatsApp
                </Button>
              </div>
            </div>
          )}

          {/* Save Button */}
          {activeTab !== "billing" && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-indigo-600 px-8"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
