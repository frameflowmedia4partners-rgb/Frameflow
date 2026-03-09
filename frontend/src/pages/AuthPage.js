import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      
      if (isLogin) {
        response = await authAPI.login(email, password);
      } else {
        response = await authAPI.signup(email, password, fullName);
      }
      
      // Use AuthContext to store authentication data
      login(response.data.token, response.data.user);

      toast.success(isLogin ? "Welcome back!" : "Account created!");
      
      // Navigate based on onboarding status
      if (isLogin) {
        // Check if user has completed onboarding
        try {
          const userRes = await authAPI.me();
          if (userRes.data.onboarding_completed) {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/onboarding", { replace: true });
          }
        } catch {
          // If we can't check onboarding status, go to dashboard
          navigate("/dashboard", { replace: true });
        }
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Authentication failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 items-center justify-center mb-4 shadow-xl shadow-indigo-500/20 animate-bounce-slow">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-2">
            {isLogin ? "Welcome Back" : "Get Started"}
          </h1>
          <p className="text-slate-600">
            {isLogin ? "Sign in to your café marketing studio" : "Create your café account"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form data-testid="auth-form" onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Café Name / Your Name
                </Label>
                <Input
                  data-testid="auth-fullname-input"
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                  placeholder="Urban Brew Café"
                  disabled={loading}
                />
              </div>
            )}

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
                placeholder="••••••••"
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
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Café Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="auth-toggle-btn"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="text-sm text-slate-600 hover:text-indigo-600 transition-colors disabled:opacity-50"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
