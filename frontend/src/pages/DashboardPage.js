import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Bot, Plus, Image, Video, FileText, LogOut, Settings, Library } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [brands, setBrands] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ brands: 0, projects: 0, contents_generated: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [userRes, brandsRes, projectsRes, statsRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/brands`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setUser(userRes.data);
      setBrands(brandsRes.data);
      setProjects(projectsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-bounce-slow">
          <Bot className="w-12 h-12 text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold text-slate-900">FrameFlow</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              data-testid="nav-media-btn"
              onClick={() => navigate("/media")}
              variant="ghost"
              className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors"
            >
              <Library className="w-4 h-4 mr-2" />
              Media
            </Button>
            <Button
              data-testid="nav-brand-btn"
              onClick={() => navigate("/brand")}
              variant="ghost"
              className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Brand
            </Button>
            <Button
              data-testid="nav-logout-btn"
              onClick={handleLogout}
              variant="ghost"
              className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-outfit text-slate-900 mb-2">
            Welcome back, {user?.full_name || "Creator"}!
          </h1>
          <p className="text-lg text-slate-600">Let's create something amazing today</p>
        </div>

        <div data-testid="dashboard-bento-grid" className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
          <div className="col-span-full md:col-span-4 lg:col-span-4 row-span-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="inline-block w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold font-outfit text-white mb-2">Ready to Create?</h2>
              <p className="text-white/90 mb-8 text-lg">Start a new project and bring your ideas to life with AI</p>
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
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Brands</div>
            <div className="text-4xl font-bold font-outfit text-slate-900 mb-1">{stats.brands}</div>
            <div className="text-sm text-slate-600">Active brands</div>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Projects</div>
            <div className="text-4xl font-bold font-outfit text-slate-900 mb-1">{stats.projects}</div>
            <div className="text-sm text-slate-600">Total projects</div>
          </div>

          <div className="col-span-full md:col-span-3 lg:col-span-3 row-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-4">Recent Projects</h3>
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
                  <Bot className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No projects yet. Create your first one!</p>
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
      </main>
    </div>
  );
}
