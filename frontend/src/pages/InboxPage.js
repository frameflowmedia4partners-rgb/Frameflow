import { useState, useEffect } from "react";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import {
  Inbox as InboxIcon,
  MessageCircle,
  Instagram,
  Loader2,
  MessageSquare,
  Heart,
  User,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function InboxPage() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [comments, setComments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("comments"); // comments, messages

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    try {
      setLoading(true);
      const response = await api.get("/inbox");
      setConnected(response.data?.connected || false);
      setComments(response.data?.comments || []);
      setMessages(response.data?.messages || []);
    } catch (error) {
      console.error("Failed to load inbox:", error);
    } finally {
      setLoading(false);
    }
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
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <InboxIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900">Inbox</h1>
              <p className="text-slate-600">Manage your comments and messages</p>
            </div>
          </div>
        </div>

        {/* Not Connected State */}
        {!connected ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mb-6">
              <Instagram className="w-12 h-12 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Connect Instagram</h2>
            <p className="text-slate-600 text-center max-w-md mb-8">
              Connect Instagram to manage your comments and DMs in one place
            </p>
            <Button className="rounded-full px-8 py-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold">
              <Instagram className="w-5 h-5 mr-2" />
              Connect Instagram
            </Button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("comments")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === "comments"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Comments
                {comments.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {comments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === "messages"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                DMs
                {messages.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {messages.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content */}
            {activeTab === "comments" ? (
              comments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                  <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No comments yet</h3>
                  <p className="text-slate-600">Comments on your posts will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-slate-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{comment.username}</p>
                          <p className="text-slate-600">{comment.text}</p>
                          <p className="text-xs text-slate-400 mt-1">{comment.timestamp}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              messages.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                  <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No messages yet</h3>
                  <p className="text-slate-600">Direct messages will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-slate-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{msg.username}</p>
                          <p className="text-slate-600">{msg.text}</p>
                          <p className="text-xs text-slate-400 mt-1">{msg.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </ClientLayout>
  );
}
