import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import {
  Star,
  Lightbulb,
  Copy,
  Layers,
  Camera,
  Film,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const creationModes = [
  {
    id: "content-swipe",
    name: "Content Swipe",
    description: "AI generates multiple posts. Swipe to save or discard.",
    icon: Star,
    badge: "Best",
    gradient: "from-amber-400 to-orange-500",
    path: "/content-swipe",
  },
  {
    id: "concept",
    name: "Concept",
    description: "Pick a product, format, and angle. AI creates the post.",
    icon: Lightbulb,
    gradient: "from-purple-400 to-pink-500",
    path: "/concept",
  },
  {
    id: "clone-template",
    name: "Clone Template",
    description: "Browse 50+ templates. AI rebrands with your DNA.",
    icon: Copy,
    gradient: "from-cyan-400 to-blue-500",
    path: "/templates",
  },
  {
    id: "variations",
    name: "Variations",
    description: "Pick a saved post. AI generates fresh variations.",
    icon: Layers,
    gradient: "from-green-400 to-emerald-500",
    path: "/variations",
  },
  {
    id: "photoshoot",
    name: "Photoshoot",
    description: "AI-powered product photography for your menu.",
    icon: Camera,
    gradient: "from-rose-400 to-red-500",
    path: "/concept",
  },
  {
    id: "reel",
    name: "Reel",
    description: "Create engaging video reels with AI.",
    icon: Film,
    gradient: "from-indigo-400 to-violet-500",
    path: "/create-reel",
  },
];

export default function HomeDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [brandDna, setBrandDna] = useState(null);
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    loadData();
    setGreetingByTime();
  }, []);

  const setGreetingByTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/brand-dna");
      setBrandDna(response.data);
    } catch (error) {
      console.error("Failed to load brand DNA:", error);
      setBrandDna(null);
    } finally {
      setLoading(false);
    }
  };

  const handleModeClick = (mode) => {
    if (!brandDna?.name) {
      toast.error("Please complete your Brand DNA setup first");
      navigate("/dna");
      return;
    }

    if (brandDna?.credits_remaining <= 0) {
      toast.error("Monthly credit limit reached. Contact your account manager.");
      return;
    }

    navigate(mode.path);
  };

  const creditsUsed = brandDna?.credits_used || 0;
  const monthlyCredits = brandDna?.monthly_credits || 250;
  const creditsRemaining = monthlyCredits - creditsUsed;
  const creditsPercent = (creditsUsed / monthlyCredits) * 100;

  const getProgressColor = () => {
    if (creditsPercent < 50) return "bg-green-500";
    if (creditsPercent < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">
            {greeting}, {brandDna?.name || "there"} <span className="text-3xl">☀️</span>
          </h1>
          <p className="text-lg text-slate-600">What would you like to create today?</p>
        </div>

        {/* Credit Meter */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-slate-900">
                {creditsUsed}/{monthlyCredits} creatives used this month
              </span>
            </div>
            <span className="text-sm text-slate-500">{creditsRemaining} remaining</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-500`}
              style={{ width: `${Math.min(creditsPercent, 100)}%` }}
            />
          </div>
          {creditsRemaining <= 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-red-700 font-medium">Monthly limit reached</p>
              <p className="text-red-600 text-sm mt-1">Contact your account manager to get more credits.</p>
              <a
                href="https://wa.me/919330408074"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600"
              >
                WhatsApp Support
              </a>
            </div>
          )}
        </div>

        {/* Creation Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creationModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeClick(mode)}
              disabled={creditsRemaining <= 0}
              className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode.badge && (
                <span className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full">
                  {mode.badge}
                </span>
              )}
              
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <mode.icon className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">{mode.name}</h3>
              <p className="text-slate-600 text-sm">{mode.description}</p>
              
              <div className="mt-4 flex items-center text-indigo-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Start creating →
              </div>
            </button>
          ))}
        </div>

        {/* DNA Completion Prompt */}
        {brandDna && brandDna.completion_percent < 100 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Complete Your Brand DNA</h3>
                <p className="text-slate-600 text-sm mt-1">
                  Your profile is {brandDna.completion_percent}% complete. Add more details for better AI results.
                </p>
              </div>
              <Button
                onClick={() => navigate("/dna")}
                className="rounded-full bg-indigo-600"
              >
                Complete DNA
              </Button>
            </div>
            <div className="mt-4 h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                style={{ width: `${brandDna.completion_percent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
