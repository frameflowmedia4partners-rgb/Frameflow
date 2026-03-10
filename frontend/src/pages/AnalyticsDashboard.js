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
  Calendar,
  ArrowUp,
  ArrowDown,
  Instagram,
  Target,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [analytics, setAnalytics] = useState(null);
  const [bestTimes, setBestTimes] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
      
      // Try to load data, fallback to demo data if APIs fail
      let analyticsData = null;
      let timesData = null;
      let campaignsData = [];
      
      try {
        const analyticsRes = await api.get("/analytics", { params: { days: daysMap[timeRange] } });
        analyticsData = analyticsRes.data;
      } catch (e) {
        console.log("Analytics API unavailable, using demo data");
      }
      
      try {
        const timesRes = await api.get("/analytics/best-times");
        timesData = timesRes.data;
      } catch (e) {
        console.log("Best times API unavailable");
      }
      
      try {
        const campaignsRes = await api.get("/campaigns");
        campaignsData = campaignsRes.data || [];
      } catch (e) {
        console.log("Campaigns API unavailable");
      }
      
      // Use demo data if no real data available
      if (!analyticsData) {
        analyticsData = {
          followers: 2450,
          follower_change: 5.2,
          reach: 15800,
          reach_change: 12.4,
          impressions: 42300,
          impressions_change: 8.7,
          engagement_rate: 4.2,
          engagement_change: 0.3,
          likes: 1240,
          comments: 89,
          saves: 156,
          shares: 45,
          posts_count: 12,
          stories_count: 28,
          reels_count: 4,
          is_demo: true
        };
      }
      
      if (!timesData) {
        timesData = {
          best_days: ["Tuesday", "Thursday", "Saturday"],
          best_hours: ["9:00 AM", "12:00 PM", "6:00 PM"],
          is_demo: true
        };
      }
      
      setAnalytics(analyticsData);
      setBestTimes(timesData);
      setCampaigns(campaignsData);
      
    } catch (error) {
      console.error("Failed to load analytics:", error);
      // Show demo data instead of error
      setAnalytics({
        followers: 2450,
        follower_change: 5.2,
        reach: 15800,
        reach_change: 12.4,
        impressions: 42300,
        impressions_change: 8.7,
        engagement_rate: 4.2,
        engagement_change: 0.3,
        likes: 1240,
        comments: 89,
        saves: 156,
        shares: 45,
        posts_count: 12,
        stories_count: 28,
        reels_count: 4,
        is_demo: true
      });
      setBestTimes({
        best_days: ["Tuesday", "Thursday", "Saturday"],
        best_hours: ["9:00 AM", "12:00 PM", "6:00 PM"],
        is_demo: true
      });
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success("Analytics refreshed");
  };

  const StatCard = ({ icon: Icon, label, value, change, changeLabel, color = "indigo", trend }) => {
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
              isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
            }`}>
              {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
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

  const overview = analytics?.overview || analytics || {};
  const weeklyData = analytics?.weekly_data || [];
  const topPosts = analytics?.top_posts || [];
  const contentBreakdown = analytics?.content_breakdown || { images: 0, videos: 0, reels: 0 };
  const maxReach = Math.max(...weeklyData.map(d => d.reach || 0), 1);
  const isLiveData = analytics?.is_live_data || false;
  const isDemo = analytics?.is_demo || false;

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Analytics</h1>
            <p className="text-lg text-slate-600">
              {isDemo ? "Demo analytics - connect Instagram for live data" : (isLiveData ? "Live data from your Instagram account" : "Sample analytics")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-lg"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1">
              {[
                { value: "7d", label: "7 Days" },
                { value: "30d", label: "30 Days" },
                { value: "90d", label: "90 Days" }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range.value
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Connect Instagram Banner (if not connected) */}
        {!isLiveData && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <Instagram className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Connect Instagram for Live Data</h3>
                  <p className="text-white/80">See real engagement metrics, follower growth, and post performance</p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/integrations")}
                className="bg-white text-indigo-600 hover:bg-white/90 rounded-full px-6"
              >
                Connect Now
              </Button>
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={Eye} 
            label="Total Reach" 
            value={overview.total_reach || 12450}
            change={8.2}
            changeLabel="vs last period"
            color="indigo"
          />
          <StatCard 
            icon={Heart} 
            label="Engagement" 
            value={overview.total_engagement || 2156}
            change={12.5}
            changeLabel="vs last period"
            color="pink"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Engagement Rate" 
            value={`${overview.engagement_rate || 7.6}%`}
            change={2.1}
            color="green"
          />
          <StatCard 
            icon={Users} 
            label="Followers" 
            value={analytics?.account?.followers_count || overview.followers || 1842}
            change={overview.follower_growth || 12.4}
            changeLabel="growth this period"
            color="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Reach Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-outfit text-slate-900">Weekly Performance</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-slate-600">Reach</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-slate-600">Engagement</span>
                </div>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-3">
              {(weeklyData.length > 0 ? weeklyData : [
                { day: "Mon", reach: 1200, engagement: 89 },
                { day: "Tue", reach: 1450, engagement: 112 },
                { day: "Wed", reach: 980, engagement: 76 },
                { day: "Thu", reach: 1680, engagement: 134 },
                { day: "Fri", reach: 2100, engagement: 178 },
                { day: "Sat", reach: 2450, engagement: 201 },
                { day: "Sun", reach: 1890, engagement: 156 }
              ]).map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '200px' }}>
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-500 hover:from-indigo-700 hover:to-indigo-500"
                      style={{ height: `${(day.reach / maxReach) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs font-medium text-slate-600">{day.day}</div>
                  <div className="text-xs text-slate-400">{day.reach?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold font-outfit text-slate-900 mb-6">Content Breakdown</h3>
            <div className="space-y-5">
              {[
                { label: "Images", value: contentBreakdown.images || 18, color: "bg-blue-500" },
                { label: "Videos", value: contentBreakdown.videos || 4, color: "bg-purple-500" },
                { label: "Reels", value: contentBreakdown.reels || 2, color: "bg-pink-500" }
              ].map((item, i) => {
                const total = (contentBreakdown.images || 18) + (contentBreakdown.videos || 4) + (contentBreakdown.reels || 2);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-900">{item.value} posts</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${(item.value / total) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="text-center">
                <div className="text-4xl font-bold font-outfit text-slate-900">
                  {(contentBreakdown.images || 18) + (contentBreakdown.videos || 4) + (contentBreakdown.reels || 2)}
                </div>
                <div className="text-sm text-slate-500">Total Posts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Posting Times */}
        {bestTimes && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-outfit text-slate-900">Best Posting Times</h3>
                  <p className="text-sm text-slate-600">AI-optimized for café audiences</p>
                </div>
              </div>
              {bestTimes.today_recommendation && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-indigo-200">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <div>
                    <div className="text-xs text-slate-500">Post now at</div>
                    <div className="font-bold text-indigo-600">{bestTimes.today_recommendation.time}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(bestTimes.best_times || []).slice(0, 4).map((slot, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 hover:border-indigo-200 transition-colors">
                  <div className="text-2xl font-bold text-indigo-600">{slot.time}</div>
                  <div className="text-sm font-medium text-slate-900 mt-1">{slot.label}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${
                      slot.engagement_score >= 90 ? 'bg-green-500' : 
                      slot.engagement_score >= 75 ? 'bg-blue-500' : 'bg-slate-400'
                    }`} />
                    <span className="text-xs text-slate-500">{slot.engagement_score}% engagement</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Performing Posts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold font-outfit text-slate-900 mb-6">Top Performing Posts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(topPosts.length > 0 ? topPosts : [
              { id: 1, type: "reel", caption: "Behind the scenes at Urban Brew", reach: 3120, likes: 267, comments: 45 },
              { id: 2, type: "image", caption: "New seasonal latte drop!", reach: 2340, likes: 189, comments: 24 },
              { id: 3, type: "image", caption: "Cozy corner vibes", reach: 1890, likes: 156, comments: 18 }
            ]).map((post, i) => (
              <div key={post.id || i} className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    post.type === "image" ? "bg-blue-100 text-blue-700" :
                    post.type === "reel" ? "bg-pink-100 text-pink-700" :
                    "bg-purple-100 text-purple-700"
                  }`}>
                    {post.type}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold">
                    <Zap className="w-3 h-3" />
                    #{i + 1} Best
                  </div>
                </div>
                <p className="text-sm text-slate-700 mb-4 line-clamp-2 font-medium">{post.caption}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium">{post.reach?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className="font-medium">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{post.comments}</span>
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
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-lg"
              onClick={() => navigate("/marketing")}
            >
              View All Campaigns
            </Button>
          </div>
          
          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Campaign</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Budget</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Est. Reach</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 5).map((campaign) => (
                    <tr key={campaign.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-900">{campaign.promotion_type}</div>
                        <div className="text-xs text-slate-500">{campaign.target_audience}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          campaign.status === "active" ? "bg-green-100 text-green-700" :
                          campaign.status === "paused" ? "bg-yellow-100 text-yellow-700" :
                          campaign.status === "pending_connection" ? "bg-orange-100 text-orange-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">${campaign.daily_budget}/day</td>
                      <td className="py-4 px-4 text-slate-600">{(campaign.daily_budget * 100).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No campaigns yet</p>
              <Button 
                className="rounded-full px-6 bg-indigo-600"
                onClick={() => navigate("/ads/create")}
              >
                Create Campaign
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
