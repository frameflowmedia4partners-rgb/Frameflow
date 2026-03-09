import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Bot, ArrowLeft, Image, Video, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const [projectRes, contentsRes] = await Promise.all([
        axios.get(`${API}/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/contents/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setProject(projectRes.data);
      setContents(contentsRes.data);
    } catch (error) {
      toast.error("Failed to load project");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
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
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            data-testid="back-btn"
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold text-slate-900">{project?.name}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">{project?.name}</h1>
          <p className="text-lg text-slate-600 capitalize">{project?.type} Project</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-6">Generated Content</h2>
          {contents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((content) => (
                <div
                  key={content.id}
                  data-testid={`content-item-${content.id}`}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      {content.type === "image" && <Image className="w-5 h-5 text-indigo-600" />}
                      {content.type === "video" && <Video className="w-5 h-5 text-indigo-600" />}
                      {content.type === "caption" && <FileText className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <span className="font-semibold text-slate-900 capitalize">{content.type}</span>
                  </div>

                  {content.type === "caption" && (
                    <p className="text-slate-600 text-sm line-clamp-4">{content.content_text}</p>
                  )}
                  {content.type === "image" && (
                    <img src={content.content_url} alt="Generated" className="w-full rounded-lg" />
                  )}
                  {content.type === "video" && (
                    <video src={content.content_url} controls className="w-full rounded-lg" />
                  )}

                  <p className="text-xs text-slate-400 mt-4">{content.prompt}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <Bot className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">No content yet</h2>
              <p className="text-slate-600">Generate content for this project to see it here</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}