import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Users,
  ArrowUp,
  ArrowDown,
  Instagram,
  Target,
  RefreshCw,
  Wallet,
  MousePointer,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");
  const [analytics, setAnalytics] = useState(null);
  const [metaConnected, setMetaConnected] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
      
      let analyticsData = null;
      let connected = false;
      
      try {
        const analyticsRes = await api.get("/analytics", { params: { days: daysMap[timeRange] } });
        analyticsData = analyticsRes.data;
        connected = analyticsRes.data?.is_live || false;
      } catch (e) {
        console.log("Analytics API unavailable, using demo data");
      }
      
      try {
        const statusRes = await api.get("/integrations/status");
        connected = statusRes.data?.instagram?.connected || false;
      } catch (e) {
        console.log("Integration status unavailable");
      }
      
      // Use demo data if not connected or no data
      if (!analyticsData || !connected) {
        const multiplier = daysMap[timeRange] / 7;
        analyticsData = {
          reach: Math.floor(15800 * multiplier),
          impressions: Math.floor(42300 * multiplier),
          likes: Math.floor(1240 * multiplier),
          comments: Math.floor(89 * multiplier),
          ad_spend: 0,
          roas: 0,
          cpm: 0,
          ctr: 0,
          reach_change: 12.4,
          impressions_change: 8.7,
          likes_change: 5.2,
          comments_change: 3.1,
          weekly_data: generateDemoChartData(daysMap[timeRange]),
          content_breakdown: { posts: 45, reels: 30, stories: 25 },
          is_demo: true,
        };
      }
      
      setAnalytics(analyticsData);
      setMetaConnected(connected);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      // Fallback demo data
      setAnalytics({
        reach: 15800,
        impressions: 42300,
        likes: 1240,
        comments: 89,
        ad_spend: 0,
        roas: 0,
        cpm: 0,
        ctr: 0,
        weekly_data: generateDemoChartData(7),
        content_breakdown: { posts: 45, reels: 30, stories: 25 },
        is_demo: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDemoChartData = (days) => {
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        reach: Math.floor(Math.random() * 3000) + 1500,
        impressions: Math.floor(Math.random() * 8000) + 4000,
        engagement: Math.floor(Math.random() * 200) + 100,
      });
    }
    return data;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success("Analytics refreshed!");
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || "0";
  };

  const COLORS = ["#6366f1", "#8b5cf6", "#ec4899"];

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading analytics..." />
      </Layout>
    );
  }

  const contentData = analytics?.content_breakdown
    ? [
        { name: "Posts", value: analytics.content_breakdown.posts || 0 },
        { name: "Reels", value: analytics.content_breakdown.reels || 0 },
        { name: "Stories", value: analytics.content_breakdown.stories || 0 },
      ]
    : [];

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Analytics</h1>
            <p className="text-lg text-slate-600">
              {analytics?.is_demo
                ? "Demo analytics - connect Instagram for live data"
                : "Live data from your Instagram account"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex items-center bg-slate-100 rounded-full p-1">
              {["7d", "30d", "90d"].map((range) => (
                <button
                  key={range}
                  data-testid={`time-range-${range}`}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    timeRange === range
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>
            <Button
              data-testid="refresh-analytics-btn"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Reach */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-indigo-600" />
              </div>
              {analytics?.reach_change && (
                <div className={`flex items-center text-sm ${analytics.reach_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {analytics.reach_change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(analytics.reach_change)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(analytics?.reach)}</p>
            <p className="text-sm text-slate-500">Reach</p>
          </div>

          {/* Impressions */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              {analytics?.impressions_change && (
                <div className={`flex items-center text-sm ${analytics.impressions_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {analytics.impressions_change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(analytics.impressions_change)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(analytics?.impressions)}</p>
            <p className="text-sm text-slate-500">Impressions</p>
          </div>

          {/* Likes */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              {analytics?.likes_change && (
                <div className={`flex items-center text-sm ${analytics.likes_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {analytics.likes_change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(analytics.likes_change)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(analytics?.likes)}</p>
            <p className="text-sm text-slate-500">Likes</p>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              {analytics?.comments_change && (
                <div className={`flex items-center text-sm ${analytics.comments_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {analytics.comments_change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(analytics.comments_change)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(analytics?.comments)}</p>
            <p className="text-sm text-slate-500">Comments</p>
          </div>
        </div>

        {/* Ad Performance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(analytics?.ad_spend)}</p>
            <p className="text-sm text-slate-500">Ad Spend</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{analytics?.roas || 0}x</p>
            <p className="text-sm text-slate-500">ROAS</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(analytics?.cpm)}</p>
            <p className="text-sm text-slate-500">CPM</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{analytics?.ctr || 0}%</p>
            <p className="text-sm text-slate-500">CTR</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Line Chart - Reach & Impressions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Reach & Impressions</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.weekly_data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="reach"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1" }}
                    name="Reach"
                  />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6" }}
                    name="Impressions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart - Content Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Content Breakdown</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Engagement Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Engagement</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.weekly_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="engagement" fill="#ec4899" radius={[4, 4, 0, 0]} name="Engagement" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Connect Meta CTA */}
        {analytics?.is_demo && (
          <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
            <Instagram className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-bold mb-2">Connect Your Instagram</h3>
            <p className="text-indigo-100 mb-6 max-w-md mx-auto">
              Get real-time analytics, engagement metrics, and AI-powered insights for your café's social media.
            </p>
            <Button
              onClick={() => navigate("/settings")}
              className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-full px-8"
            >
              Connect Meta Account
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
