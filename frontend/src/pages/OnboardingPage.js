import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Coffee, Globe, Loader2, Sparkles, MessageSquare, Target, Palette } from "lucide-react";
import { toast } from "sonner";
import { brandAPI, authAPI } from "@/services/api";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [hasWebsite, setHasWebsite] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [brandDNA, setBrandDNA] = useState(null);
  
  // Manual brand info
  const [cafeName, setCafeName] = useState("");
  const [cafeDescription, setCafeDescription] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandTone, setBrandTone] = useState("warm and inviting");
  const [uniqueFeatures, setUniqueFeatures] = useState("");
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl.trim()) {
      toast.error("Please enter your website URL");
      return;
    }

    setAnalyzing(true);
    try {
      // First create a temporary brand
      const brandRes = await brandAPI.create({
        name: cafeName || "My Café",
        tone: "warm and inviting",
        industry: "café",
        website_url: websiteUrl
      });

      // Then analyze it
      const analysisRes = await brandAPI.analyze(brandRes.data.id, websiteUrl);
      setBrandDNA(analysisRes.data.analysis);
      
      // Extract data from analysis
      if (analysisRes.data.analysis) {
        const analysis = analysisRes.data.analysis;
        if (analysis["Brand Name"]) setCafeName(analysis["Brand Name"]);
        if (analysis["Brand Tone"]) setBrandTone(analysis["Brand Tone"]);
        if (analysis["Specialties"]) setSpecialties(analysis["Specialties"]);
        if (analysis["Target Audience"]) setTargetAudience(analysis["Target Audience"]);
      }
      
      toast.success("Website analyzed! We've extracted your Brand DNA.");
      setStep(3);
    } catch (error) {
      console.error("Failed to analyze website:", error);
      toast.error("Couldn't analyze website. Let's set up manually.");
      setHasWebsite(false);
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateBrand = async () => {
    if (!cafeName.trim()) {
      toast.error("Please enter your café name");
      return;
    }

    setLoading(true);
    try {
      // Create brand with all collected data
      await brandAPI.create({
        name: cafeName,
        tone: brandTone,
        industry: "café",
        specialties: specialties,
        target_audience: targetAudience,
        description: cafeDescription,
        unique_features: uniqueFeatures,
        website_url: websiteUrl || null,
        brand_dna: brandDNA || {
          "Brand Name": cafeName,
          "Brand Tone": brandTone,
          "Specialties": specialties,
          "Target Audience": targetAudience,
          "Unique Features": uniqueFeatures,
          "Description": cafeDescription
        }
      });

      await authAPI.completeOnboarding();
      toast.success("Your café profile is ready! Let's start marketing.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Failed to create brand:", error);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toneOptions = [
    { value: "warm and inviting", label: "Warm & Inviting", desc: "Cozy, friendly, welcoming" },
    { value: "modern and minimal", label: "Modern & Minimal", desc: "Clean, sleek, contemporary" },
    { value: "playful and fun", label: "Playful & Fun", desc: "Energetic, creative, bold" },
    { value: "artisan and craft", label: "Artisan & Craft", desc: "Handcrafted, authentic, quality" },
    { value: "eco and sustainable", label: "Eco & Sustainable", desc: "Green, conscious, ethical" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white border-2 border-slate-200 text-slate-400"
                }`}>
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`w-16 h-1 rounded-full ${step > s ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Website Check */}
          {step === 1 && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 animate-in fade-in slide-in-from-bottom duration-500">
              <div className="text-center mb-8">
                <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 items-center justify-center mb-4 shadow-xl shadow-indigo-500/20">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-2">
                  Let's Build Your Brand DNA
                </h1>
                <p className="text-slate-600">
                  This helps our AI create marketing content that sounds authentically you.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold text-slate-700 mb-3 block">
                    Does your café have a website?
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setHasWebsite(true)}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        hasWebsite === true
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Globe className={`w-8 h-8 mx-auto mb-2 ${hasWebsite === true ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div className={`font-semibold ${hasWebsite === true ? 'text-indigo-600' : 'text-slate-700'}`}>
                        Yes, I have a website
                      </div>
                      <div className="text-sm text-slate-500 mt-1">We'll analyze it for you</div>
                    </button>
                    <button
                      onClick={() => { setHasWebsite(false); setStep(2); }}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        hasWebsite === false
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <MessageSquare className={`w-8 h-8 mx-auto mb-2 ${hasWebsite === false ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div className={`font-semibold ${hasWebsite === false ? 'text-indigo-600' : 'text-slate-700'}`}>
                        No, set up manually
                      </div>
                      <div className="text-sm text-slate-500 mt-1">Answer a few questions</div>
                    </button>
                  </div>
                </div>

                {hasWebsite === true && (
                  <div className="animate-in fade-in slide-in-from-bottom duration-300">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Website URL
                    </Label>
                    <Input
                      data-testid="onboarding-website-input"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://mycafe.com"
                      className="rounded-xl py-6 text-base"
                    />
                    <Button
                      data-testid="analyze-website-btn"
                      onClick={handleAnalyzeWebsite}
                      disabled={analyzing}
                      className="w-full mt-4 rounded-full py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing Your Brand...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Analyze Website
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Manual Brand Setup */}
          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 animate-in fade-in slide-in-from-bottom duration-500">
              <div className="text-center mb-8">
                <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center mb-4 shadow-xl shadow-orange-500/20">
                  <Coffee className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-2">
                  Tell Us About Your Café
                </h1>
                <p className="text-slate-600">
                  Help our AI understand your unique brand.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Café Name *
                  </Label>
                  <Input
                    data-testid="cafe-name-input"
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    placeholder="Urban Brew Café"
                    className="rounded-xl py-3"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Describe Your Café
                  </Label>
                  <Textarea
                    value={cafeDescription}
                    onChange={(e) => setCafeDescription(e.target.value)}
                    placeholder="A cozy neighborhood café specializing in artisan coffee and fresh pastries..."
                    className="rounded-xl min-h-[100px]"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Specialties & Signature Items
                  </Label>
                  <Input
                    value={specialties}
                    onChange={(e) => setSpecialties(e.target.value)}
                    placeholder="Vanilla Latte, Avocado Toast, Homemade Croissants"
                    className="rounded-xl py-3"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Target Audience
                  </Label>
                  <Input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Remote workers, students, coffee enthusiasts"
                    className="rounded-xl py-3"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 rounded-full py-6"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!cafeName.trim()}
                    className="flex-1 rounded-full py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Brand Voice */}
          {step === 3 && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 animate-in fade-in slide-in-from-bottom duration-500">
              <div className="text-center mb-8">
                <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center mb-4 shadow-xl shadow-purple-500/20">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-2">
                  Define Your Brand Voice
                </h1>
                <p className="text-slate-600">
                  How should your marketing content sound?
                </p>
              </div>

              {brandDNA && (
                <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                    <Check className="w-5 h-5" />
                    Brand DNA Extracted
                  </div>
                  <p className="text-sm text-green-600">
                    We've analyzed your website and pre-filled your brand information.
                  </p>
                </div>
              )}

              <div className="space-y-5">
                {!brandDNA && (
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Café Name
                    </Label>
                    <Input
                      value={cafeName}
                      onChange={(e) => setCafeName(e.target.value)}
                      className="rounded-xl py-3"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-3 block">
                    Brand Tone & Personality
                  </Label>
                  <div className="grid grid-cols-1 gap-3">
                    {toneOptions.map((tone) => (
                      <button
                        key={tone.value}
                        onClick={() => setBrandTone(tone.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          brandTone === tone.value
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className={`font-semibold ${brandTone === tone.value ? 'text-indigo-600' : 'text-slate-700'}`}>
                          {tone.label}
                        </div>
                        <div className="text-sm text-slate-500">{tone.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    What Makes Your Café Unique?
                  </Label>
                  <Textarea
                    value={uniqueFeatures}
                    onChange={(e) => setUniqueFeatures(e.target.value)}
                    placeholder="We roast our own beans weekly, offer a dog-friendly patio, and feature local artists..."
                    className="rounded-xl min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setStep(hasWebsite ? 1 : 2)}
                    variant="outline"
                    className="flex-1 rounded-full py-6"
                  >
                    Back
                  </Button>
                  <Button
                    data-testid="complete-onboarding-btn"
                    onClick={handleCreateBrand}
                    disabled={loading || !cafeName.trim()}
                    className="flex-1 rounded-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
