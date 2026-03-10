import { MessageCircle } from "lucide-react";

export default function WhatsAppFloat() {
  const whatsappLink = "https://wa.me/919330408074?text=" + encodeURIComponent("Hi, I need help with Frameflow");

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-600 hover:scale-110 transition-all duration-200"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
}
