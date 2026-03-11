import { useState, useEffect } from "react";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Users,
  Calendar,
  Instagram,
  Loader2,
  Zap,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [metaConnected, setMetaConnected] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/analytics/dashboard");
      setData(response.data);
      setMetaConnected(response.data?.meta_connected || false);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatIndianNumber = (num) => {
    if (typeof num === 'string' && num.includes(',')) return num;
    const n = parseInt(num);
    if (isNaN(n)) return num;
    return n.toLocaleString('en-IN');
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

  const displayData = data?.meta_connected ? data : data?.demo_data || {};

  return (
    <ClientLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900">Analytics</h1>
              <p className="text-slate-600">Track your social media performance</p>
            </div>
          </div>
        </div>

        {/* Connect Instagram Banner */}
        {!metaConnected && (
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 mb-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-1">Connect Instagram</h3>
                <p className="text-white/80">Connect your Instagram to see real analytics data</p>
              </div>
              <Button className="bg-white text-pink-600 hover:bg-white/90 rounded-full px-6">
                <Instagram className="w-4 h-4 mr-2" />
                Connect Instagram
              </Button>
            </div>
          </div>
        )}

        {/* Demo Data Notice */}
        {!metaConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <span className="font-semibold">Demo Mode:</span> Connect Instagram to see real analytics
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Posts This Month */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="flex items-center text-green-600 text-sm font-medium">
                <ArrowUp className="w-4 h-4 mr-1" /> 12%
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              {formatIndianNumber(displayData.posts_this_month || 12)}
            </p>
            <p className="text-sm text-slate-500">Posts this month</p>
          </div>

          {/* Total Reach */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="flex items-center text-green-600 text-sm font-medium">
                <ArrowUp className="w-4 h-4 mr-1" /> 8%
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              {formatIndianNumber(displayData.total_reach || "8,54,200")}
            </p>
            <p className="text-sm text-slate-500">Total reach</p>
          </div>

          {/* Total Engagement */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <span className="flex items-center text-green-600 text-sm font-medium">
                <ArrowUp className="w-4 h-4 mr-1" /> 15%
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              {formatIndianNumber(displayData.total_engagement || "45,890")}
            </p>
            <p className="text-sm text-slate-500">Total engagement</p>
          </div>

          {/* Engagement Rate */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="flex items-center text-green-600 text-sm font-medium">
                <ArrowUp className="w-4 h-4 mr-1" /> 2%
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              {displayData.engagement_rate || "5.4%"}
            </p>
            <p className="text-sm text-slate-500">Engagement rate</p>
          </div>
        </div>

        {/* Credits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Credits Used */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Credits Used</h3>
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mb-4">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-slate-900">{data?.credits_used || 0}</span>
                <span className="text-slate-500 mb-1">/ {data?.monthly_credits || 250}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${((data?.credits_used || 0) / (data?.monthly_credits || 250)) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-slate-500">
              {data?.credits_reset_date 
                ? `Resets on ${new Date(data.credits_reset_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                : "Resets monthly"
              }
            </p>
          </div>

          {/* Best Performing Post */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Best Performing Post</h3>
            {data?.best_post ? (
              <div className="flex items-center gap-4">
                <img
                  src={data.best_post.url}
                  alt="Best post"
                  className="w-20 h-20 rounded-xl object-cover"
                  onError={(e) => {
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23f1f5f9' width='80' height='80'/%3E%3C/svg%3E";
                  }}
                />
                <div>
                  <p className="font-medium text-slate-900">{data.best_post.filename || "Recent Post"}</p>
                  <p className="text-sm text-slate-500">{data.best_post.source}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No posts yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Placeholder Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reach Over Time */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Reach Over Time</h3>
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl">
              {metaConnected ? (
                <p className="text-slate-500">Chart coming soon</p>
              ) : (
                <p className="text-slate-500">Connect Instagram to view</p>
              )}
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Engagement Breakdown</h3>
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl">
              {metaConnected ? (
                <p className="text-slate-500">Chart coming soon</p>
              ) : (
                <p className="text-slate-500">Connect Instagram to view</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
