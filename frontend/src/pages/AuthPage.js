import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

// Frameflow Logo Component
function FrameflowLogo({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#logo-gradient)" />
      <path d="M20 24h24M20 32h18M20 40h22" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="40" r="6" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      
      // Use AuthContext to store authentication data
      login(response.data.token, response.data.user);

      toast.success("Welcome back!");
      
      // Check user role and redirect appropriately
      try {
        const userRes = await authAPI.me();
        
        // Super admins go to admin panel
        if (userRes.data.role === "super_admin") {
          navigate("/admin", { replace: true });
        } else if (userRes.data.onboarding_complete === false) {
          // Clients without completed onboarding go to wizard
          navigate("/onboarding", { replace: true });
        } else {
          // Regular clients go to dashboard
          navigate("/dashboard", { replace: true });
        }
      } catch {
        // If we can't check user data, go to dashboard
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      // Show specific error message for login failures
      toast.error("Account not found. Please contact your administrator.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappLink = "https://wa.me/919330408074?text=" + encodeURIComponent("Hi, I'd like to request a demo of Frameflow");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Centered Frameflow Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FrameflowLogo className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-2">
            Welcome to Frameflow
          </h1>
          <p className="text-slate-600">
            Sign in to your marketing dashboard
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form data-testid="auth-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 mb-2 block">
                Email
              </Label>
              <Input
                data-testid="auth-email-input"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700 mb-2 block">
                Password
              </Label>
              <Input
                data-testid="auth-password-input"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <Button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-8 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* WhatsApp Demo Request */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 mb-4">
              Don't have an account?
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-all duration-200 shadow-lg shadow-green-500/25 hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              Request a Demo on WhatsApp
            </a>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <a href="/privacy-policy" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
          <span className="mx-2">|</span>
          <a href="/data-deletion" className="hover:text-indigo-600 transition-colors">Data Deletion</a>
        </div>
      </div>
    </div>
  );
}
