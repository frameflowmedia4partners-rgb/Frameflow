import { useState, useEffect, useRef } from "react";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm your AI marketing assistant. I know your Brand DNA and can help you with:\n\n• Content ideas and captions\n• Marketing strategy\n• Social media tips\n• Answering questions about your brand\n\nWhat would you like to create today?",
      },
    ]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post("/chat", {
        message: userMessage,
        conversation_id: conversationId,
      });

      setConversationId(response.data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "Generate a Diwali post for my menu",
    "Write captions for a coffee post",
    "What should I post this week?",
    "Give me 5 reel ideas",
  ];

  return (
    <ClientLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Assistant</h1>
              <p className="text-sm text-slate-500">Powered by your Brand DNA</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-indigo-100"
                    : "bg-gradient-to-br from-indigo-500 to-purple-500"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`max-w-[70%] p-4 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-slate-500 mb-3">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-xl">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your marketing..."
              className="flex-1 rounded-full bg-slate-50"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-full w-12 h-12 p-0 bg-indigo-600"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
