import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState({
    instagram: { connected: false, account: null },
    meta: { connected: false, account: null }
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    // In production, this would check actual OAuth connections
    // For now, we show the connection UI
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleConnectInstagram = () => {
    // In production, this would redirect to Instagram OAuth
    toast.info("Instagram OAuth integration requires your own Meta Developer App credentials.");
    window.open("https://developers.facebook.com/docs/instagram-api/getting-started", "_blank");
  };

  const handleConnectMeta = () => {
    // In production, this would redirect to Meta Ads OAuth
    toast.info("Meta Ads integration requires your own Meta Business credentials.");
    window.open("https://developers.facebook.com/docs/marketing-apis/overview", "_blank");
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading integrations..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Integrations</h1>
          <p className="text-lg text-slate-600">Connect your social media accounts to post and run ads</p>
        </div>

        {/* Important Notice */}
        <div className="mb-8 p-6 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Your Own Credentials Required</h3>
              <p className="text-sm text-amber-700">
                Frameflow does not provide API credentials. You must connect your own Instagram Business Account 
                and Meta Ads Account to enable posting and advertising features. This ensures you maintain 
                full control of your social media presence.
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
                  <p className="text-white/80">Post content directly to Instagram</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                {connections.instagram.connected ? (
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
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  Post images and carousels
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  Publish reels and videos
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  Schedule content ahead
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  View engagement metrics
                </div>
              </div>

              {connections.instagram.connected ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50">
                    <div className="text-sm text-slate-500">Connected Account</div>
                    <div className="font-semibold text-slate-900">@{connections.instagram.account}</div>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reconnect Account
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleConnectInstagram}
                  className="w-full rounded-xl py-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:scale-105 transition-all"
                >
                  <Link2 className="w-5 h-5 mr-2" />
                  Connect Instagram Account
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
                {connections.meta.connected ? (
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
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  Create ad campaigns
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  Target local audiences
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  Set custom budgets
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  Track ad performance
                </div>
              </div>

              {connections.meta.connected ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50">
                    <div className="text-sm text-slate-500">Ad Account</div>
                    <div className="font-semibold text-slate-900">{connections.meta.account}</div>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Ad Account
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleConnectMeta}
                  className="w-full rounded-xl py-6 bg-blue-600 text-white font-semibold hover:scale-105 transition-all"
                >
                  <Link2 className="w-5 h-5 mr-2" />
                  Connect Meta Ads Account
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Setup Guide */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-6">How to Connect Your Accounts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Create Meta Developer App</h4>
              <p className="text-sm text-slate-600">
                Visit developers.facebook.com and create a new app for your café business.
              </p>
              <a 
                href="https://developers.facebook.com/apps/create/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
              >
                Create App <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-indigo-600">2</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Convert to Business Account</h4>
              <p className="text-sm text-slate-600">
                Ensure your Instagram account is a Business or Creator account linked to a Facebook Page.
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
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-indigo-600">3</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Authorize Frameflow</h4>
              <p className="text-sm text-slate-600">
                Click the connect buttons above and authorize Frameflow to manage your accounts.
              </p>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-8 p-6 rounded-2xl bg-green-50 border border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Your Data is Secure</h4>
              <p className="text-sm text-green-700">
                Frameflow uses OAuth 2.0 for secure authentication. We never store your social media passwords. 
                You can revoke access at any time from your Meta or Instagram settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
