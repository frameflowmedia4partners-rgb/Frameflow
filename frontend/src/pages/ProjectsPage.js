import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FolderKanban, Image, Video, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { projectAPI, brandAPI } from "@/services/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", type: "image", brand_id: "" });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projectsRes, brandsRes] = await Promise.all([
        projectAPI.getAll(),
        brandAPI.getAll()
      ]);
      
      setProjects(projectsRes.data);
      setBrands(brandsRes.data);
      
      if (brandsRes.data.length > 0) {
        setNewProject(prev => ({ ...prev, brand_id: brandsRes.data[0].id }));
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      setError("Failed to load projects");
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    if (!newProject.brand_id) {
      toast.error("Please select a brand");
      return;
    }

    setCreating(true);
    try {
      await projectAPI.create(newProject);
      toast.success("Campaign created!");
      setShowCreateDialog(false);
      setNewProject({ name: "", type: "image", brand_id: brands[0]?.id || "" });
      loadData();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create campaign");
    } finally {
      setCreating(false);
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
        <LoadingSpinner message="Loading campaigns..." />
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
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={loadData} className="rounded-full px-6">
            Try Again
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Campaigns</h1>
            <p className="text-lg text-slate-600">Manage your café marketing campaigns</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                data-testid="create-project-btn"
                className="rounded-full px-6 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-outfit text-2xl">Create New Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Campaign Name</Label>
                  <Input
                    data-testid="project-name-input"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Summer Campaign 2026"
                    className="mt-2"
                    disabled={creating}
                  />
                </div>
                <div>
                  <Label>Content Type</Label>
                  <select
                    data-testid="project-type-select"
                    value={newProject.type}
                    onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                    className="w-full mt-2 rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3"
                    disabled={creating}
                  >
                    <option value="image">Image Post</option>
                    <option value="video">Video/Reel</option>
                    <option value="caption">Caption</option>
                  </select>
                </div>
                {brands.length > 0 && (
                  <div>
                    <Label>Café</Label>
                    <select
                      value={newProject.brand_id}
                      onChange={(e) => setNewProject({ ...newProject, brand_id: e.target.value })}
                      className="w-full mt-2 rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3"
                      disabled={creating}
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
                  disabled={creating}
                  className="w-full rounded-full py-6 bg-indigo-600"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Campaign"
                  )}
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
            <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">No campaigns yet</h2>
            <p className="text-slate-600 mb-6">Create your first campaign to organize your café content</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="rounded-full px-8 py-3 bg-indigo-600 text-white font-semibold"
            >
              Create Your First Campaign
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
