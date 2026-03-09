import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Instagram,
  Facebook,
  Link2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Shield,
  AlertTriangle,
  RefreshCw,
  Settings,
  Loader2,
  Users,
  Image as ImageIcon,
  BarChart3,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function IntegrationsPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState({
    instagram: { connected: false, accounts: [], connected_at: null },
    meta_ads: { connected: false, account_id: null, connected_at: null }
  });

  useEffect(() => {
    // Check for OAuth callback params
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const platform = searchParams.get("platform");
    
    if (success === "true" && platform) {
      toast.success(`${platform === 'instagram' ? 'Instagram' : 'Meta Ads'} connected successfully!`);
    } else if (error === "true") {
      const message = searchParams.get("message") || "Connection failed";
      toast.error(`Connection failed: ${message}`);
    }
    
    loadIntegrations();
  }, [searchParams]);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const response = await api.get("/integrations/status");
      setIntegrationStatus(response.data);
    } catch (error) {
      console.error("Failed to load integrations:", error);
      toast.error("Failed to load integration status");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectInstagram = async () => {
    setConnecting(true);
    try {
      const response = await api.get("/integrations/instagram/oauth-url");
      
      if (response.data.setup_required) {
        toast.error(response.data.error);
        return;
      }
      
      if (response.data.oauth_url) {
        window.location.href = response.data.oauth_url;
      } else {
        toast.error("Failed to generate OAuth URL");
      }
    } catch (error) {
      console.error("Failed to start OAuth:", error);
      toast.error("Failed to start Instagram connection");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    if (!confirm("Are you sure you want to disconnect your Instagram account?")) return;
    
    try {
      await api.delete("/integrations/instagram");
      toast.success("Instagram disconnected");
      loadIntegrations();
    } catch (error) {
      toast.error("Failed to disconnect Instagram");
    }
  };

  const handleSelectAccount = async (accountId) => {
    try {
      await api.post("/integrations/instagram/select-account", null, {
        params: { account_id: accountId }
      });
      toast.success("Account selected");
      loadIntegrations();
    } catch (error) {
      toast.error("Failed to select account");
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading integrations..." />
      </Layout>
    );
  }

  const instagramAccounts = integrationStatus.instagram?.accounts || [];
  const selectedAccount = instagramAccounts.find(acc => acc.selected) || instagramAccounts[0];

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Integrations</h1>
          <p className="text-lg text-slate-600">Connect your social media accounts to post content and run ads</p>
        </div>

        {/* Important Notice */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Connect Your Business Accounts</h3>
              <p className="text-sm text-amber-800">
                To post content and run ads, connect your Instagram Business Account and Meta Ads Account. 
                This enables Frameflow to publish content and access analytics on your behalf.
                You maintain full control and can revoke access anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Instagram Connection */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Instagram className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Instagram</h3>
                  <p className="text-white/80">Post content & view analytics</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Connection Status */}
              <div className="flex items-center gap-3 mb-6">
                {integrationStatus.instagram?.connected ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="font-medium text-green-700">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-slate-400" />
                    <span className="font-medium text-slate-600">Not Connected</span>
                  </>
                )}
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <ImageIcon className="w-4 h-4 text-pink-500" />
                  Post images, videos, and reels
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  View real engagement metrics
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Track follower growth
                </div>
              </div>

              {integrationStatus.instagram?.connected ? (
                <div className="space-y-4">
                  {/* Connected Account Info */}
                  {selectedAccount && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100">
                      <div className="flex items-center gap-3">
                        {selectedAccount.profile_picture_url ? (
                          <img 
                            src={selectedAccount.profile_picture_url} 
                            alt={selectedAccount.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold">
                            {selectedAccount.username?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">@{selectedAccount.username}</div>
                          <div className="text-sm text-slate-600">
                            {selectedAccount.followers_count?.toLocaleString() || 0} followers
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multiple Accounts Selector */}
                  {instagramAccounts.length > 1 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Switch Account</label>
                      <div className="space-y-2">
                        {instagramAccounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => handleSelectAccount(account.id)}
                            className={`w-full p-3 rounded-lg border text-left transition-colors ${
                              account.id === selectedAccount?.id 
                                ? "border-pink-500 bg-pink-50" 
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="font-medium text-slate-900">@{account.username}</div>
                            <div className="text-xs text-slate-500">{account.page_name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl"
                      onClick={handleConnectInstagram}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reconnect
                    </Button>
                    <Button 
                      variant="outline" 
                      className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleDisconnectInstagram}
                    >
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  data-testid="connect-instagram-btn"
                  onClick={handleConnectInstagram}
                  disabled={connecting}
                  className="w-full rounded-xl py-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-pink-500/25"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-5 h-5 mr-2" />
                      Connect Instagram Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Meta Ads Connection */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-500">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Facebook className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Meta Ads</h3>
                  <p className="text-white/80">Run Facebook & Instagram ads</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                {integrationStatus.meta_ads?.connected ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="font-medium text-green-700">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-slate-400" />
                    <span className="font-medium text-slate-600">Not Connected</span>
                  </>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Create ad campaigns
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Target local café audiences
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Track ad performance
                </div>
              </div>

              {integrationStatus.meta_ads?.connected ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-sm text-blue-600">Ad Account Connected</div>
                    <div className="font-semibold text-blue-900">
                      {integrationStatus.meta_ads.account_id || "Active"}
                    </div>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Ad Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button 
                    data-testid="connect-meta-ads-btn"
                    onClick={handleConnectInstagram}
                    disabled={connecting}
                    className="w-full rounded-xl py-6 bg-blue-600 text-white font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/25"
                  >
                    <Link2 className="w-5 h-5 mr-2" />
                    Connect Meta Ads Account
                  </Button>
                  <p className="text-xs text-center text-slate-500">
                    Uses the same Meta login as Instagram
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Setup Guide */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-8">
          <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-6">How to Connect Your Accounts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Switch to Business Account</h4>
              <p className="text-sm text-slate-600">
                Your Instagram must be a Business or Creator account linked to a Facebook Page.
              </p>
              <a 
                href="https://help.instagram.com/502981923235522" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
              >
                Learn How <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Click Connect</h4>
              <p className="text-sm text-slate-600">
                Click the "Connect Instagram Account" button and log in with Facebook.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Grant Permissions</h4>
              <p className="text-sm text-slate-600">
                Allow Frameflow to manage your content and view insights. You can revoke access anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Your Data is Secure</h4>
              <p className="text-sm text-green-800">
                Frameflow uses OAuth 2.0 for secure authentication. We never store your social media passwords. 
                All access tokens are encrypted and you can revoke access at any time from your Meta settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
