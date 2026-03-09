import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { 
  Plus, Image, Video, FileText, AlertCircle, Sparkles, Calendar, 
  TrendingUp, Target, Upload, Play, Clock, BarChart3, Instagram,
  ArrowRight, Zap
} from "lucide-react";
import { toast } from "sonner";
import { brandAPI, projectAPI, statsAPI } from "@/services/api";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function DashboardPage() {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [projects, setProjects] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [stats, setStats] = useState({ brands: 0, projects: 0, contents_generated: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      const [brandsRes, projectsRes, statsRes, postsRes] = await Promise.all([
        brandAPI.getAll(),
        projectAPI.getAll(),
        statsAPI.get(),
        fetch(`${API_URL}/api/scheduled-posts`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : [])
      ]);

      setBrands(brandsRes.data);
      setProjects(projectsRes.data);
      setStats(statsRes.data);
      setScheduledPosts(Array.isArray(postsRes) ? postsRes.slice(0, 5) : []);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: Plus, label: "Create Post", desc: "Generate content", path: "/create", color: "bg-indigo-600" },
    { icon: Calendar, label: "Schedule", desc: "Plan content", path: "/calendar", color: "bg-purple-600" },
    { icon: Target, label: "Run Ads", desc: "Launch campaign", path: "/ads/create", color: "bg-pink-600" },
    { icon: Upload, label: "Upload", desc: "Add media", path: "/media", color: "bg-amber-500" }
  ];

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading your café dashboard..." />
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
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData} className="rounded-full px-6">
            Try Again
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-outfit text-slate-900 mb-2">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! ☕
          </h1>
          <p className="text-lg text-slate-600">Here's your café marketing command center</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="group p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900">{action.label}</div>
                <div className="text-sm text-slate-500">{action.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main CTA Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                AI-Powered
              </div>
              <h2 className="text-3xl font-bold font-outfit text-white mb-2">Ready to Create?</h2>
              <p className="text-white/80 mb-6 text-lg max-w-md">
                Generate stunning Instagram content, captions, and ads tailored for your café in seconds.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  data-testid="dashboard-create-btn"
                  onClick={() => navigate("/create")}
                  className="rounded-full px-6 py-6 bg-white text-indigo-600 font-semibold shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Content
                </Button>
                <Button
                  onClick={() => navigate("/ideas")}
                  variant="outline"
                  className="rounded-full px-6 py-6 bg-transparent border-2 border-white/30 text-white font-semibold hover:bg-white/10"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Get Ideas
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Column */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Campaigns</div>
                <FolderKanban className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-4xl font-bold font-outfit text-slate-900">{stats.projects}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Content Created</div>
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-4xl font-bold font-outfit text-slate-900">{stats.contents_generated}</div>
            </div>
            <Button
              onClick={() => navigate("/analytics")}
              variant="outline"
              className="w-full rounded-xl py-4 justify-between"
            >
              <span>View Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Scheduled Posts */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold font-outfit text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Upcoming Posts
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/calendar")}>
                View All
              </Button>
            </div>
            {scheduledPosts.length > 0 ? (
              <div className="space-y-3">
                {scheduledPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      post.content_type === "image" ? "bg-blue-100" :
                      post.content_type === "video" ? "bg-purple-100" : "bg-pink-100"
                    }`}>
                      {post.content_type === "image" && <Image className="w-5 h-5 text-blue-600" />}
                      {post.content_type === "video" && <Video className="w-5 h-5 text-purple-600" />}
                      {post.content_type === "reel" && <Play className="w-5 h-5 text-pink-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {post.caption?.slice(0, 40)}...
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(post.scheduled_at).toLocaleDateString()} at {new Date(post.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <Instagram className="w-5 h-5 text-pink-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No scheduled posts yet</p>
                <Button onClick={() => navigate("/calendar")} variant="outline" className="rounded-full">
                  Schedule Your First Post
                </Button>
              </div>
            )}
          </div>

          {/* Recent Campaigns */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold font-outfit text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Recent Campaigns
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
                View All
              </Button>
            </div>
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    data-testid={`project-item-${project.id}`}
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                      {project.type === "image" && <Image className="w-5 h-5 text-indigo-600 group-hover:text-white" />}
                      {project.type === "video" && <Video className="w-5 h-5 text-indigo-600 group-hover:text-white" />}
                      {project.type === "caption" && <FileText className="w-5 h-5 text-indigo-600 group-hover:text-white" />}
                      {!["image", "video", "caption"].includes(project.type) && <FileText className="w-5 h-5 text-indigo-600 group-hover:text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {project.name}
                      </div>
                      <div className="text-sm text-slate-500 capitalize">{project.type}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === "active" ? "bg-green-100 text-green-700" :
                      project.status === "draft" ? "bg-slate-100 text-slate-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No campaigns yet</p>
                <Button onClick={() => navigate("/projects")} variant="outline" className="rounded-full">
                  Create First Campaign
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Brand Card */}
        {brands.length > 0 && (
          <div className="mt-6 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {brands[0].name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900">{brands[0].name}</h4>
                  <p className="text-sm text-slate-600 capitalize">
                    {brands[0].tone || "Professional"} • {brands[0].industry || "Café"}
                  </p>
                </div>
              </div>
              <Button
                data-testid="edit-brand-btn"
                onClick={() => navigate("/brand")}
                variant="outline"
                className="rounded-lg"
              >
                Manage Brand
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Import icon that was referenced but not imported
function FolderKanban(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
      <path d="M8 10v4"/>
      <path d="M12 10v2"/>
      <path d="M16 10v6"/>
    </svg>
  );
}
