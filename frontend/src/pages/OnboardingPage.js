import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Check } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [brandName, setBrandName] = useState("");
  const [tone, setTone] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const handleCreateBrand = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API}/brands`,
        { name: brandName, tone, industry },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await axios.put(
        `${API}/auth/complete-onboarding`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Brand profile created!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to create brand");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: "Create Brand Profile" },
    { num: 2, title: "Upload Media" },
    { num: 3, title: "Ready to Create" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-block w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20 animate-bounce-slow">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-2">
            Let's Get You Started
          </h1>
          <p className="text-slate-600">Set up your brand in just a few steps</p>
        </div>

        <div className="flex justify-center mb-8 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s.num
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white border-2 border-slate-200 text-slate-400"
                }`}
              >
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {s.title}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="brandName" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Brand Name
                </Label>
                <Input
                  data-testid="onboarding-brand-name-input"
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="My Awesome Brand"
                />
              </div>

              <div>
                <Label htmlFor="tone" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Brand Tone
                </Label>
                <Input
                  data-testid="onboarding-tone-input"
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Professional, Friendly, Playful..."
                />
              </div>

              <div>
                <Label htmlFor="industry" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Industry
                </Label>
                <Input
                  data-testid="onboarding-industry-input"
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Restaurant, Tech, Fashion..."
                />
              </div>

              <Button
                data-testid="onboarding-next-btn"
                onClick={() => setStep(2)}
                disabled={!brandName}
                className="w-full rounded-full px-8 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200 hover:shadow-indigo-500/40"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center py-8">
                <p className="text-slate-600 mb-6">
                  You can upload brand media (logos, images) later from the Media Library
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 rounded-full px-8 py-6 bg-white text-slate-900 border border-slate-200 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                >
                  Back
                </Button>
                <Button
                  data-testid="onboarding-skip-media-btn"
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-full px-8 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200 hover:shadow-indigo-500/40"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold font-outfit text-slate-900 mb-2">
                  You're All Set!
                </h2>
                <p className="text-slate-600">
                  Ready to start creating amazing content with Framey
                </p>
              </div>

              <Button
                data-testid="onboarding-finish-btn"
                onClick={handleCreateBrand}
                disabled={loading}
                className="w-full rounded-full px-8 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200 hover:shadow-indigo-500/40"
              >
                {loading ? "Creating..." : "Go to Dashboard"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
