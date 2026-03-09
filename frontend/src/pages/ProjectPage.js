import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Bot, Image, Video, FileText, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { projectAPI, contentAPI } from "@/services/api";

export default function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projectRes, contentsRes] = await Promise.all([
        projectAPI.get(id),
        contentAPI.getByProject(id).catch(() => ({ data: [] }))
      ]);
      
      setProject(projectRes.data);
      setContents(contentsRes.data);
    } catch (error) {
      console.error("Failed to load project:", error);
      setError("Failed to load campaign");
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading campaign..." />
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
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Campaign</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/projects")} variant="outline" className="rounded-full px-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
            <Button onClick={loadProject} className="rounded-full px-6">
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <Button
            onClick={() => navigate("/projects")}
            variant="ghost"
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">{project?.name}</h1>
          <p className="text-lg text-slate-600 capitalize">{project?.type} Campaign</p>
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
                      {!["image", "video", "caption"].includes(content.type) && <FileText className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <span className="font-semibold text-slate-900 capitalize">{content.type}</span>
                  </div>

                  {content.type === "caption" && (
                    <p className="text-slate-600 text-sm line-clamp-4">{content.content_text}</p>
                  )}
                  {content.type === "image" && content.content_url && (
                    <img src={content.content_url} alt="Generated" className="w-full rounded-lg" />
                  )}
                  {content.type === "video" && content.content_url && (
                    <video src={content.content_url} controls className="w-full rounded-lg" />
                  )}

                  {content.prompt && (
                    <p className="text-xs text-slate-400 mt-4 line-clamp-2">{content.prompt}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <Bot className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">No content yet</h2>
              <p className="text-slate-600 mb-6">Generate content for this campaign to see it here</p>
              <Button
                onClick={() => navigate("/create")}
                className="rounded-full px-8 py-3 bg-indigo-600 text-white font-semibold"
              >
                Create Content
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
