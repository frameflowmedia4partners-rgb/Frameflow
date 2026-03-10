import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Image as ImageIcon,
  Building2,
  Link2,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Palette,
  Globe,
  Instagram,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

// Frameflow Logo Component
function FrameflowLogo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient-onboarding" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#logo-gradient-onboarding)" />
      <path d="M20 24h24M20 32h18M20 40h22" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="40" r="6" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Brand Assets
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [sampleImages, setSampleImages] = useState([]);
  const [samplePreviews, setSamplePreviews] = useState([]);
  const [brandDNA, setBrandDNA] = useState(null);
  
  // Step 2: Business Info
  const [businessInfo, setBusinessInfo] = useState({
    business_name: user?.full_name || "",
    tagline: "",
    phone: "",
    address: "",
    website_url: ""
  });
  const [scrapingResult, setScrapingResult] = useState(null);
  
  // Step 3: Meta Connection
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaAccounts, setMetaAccounts] = useState([]);

  const steps = [
    { num: 1, label: "Brand Assets", icon: ImageIcon },
    { num: 2, label: "Business Info", icon: Building2 },
    { num: 3, label: "Connect Meta", icon: Link2 },
    { num: 4, label: "Confirmation", icon: CheckCircle }
  ];

  useEffect(() => {
    checkMetaStatus();
  }, []);

  const checkMetaStatus = async () => {
    try {
      const response = await api.get("/integrations/status");
      if (response.data.instagram?.connected) {
        setMetaConnected(true);
        setMetaAccounts(response.data.instagram.accounts || []);
      }
    } catch (error) {
      console.error("Failed to check meta status:", error);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleImagesUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setSampleImages(files);
    
    const previews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) {
          setSamplePreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStep1Submit = async () => {
    if (samplePreviews.length < 1) {
      toast.error("Please upload at least 1 sample image");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/onboarding/brand-assets", {
        logo_url: logoPreview,
        sample_images: samplePreviews
      });
      
      setBrandDNA(response.data.brand_dna);
      toast.success("Brand assets analyzed!");
      setStep(2);
    } catch (error) {
      toast.error("Failed to analyze brand assets");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!businessInfo.business_name) {
      toast.error("Please enter your business name");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/onboarding/business-info", businessInfo);
      setScrapingResult(response.data);
      
      if (response.data.scraped_data?.error) {
        toast.info("Couldn't scrape website - you can add media manually later");
      } else if (response.data.images_found > 0) {
        toast.success(`Found ${response.data.images_found} images from your website!`);
      } else {
        toast.success("Business info saved!");
      }
      
      setStep(3);
    } catch (error) {
      toast.error("Failed to save business info");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectMeta = async () => {
    try {
      const response = await api.get("/integrations/meta/oauth-url");
      
      if (response.data.setup_required) {
        toast.error("Meta integration not configured yet. Contact admin.");
        return;
      }
      
      if (response.data.oauth_url) {
        window.location.href = response.data.oauth_url;
      }
    } catch (error) {
      toast.error("Failed to start Meta connection");
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      await api.post("/onboarding/complete");
      toast.success("Welcome to Frameflow!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error("Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FrameflowLogo className="w-10 h-10" />
            <span className="text-xl font-bold font-outfit text-slate-900">Frameflow</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                  step >= s.num 
                    ? "bg-indigo-600 border-indigo-600 text-white" 
                    : "border-slate-300 text-slate-400"
                }`}>
                  {step > s.num ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <s.icon className="w-6 h-6" />
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-2 transition-all ${
                    step > s.num ? "bg-indigo-600" : "bg-slate-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map(s => (
              <span key={s.num} className={`text-sm ${step >= s.num ? "text-indigo-600 font-medium" : "text-slate-400"}`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          
          {/* Step 1: Brand Assets */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold font-outfit text-slate-900 mb-2">Brand Assets</h2>
                <p className="text-slate-600">Upload your logo and sample posts so Frameflow learns your brand style</p>
              </div>

              {/* Logo Upload */}
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-3 block">Logo (optional)</Label>
                <div className="flex items-center gap-4">
                  <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 flex items-center justify-center cursor-pointer transition-colors overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-400" />
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <div className="text-sm text-slate-500">
                    Upload PNG, SVG, or JPG
                  </div>
                </div>
              </div>

              {/* Sample Images Upload */}
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Sample Social Media Posts</Label>
                <p className="text-sm text-slate-500 mb-4">
                  Show us 3-5 of your past posts so Frameflow learns your exact brand style — 
                  watermarks, logo placement, colours, and layout.
                </p>
                <label className="block p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 cursor-pointer transition-colors text-center">
                  <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <div className="text-slate-600 font-medium">Click to upload images</div>
                  <div className="text-sm text-slate-400">3-5 images recommended</div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSampleImagesUpload}
                    className="hidden"
                  />
                </label>
                
                {samplePreviews.length > 0 && (
                  <div className="mt-4 flex gap-3 flex-wrap">
                    {samplePreviews.map((preview, i) => (
                      <img
                        key={i}
                        src={preview}
                        alt={`Sample ${i + 1}`}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Brand DNA Preview */}
              {brandDNA && (
                <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Detected Brand DNA
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-indigo-600">Tone:</span>
                      <span className="ml-2 text-slate-700">{brandDNA.brand_tone || "Warm"}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600">Logo Position:</span>
                      <span className="ml-2 text-slate-700">{brandDNA.logo_position || "Top-left"}</span>
                    </div>
                    {brandDNA.primary_colors && (
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-indigo-600">Colors:</span>
                        {brandDNA.primary_colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleStep1Submit}
                disabled={loading || samplePreviews.length < 1}
                className="w-full rounded-xl py-6 bg-indigo-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Brand...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-outfit text-slate-900 mb-2">Business Information</h2>
                <p className="text-slate-600">Tell us about your café so we can create personalized content</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Business Name *</Label>
                  <Input
                    value={businessInfo.business_name}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, business_name: e.target.value })}
                    placeholder="Urban Brew Café"
                    className="mt-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Tagline</Label>
                  <Input
                    value={businessInfo.tagline}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, tagline: e.target.value })}
                    placeholder="Where coffee meets comfort"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Website URL</Label>
                  <Input
                    value={businessInfo.website_url}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, website_url: e.target.value })}
                    placeholder="https://yourcafe.com"
                    className="mt-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Full Address</Label>
                  <Input
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                    placeholder="123 Coffee Street, Mumbai, MH 400001"
                    className="mt-2"
                  />
                </div>
              </div>

              {businessInfo.website_url && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm">We'll scan your website for product images and content</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl py-6">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleStep2Submit}
                  disabled={loading || !businessInfo.business_name}
                  className="flex-1 rounded-xl py-6 bg-indigo-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {businessInfo.website_url ? "Analysing website..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Connect Meta */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-outfit text-slate-900 mb-2">Connect Facebook & Instagram</h2>
                <p className="text-slate-600">
                  Connect your accounts to publish content and view analytics. 
                  Connected once, works forever. Disconnect anytime.
                </p>
              </div>

              {metaConnected ? (
                <div className="p-6 rounded-2xl bg-green-50 border border-green-100">
                  <div className="flex items-center gap-3 text-green-700 mb-4">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">Connected</span>
                  </div>
                  {metaAccounts.map((account, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-green-200">
                      {account.profile_picture_url ? (
                        <img src={account.profile_picture_url} alt="" className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
                      )}
                      <div>
                        <div className="font-medium text-slate-900">@{account.username}</div>
                        <div className="text-sm text-slate-500">{account.followers_count?.toLocaleString()} followers</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handleConnectMeta}
                    className="w-full p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 transition-all flex items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center">
                      <Instagram className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-slate-900">Connect Facebook & Instagram</div>
                      <div className="text-sm text-slate-500">Sign in with your Meta account</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    Your data is private and secure. You can revoke access anytime.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-xl py-6">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="flex-1 rounded-xl py-6 bg-indigo-600"
                >
                  {metaConnected ? "Continue" : "Skip for now"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold font-outfit text-slate-900 mb-2">You're All Set!</h2>
                <p className="text-slate-600">Review your details below and open your dashboard</p>
              </div>

              {/* Summary Card */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {logoPreview && (
                    <div className="flex items-center gap-4">
                      <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
                      <div>
                        <div className="text-xs text-slate-500">Logo</div>
                        <div className="font-medium text-slate-900">Uploaded</div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-xs text-slate-500">Business Name</div>
                    <div className="font-medium text-slate-900">{businessInfo.business_name || "—"}</div>
                  </div>
                  
                  {businessInfo.tagline && (
                    <div>
                      <div className="text-xs text-slate-500">Tagline</div>
                      <div className="font-medium text-slate-900">{businessInfo.tagline}</div>
                    </div>
                  )}
                  
                  {businessInfo.phone && (
                    <div>
                      <div className="text-xs text-slate-500">Phone</div>
                      <div className="font-medium text-slate-900">{businessInfo.phone}</div>
                    </div>
                  )}
                  
                  {businessInfo.address && (
                    <div className="md:col-span-2">
                      <div className="text-xs text-slate-500">Address</div>
                      <div className="font-medium text-slate-900">{businessInfo.address}</div>
                    </div>
                  )}
                  
                  {businessInfo.website_url && (
                    <div>
                      <div className="text-xs text-slate-500">Website</div>
                      <div className="font-medium text-slate-900">{businessInfo.website_url}</div>
                    </div>
                  )}

                  {brandDNA?.primary_colors && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Brand Colors</div>
                      <div className="flex gap-2">
                        {brandDNA.primary_colors.slice(0, 5).map((color, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full border border-white shadow"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Meta Status */}
              <div className={`p-4 rounded-xl ${metaConnected ? "bg-green-50 border border-green-100" : "bg-amber-50 border border-amber-100"}`}>
                <div className="flex items-center gap-2">
                  {metaConnected ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Meta Connected</span>
                    </>
                  ) : (
                    <>
                      <Instagram className="w-5 h-5 text-amber-600" />
                      <span className="font-medium text-amber-800">Meta Not Yet Connected</span>
                    </>
                  )}
                </div>
                {!metaConnected && (
                  <p className="text-sm text-amber-700 mt-1">
                    You can connect later from Settings to enable publishing and analytics
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1 rounded-xl py-6">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleCompleteOnboarding}
                  disabled={loading}
                  className="flex-1 rounded-xl py-6 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Open My Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
