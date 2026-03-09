import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Plus, Image, Video, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { brandAPI, projectAPI, statsAPI, contentAPI } from "@/services/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [projects, setProjects] = useState([]);
  const [recentContent, setRecentContent] = useState([]);
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
      
      const [brandsRes, projectsRes, statsRes] = await Promise.all([
        brandAPI.getAll(),
        projectAPI.getAll(),
        statsAPI.get()
      ]);

      setBrands(brandsRes.data);
      setProjects(projectsRes.data);
      setStats(statsRes.data);

      // Load recent content from first project
      if (projectsRes.data.length > 0) {
        try {
          const recentProject = projectsRes.data[0];
          const contentsRes = await contentAPI.getByProject(recentProject.id);
          setRecentContent(contentsRes.data.slice(0, 3));
        } catch {
          // Silently handle - recent content is not critical
          setRecentContent([]);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-outfit text-slate-900 mb-2">
            Welcome back, {user?.full_name || "Café Owner"}!
          </h1>
          <p className="text-lg text-slate-600">Let's create amazing content for your café today</p>
        </div>

        <div data-testid="dashboard-bento-grid" className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
          <div className="col-span-full md:col-span-4 lg:col-span-4 row-span-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center mb-6">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold font-outfit text-white mb-2">Ready to Create?</h2>
              <p className="text-white/90 mb-8 text-lg">Start a new marketing campaign and bring your café ideas to life with AI</p>
              <Button
                data-testid="dashboard-create-btn"
                onClick={() => navigate("/create")}
                className="rounded-full px-8 py-6 bg-white text-indigo-600 font-semibold shadow-lg hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Content
              </Button>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Cafés</div>
            <div className="text-4xl font-bold font-outfit text-slate-900 mb-1">{stats.brands}</div>
            <div className="text-sm text-slate-600">Active café profiles</div>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Campaigns</div>
            <div className="text-4xl font-bold font-outfit text-slate-900 mb-1">{stats.projects}</div>
            <div className="text-sm text-slate-600">Total campaigns</div>
          </div>

          <div className="col-span-full md:col-span-3 lg:col-span-3 row-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-4">Recent Campaigns</h3>
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  data-testid={`project-item-${project.id}`}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    {project.type === "image" && <Image className="w-5 h-5 text-indigo-600" />}
                    {project.type === "video" && <Video className="w-5 h-5 text-indigo-600" />}
                    {project.type === "caption" && <FileText className="w-5 h-5 text-indigo-600" />}
                    {!["image", "video", "caption"].includes(project.type) && <FileText className="w-5 h-5 text-indigo-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {project.name}
                    </div>
                    <div className="text-sm text-slate-500 capitalize">{project.type}</div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p>No campaigns yet. Create your first one!</p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-full md:col-span-3 lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-4">Content Generated</h3>
            <div className="text-5xl font-bold font-outfit text-indigo-600 mb-2">{stats.contents_generated}</div>
            <p className="text-slate-600">Total pieces of content created</p>
          </div>
        </div>

        {brands.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-4">Your Café</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {brands[0].name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg text-slate-900">{brands[0].name}</h4>
                <p className="text-sm text-slate-600 capitalize">
                  {brands[0].tone || "Professional"} • {brands[0].industry || "Café"}
                </p>
              </div>
              <Button
                data-testid="edit-brand-btn"
                onClick={() => navigate("/brand")}
                variant="outline"
                className="rounded-lg"
              >
                Edit Café
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
