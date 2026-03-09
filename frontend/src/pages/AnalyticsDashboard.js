import { useState, useEffect } from "react";
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
  Calendar,
  ArrowUp,
  ArrowDown,
  Instagram,
  Target,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { statsAPI, adsAPI } from "@/services/api";

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [stats, setStats] = useState({
    overview: {
      totalReach: 12450,
      totalImpressions: 28340,
      totalEngagement: 2156,
      engagementRate: 7.6,
      followers: 1842,
      followerGrowth: 12.4
    },
    posts: {
      total: 24,
      images: 18,
      videos: 4,
      reels: 2
    },
    topPosts: [
      { id: 1, type: "image", caption: "New seasonal latte drop! 🍂", reach: 2340, likes: 189, comments: 24 },
      { id: 2, type: "reel", caption: "Behind the scenes at Urban Brew", reach: 3120, likes: 267, comments: 45 },
      { id: 3, type: "image", caption: "Cozy corner vibes ☕", reach: 1890, likes: 156, comments: 18 }
    ],
    weeklyData: [
      { day: "Mon", reach: 1200, engagement: 89 },
      { day: "Tue", reach: 1450, engagement: 112 },
      { day: "Wed", reach: 980, engagement: 76 },
      { day: "Thu", reach: 1680, engagement: 134 },
      { day: "Fri", reach: 2100, engagement: 178 },
      { day: "Sat", reach: 2450, engagement: 201 },
      { day: "Sun", reach: 1890, engagement: 156 }
    ],
    campaigns: []
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load campaigns
      const campaignsRes = await adsAPI.getCampaigns();
      setStats(prev => ({
        ...prev,
        campaigns: campaignsRes.data || []
      }));
      
      // In production, this would fetch real analytics from Meta API
      // For now, we show demo analytics
      
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, change, changeLabel, color = "indigo" }) => {
    const isPositive = change > 0;
    const colorClasses = {
      indigo: "bg-indigo-100 text-indigo-600",
      purple: "bg-purple-100 text-purple-600",
      pink: "bg-pink-100 text-pink-600",
      green: "bg-green-100 text-green-600",
      amber: "bg-amber-100 text-amber-600",
      blue: "bg-blue-100 text-blue-600"
    };
    
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="text-3xl font-bold font-outfit text-slate-900 mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="text-sm text-slate-600">{label}</div>
        {changeLabel && (
          <div className="text-xs text-slate-400 mt-1">{changeLabel}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading analytics..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load</h2>
          <Button onClick={loadAnalytics} className="rounded-full px-6">Try Again</Button>
        </div>
      </Layout>
    );
  }

  const maxReach = Math.max(...stats.weeklyData.map(d => d.reach));

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Analytics</h1>
            <p className="text-lg text-slate-600">Track your café's social media performance</p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
            {[
              { value: "7d", label: "7 Days" },
              { value: "30d", label: "30 Days" },
              { value: "90d", label: "90 Days" }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range.value
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={Eye} 
            label="Total Reach" 
            value={stats.overview.totalReach}
            change={8.2}
            changeLabel="vs last period"
            color="indigo"
          />
          <StatCard 
            icon={Heart} 
            label="Engagement" 
            value={stats.overview.totalEngagement}
            change={12.5}
            changeLabel="vs last period"
            color="pink"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Engagement Rate" 
            value={`${stats.overview.engagementRate}%`}
            change={2.1}
            color="green"
          />
          <StatCard 
            icon={Users} 
            label="Followers" 
            value={stats.overview.followers}
            change={stats.overview.followerGrowth}
            changeLabel="growth this month"
            color="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Reach Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold font-outfit text-slate-900 mb-6">Weekly Performance</h3>
            <div className="h-64 flex items-end justify-between gap-4">
              {stats.weeklyData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '200px' }}>
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(day.reach / maxReach) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs font-medium text-slate-500">{day.day}</div>
                  <div className="text-xs text-slate-400">{day.reach}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold font-outfit text-slate-900 mb-6">Content Breakdown</h3>
            <div className="space-y-4">
              {[
                { label: "Images", value: stats.posts.images, total: stats.posts.total, color: "bg-blue-500" },
                { label: "Videos", value: stats.posts.videos, total: stats.posts.total, color: "bg-purple-500" },
                { label: "Reels", value: stats.posts.reels, total: stats.posts.total, color: "bg-pink-500" }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-sm text-slate-500">{item.value} posts</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${(item.value / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="text-center">
                <div className="text-3xl font-bold font-outfit text-slate-900">{stats.posts.total}</div>
                <div className="text-sm text-slate-500">Total Posts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold font-outfit text-slate-900 mb-6">Top Performing Posts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.topPosts.map((post, i) => (
              <div key={post.id} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    post.type === "image" ? "bg-blue-100 text-blue-700" :
                    post.type === "reel" ? "bg-pink-100 text-pink-700" :
                    "bg-purple-100 text-purple-700"
                  }`}>
                    {post.type}
                  </div>
                  <span className="text-xs text-slate-500">#{i + 1} Best</span>
                </div>
                <p className="text-sm text-slate-700 mb-4 line-clamp-2">{post.caption}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Eye className="w-4 h-4" />
                    {post.reach.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Heart className="w-4 h-4" />
                    {post.likes}
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold font-outfit text-slate-900">Campaign Performance</h3>
            <Button variant="outline" size="sm" className="rounded-lg">
              View All Campaigns
            </Button>
          </div>
          
          {stats.campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Campaign</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Budget</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Reach</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{campaign.promotion_type}</div>
                        <div className="text-xs text-slate-500">{campaign.target_audience}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          campaign.status === "active" ? "bg-green-100 text-green-700" :
                          campaign.status === "paused" ? "bg-yellow-100 text-yellow-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">${campaign.daily_budget}/day</td>
                      <td className="py-3 px-4 text-slate-600">{(campaign.daily_budget * 100).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600">{Math.round(campaign.daily_budget * 8)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No campaigns yet</p>
              <Button className="rounded-full px-6 bg-indigo-600">Create Campaign</Button>
            </div>
          )}
        </div>

        {/* Instagram Account Note */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Connect Your Instagram Account</h4>
              <p className="text-sm text-slate-600 mb-3">
                Connect your Instagram business account to see real-time analytics, post directly, and manage your campaigns.
              </p>
              <Button className="rounded-full px-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                Connect Instagram
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
