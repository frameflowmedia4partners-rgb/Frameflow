import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { Plus, FolderKanban, Image, Video, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", type: "image", brand_id: "" });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, brandsRes] = await Promise.all([
        axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/brands`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setProjects(projectsRes.data);
      setBrands(brandsRes.data);
      if (brandsRes.data.length > 0) {
        setNewProject(prev => ({ ...prev, brand_id: brandsRes.data[0].id }));
      }
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name) {
      toast.error("Please enter a project name");
      return;
    }

    try {
      await axios.post(`${API}/projects`, newProject, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Project created!");
      setShowCreateDialog(false);
      setNewProject({ name: "", type: "image", brand_id: brands[0]?.id || "" });
      loadData();
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "image": return <Image className="w-5 h-5" />;
      case "video": return <Video className="w-5 h-5" />;
      case "caption": return <FileText className="w-5 h-5" />;
      default: return <FolderKanban className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-bounce-slow">
            <FolderKanban className="w-12 h-12 text-indigo-600" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Projects</h1>
            <p className="text-lg text-slate-600">Manage your marketing campaigns</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                data-testid="create-project-btn"
                className="rounded-full px-6 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-outfit text-2xl">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Project Name</Label>
                  <Input
                    data-testid="project-name-input"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Summer Campaign 2026"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Content Type</Label>
                  <select
                    data-testid="project-type-select"
                    value={newProject.type}
                    onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                    className="w-full mt-2 rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3"
                  >
                    <option value="image">Image Post</option>
                    <option value="video">Video/Reel</option>
                    <option value="caption">Caption</option>
                  </select>
                </div>
                {brands.length > 0 && (
                  <div>
                    <Label>Brand</Label>
                    <select
                      value={newProject.brand_id}
                      onChange={(e) => setNewProject({ ...newProject, brand_id: e.target.value })}
                      className="w-full mt-2 rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3"
                    >
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <Button
                  data-testid="create-project-submit-btn"
                  onClick={handleCreateProject}
                  className="w-full rounded-full py-6 bg-indigo-600"
                >
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                data-testid={`project-card-${project.id}`}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 p-6 cursor-pointer group hover:border-indigo-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                      <span className="text-indigo-600 group-hover:text-white transition-colors">
                        {getTypeIcon(project.type)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-slate-500 capitalize">{project.type}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
                    {project.status}
                  </span>
                  <span className="text-slate-400">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <FolderKanban className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">No projects yet</h2>
            <p className="text-slate-600 mb-6">Create your first project to organize your content</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="rounded-full px-8 py-3 bg-indigo-600 text-white font-semibold"
            >
              Create Your First Project
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}