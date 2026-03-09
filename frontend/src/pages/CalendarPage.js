import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { brandAPI, calendarAPI } from "@/services/api";

export default function CalendarPage() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandAPI.getAll();
      setBrands(response.data);
      if (response.data.length > 0) {
        setSelectedBrand(response.data[0].id);
      }
    } catch (error) {
      console.error("Failed to load brands:", error);
      setError("Failed to load data");
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = async () => {
    if (!selectedBrand) {
      toast.error("Please select a café");
      return;
    }

    setGenerating(true);
    try {
      const response = await calendarAPI.generate(selectedBrand, days);
      setCalendar(response.data.calendar);
      toast.success("Calendar generated!");
    } catch (error) {
      console.error("Failed to generate calendar:", error);
      toast.error("Failed to generate calendar");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading calendar..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={loadBrands} className="rounded-full px-6">
            Try Again
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Content Calendar</h1>
          <p className="text-lg text-slate-600">AI-generated posting schedule for your café</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {brands.length > 0 && (
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="rounded-xl border-slate-200 bg-slate-50 px-4 py-3"
                disabled={generating}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            )}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-xl border-slate-200 bg-slate-50 px-4 py-3"
              disabled={generating}
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
            <Button
              data-testid="generate-calendar-btn"
              onClick={generateCalendar}
              disabled={generating}
              className="rounded-full px-8 py-3 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Generate Calendar
                </>
              )}
            </Button>
          </div>
        </div>

        {calendar ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-slate-900 leading-relaxed">
                {calendar}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <CalendarIcon className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-semibold font-outfit text-slate-900 mb-2">No calendar yet</h2>
            <p className="text-slate-600">Generate an AI-powered content calendar for your café</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
