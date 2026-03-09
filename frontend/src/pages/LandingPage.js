import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Bot, Sparkles, Video, ImageIcon, Wand2, Play, Loader2, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const API = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API}/api/demo/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) {
        throw new Error("Failed to start demo");
      }
      
      const data = await response.json();
      login(data.token, data.user);
      toast.success("Welcome to the demo! Explore Urban Brew Café's marketing dashboard.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Demo login failed:", error);
      toast.error("Failed to start demo. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <nav className="relative z-10 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="font-outfit text-2xl font-bold text-slate-900">FrameFlow</span>
        </div>
        <Button
          data-testid="nav-login-btn"
          onClick={() => navigate("/auth")}
          className="rounded-full px-6 py-2 bg-white text-slate-900 border border-slate-200 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          variant="ghost"
        >
          Sign In
        </Button>
      </nav>

      <main className="relative z-10">
        <section className="min-h-[90vh] flex items-center justify-center px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-slate-200">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Your AI Creative Sidekick</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold font-outfit tracking-tight text-slate-900 mb-6 animate-fade-in">
              Create Stunning
              <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Marketing Content
              </span>
              with AI
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Generate images, videos, and captions for your social media in seconds. 
              FrameFlow Studio brings your marketing ideas to life with AI.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                data-testid="hero-get-started-btn"
                onClick={() => navigate("/auth")}
                className="rounded-full px-8 py-6 text-base bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200 hover:shadow-indigo-500/40"
              >
                Get Started Free
              </Button>
              <Button
                data-testid="hero-try-demo-btn"
                onClick={handleTryDemo}
                disabled={demoLoading}
                className="rounded-full px-8 py-6 text-base bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-orange-500/25 hover:scale-105 transition-all duration-200 hover:shadow-orange-500/40"
              >
                {demoLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading Demo...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Try Demo
                  </>
                )}
              </Button>
              <Button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="rounded-full px-8 py-6 text-base bg-white text-slate-900 border border-slate-200 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                variant="outline"
              >
                See How It Works
              </Button>
            </div>

            {/* Demo Badge */}
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200">
              <Coffee className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                Try our demo with Urban Brew Café - no signup required!
              </span>
            </div>

            <div className="mt-16 inline-block animate-bounce-slow">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                <Bot className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold font-outfit tracking-tight text-slate-900 mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Powerful AI tools designed for modern marketing teams
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 p-8 group hover:border-indigo-200">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-semibold font-outfit mb-3 text-slate-900">AI Image Generation</h3>
                <p className="text-slate-600 leading-relaxed">
                  Create stunning marketing visuals with simple prompts. Regenerate, upscale, and edit until perfect.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 p-8 group hover:border-purple-200">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Video className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold font-outfit mb-3 text-slate-900">Video Creation</h3>
                <p className="text-slate-600 leading-relaxed">
                  Generate short-form videos for social media. Add scenes, captions, and effects with AI assistance.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 p-8 group hover:border-pink-200">
                <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Wand2 className="w-7 h-7 text-pink-600" />
                </div>
                <h3 className="text-2xl font-semibold font-outfit mb-3 text-slate-900">Smart Editing</h3>
                <p className="text-slate-600 leading-relaxed">
                  Edit content with simple prompts. Make it cinematic, change backgrounds, or adjust tone instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-block w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-bounce-slow">
                <Bot className="w-16 h-16 text-white" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold font-outfit tracking-tight text-slate-900 mb-6">
              Meet Framey, Your AI Assistant
            </h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Framey guides you through content creation, suggests improvements, 
              and helps bring your marketing vision to life.
            </p>
            <Button
              data-testid="cta-get-started-btn"
              onClick={() => navigate("/auth")}
              className="rounded-full px-10 py-6 text-lg bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200 hover:shadow-indigo-500/40"
            >
              Start Creating Now
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-12 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold text-slate-900">FrameFlow Studio</span>
          </div>
          <p className="text-slate-600 text-sm">
            © 2026 FrameFlow Studio. Your AI Creative Sidekick.
          </p>
        </div>
      </footer>
    </div>
  );
}