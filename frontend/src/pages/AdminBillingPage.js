import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  IndianRupee,
  Calendar,
  Search,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function AdminBillingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadBilling();
  }, []);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/billing");
      setBillingData(response.data);
    } catch (error) {
      console.error("Failed to load billing:", error);
      toast.error("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (clientId) => {
    try {
      await api.put(`/admin/billing/${clientId}`, { status: "paid" });
      toast.success("Marked as paid");
      loadBilling();
    } catch (error) {
      toast.error("Failed to update billing");
    }
  };

  const filteredRecords = billingData?.records?.filter(record =>
    record.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.client?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading billing..." />
      </Layout>
    );
  }

  const summary = billingData?.summary || {};

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-outfit text-slate-900">Billing Tracker</h1>
            <p className="text-slate-600">Manage client payments - ₹{summary.monthly_fee?.toLocaleString() || "15,000"}/month per client</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-slate-600">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">₹{summary.total_monthly_revenue?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-slate-600">Paid</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{summary.paid_this_month || 0}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-600">Unpaid</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{summary.unpaid_count || 0}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm text-slate-600">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{summary.overdue_count || 0}</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Billing Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Due Date</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No billing records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr 
                      key={record.id} 
                      className={`border-b border-slate-50 hover:bg-slate-50 ${record.is_overdue ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{record.client?.full_name || "Unknown"}</div>
                        <div className="text-sm text-slate-500">{record.client?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        ₹{record.amount?.toLocaleString() || "15,000"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {record.due_date ? new Date(record.due_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {record.status === "paid" ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Paid ✅
                          </span>
                        ) : record.is_overdue ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Overdue 🔴
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            Unpaid ⏳
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {record.status !== "paid" && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPaid(record.user_id)}
                            className="rounded-lg bg-green-600 hover:bg-green-700"
                          >
                            Mark Paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
