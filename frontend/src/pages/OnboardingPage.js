import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Check, Coffee } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [cafeName, setCafeName] = useState("");
  const [tone, setTone] = useState("warm and inviting");
  const [industry] = useState("café");
  const [specialties, setSpecialties] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const handleCreateCafe = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API}/brands`,
        { 
          name: cafeName, 
          tone, 
          industry,
          specialties: specialties || "Coffee, Pastries, Ambiance"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await axios.put(
        `${API}/auth/complete-onboarding`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Café profile created!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error("Failed to create café profile");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: "Create Café Profile" },
    { num: 2, title: "Café Style" },
    { num: 3, title: "Ready to Create" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-block w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20 animate-bounce-slow">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-2">
            Let's Set Up Your Café
          </h1>
          <p className="text-slate-600">Set up your café profile in just a few steps</p>
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
                <Label htmlFor="cafeName" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Café Name
                </Label>
                <Input
                  data-testid="onboarding-cafe-name-input"
                  id="cafeName"
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                  placeholder="Urban Brew Café"
                />
              </div>

              <div>
                <Label htmlFor="specialties" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Café Specialties
                </Label>
                <Input
                  data-testid="onboarding-specialties-input"
                  id="specialties"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                  placeholder="Artisan Coffee, Pastries, Cozy Atmosphere"
                />
              </div>

              <Button
                data-testid="onboarding-next-btn"
                onClick={() => setStep(2)}
                disabled={!cafeName}
                className="w-full rounded-full px-8 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="tone" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Café Vibe & Tone
                </Label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-base"
                >
                  <option value="warm and inviting">Warm & Inviting</option>
                  <option value="modern and minimalist">Modern & Minimalist</option>
                  <option value="cozy and rustic">Cozy & Rustic</option>
                  <option value="trendy and vibrant">Trendy & Vibrant</option>
                  <option value="elegant and sophisticated">Elegant & Sophisticated</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 rounded-full px-8 py-6 bg-white text-slate-900 border border-slate-200 font-medium"
                >
                  Back
                </Button>
                <Button
                  data-testid="onboarding-continue-btn"
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-full px-8 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200"
                >
                  Continue
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
                  Ready to start creating amazing café content with Framey
                </p>
              </div>

              <Button
                data-testid="onboarding-finish-btn"
                onClick={handleCreateCafe}
                disabled={loading}
                className="w-full rounded-full px-8 py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200"
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