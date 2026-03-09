import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Image, Video, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      toast.error("Failed to load templates");
    }
  };

  const handleUseTemplate = (template) => {
    localStorage.setItem("selectedTemplate", JSON.stringify(template));
    navigate("/create");
    toast.success("Template selected! Fill in your details.");
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "image": return <Image className="w-6 h-6" />;
      case "video": return <Video className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const templateDetails = [
    {
      id: "restaurant-promo",
      prompt: "Create an engaging social media post promoting our daily special: [dish name]. Highlight fresh ingredients and limited availability. Tone: appetizing and urgent."
    },
    {
      id: "cafe-reel",
      prompt: "Generate a cozy cafe video concept showcasing our coffee-making process. Include shots of latte art, warm ambiance, and happy customers. Tone: warm and inviting."
    },
    {
      id: "product-launch",
      prompt: "Announce our new product launch: [product name]. Emphasize innovation, benefits, and exclusive early access. Tone: exciting and professional."
    },
    {
      id: "service-ad",
      prompt: "Promote our service: [service name]. Focus on solving customer pain points, showcasing results, and including a clear call-to-action. Tone: helpful and trustworthy."
    }
  ];

  const enhancedTemplates = templates.map(t => ({
    ...t,
    ...templateDetails.find(td => td.id === t.id)
  }));

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Templates</h1>
          <p className="text-lg text-slate-600">Start creating with ready-to-use marketing templates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enhancedTemplates.map((template) => (
            <div
              key={template.id}
              data-testid={`template-card-${template.id}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 p-6 group hover:border-indigo-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                <span className="text-indigo-600 group-hover:text-white transition-colors">
                  {getTypeIcon(template.type)}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-2">
                {template.name}
              </h3>
              
              <p className="text-slate-600 text-sm mb-4">
                {template.description}
              </p>

              <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Template Prompt</p>
                <p className="text-sm text-slate-700 line-clamp-3">{template.prompt}</p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium capitalize">
                  {template.category}
                </span>
                <span className="text-xs text-slate-400 capitalize">{template.type}</span>
              </div>

              <Button
                data-testid={`use-template-btn-${template.id}`}
                onClick={() => handleUseTemplate(template)}
                className="w-full rounded-full py-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Use Template
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}