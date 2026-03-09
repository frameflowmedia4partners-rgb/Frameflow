import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, ArrowLeft, Upload, Image, Video } from "lucide-react";
import { toast } from "sonner";

export default function MediaLibraryPage() {
  const navigate = useNavigate();

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
            <span className="font-outfit text-xl font-bold text-slate-900">Media Library</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Media Library</h1>
            <p className="text-lg text-slate-600">Upload and manage your brand assets</p>
          </div>
          <Button
            data-testid="upload-media-btn"
            onClick={() => toast.info("Media upload coming soon!")}
            className="rounded-full px-8 py-3 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Media
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <Image className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">No media yet</h2>
          <p className="text-slate-600 mb-6">Upload logos, images, and videos to use in your content</p>
          <Button
            onClick={() => toast.info("Media upload coming soon!")}
            variant="outline"
            className="rounded-full px-8 py-3"
          >
            Upload Your First Asset
          </Button>
        </div>
      </main>
    </div>
  );
}