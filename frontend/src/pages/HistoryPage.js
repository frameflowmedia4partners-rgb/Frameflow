import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Video, FileText, Copy, Download, History as HistoryIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { projectAPI, contentAPI } from "@/services/api";

export default function HistoryPage() {
  const [allContents, setAllContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const projectsRes = await projectAPI.getAll();

      const contentPromises = projectsRes.data.map(project =>
        contentAPI.getByProject(project.id).catch(() => ({ data: [] }))
      );

      const contentsResponses = await Promise.all(contentPromises);
      const allContent = contentsResponses.flatMap(res => res.data);
      setAllContents(allContent);
    } catch (error) {
      console.error("Failed to load history:", error);
      setError("Failed to load content history");
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleDownload = (url, type) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `frameflow-${type}-${Date.now()}.${type === 'video' ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded!");
  };

  const filterContents = (type) => {
    if (type === "all") return allContents;
    return allContents.filter(c => c.type === type);
  };

  const renderContent = (content) => {
    return (
      <div
        key={content.id}
        data-testid={`history-item-${content.id}`}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              {content.type === "image" && <Image className="w-5 h-5 text-indigo-600" />}
              {content.type === "video" && <Video className="w-5 h-5 text-indigo-600" />}
              {content.type === "caption" && <FileText className="w-5 h-5 text-indigo-600" />}
              {!["image", "video", "caption"].includes(content.type) && <FileText className="w-5 h-5 text-indigo-600" />}
            </div>
            <div>
              <span className="font-semibold text-slate-900 capitalize">{content.type}</span>
              <p className="text-xs text-slate-400">
                {new Date(content.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {content.type === "caption" && (
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="text-slate-700 text-sm whitespace-pre-wrap line-clamp-4">
              {content.content_text}
            </p>
          </div>
        )}

        {content.type === "image" && content.content_url && (
          <img
            src={content.content_url}
            alt="Generated content"
            className="w-full rounded-lg mb-4 max-h-64 object-cover"
          />
        )}

        {content.type === "video" && content.content_url && (
          <video
            src={content.content_url}
            controls
            className="w-full rounded-lg mb-4 max-h-64"
          />
        )}

        {content.prompt && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Prompt</p>
            <p className="text-sm text-slate-600 line-clamp-2">{content.prompt}</p>
          </div>
        )}

        <div className="flex gap-2">
          {content.type === "caption" && (
            <Button
              data-testid={`copy-btn-${content.id}`}
              onClick={() => handleCopyText(content.content_text)}
              variant="outline"
              size="sm"
              className="flex-1 rounded-lg"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          )}
          {(content.type === "image" || content.type === "video") && content.content_url && (
            <Button
              data-testid={`download-btn-${content.id}`}
              onClick={() => handleDownload(content.content_url, content.type)}
              variant="outline"
              size="sm"
              className="flex-1 rounded-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading content history..." />
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
          <Button onClick={loadHistory} className="rounded-full px-6">
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
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Content History</h1>
          <p className="text-lg text-slate-600">View and manage all your generated café content</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all" data-testid="tab-all">All Content</TabsTrigger>
            <TabsTrigger value="caption" data-testid="tab-captions">Captions</TabsTrigger>
            <TabsTrigger value="image" data-testid="tab-images">Images</TabsTrigger>
            <TabsTrigger value="video" data-testid="tab-videos">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filterContents(activeTab).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterContents(activeTab).map(renderContent)}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <HistoryIcon className="w-12 h-12 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">No content yet</h2>
                <p className="text-slate-600">Start creating content to see it here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
