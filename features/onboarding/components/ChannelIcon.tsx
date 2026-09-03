import { FaFacebook, FaInstagram, FaTelegram, FaWhatsapp } from "react-icons/fa6";
import { MessageCircle } from "lucide-react";
import type { Channel } from "../types";

const CHANNEL_COLORS: Record<Channel, string> = {
  whatsapp: "#25D366",
  instagram: "#E4405F",
  facebook: "#1877F2",
  telegram: "#26A5E4",
  outro: "#6B7280",
};

export function ChannelIcon({ channel, className = "size-4" }: { channel: Channel; className?: string }) {
  const color = CHANNEL_COLORS[channel];

  switch (channel) {
    case "whatsapp":
      return <FaWhatsapp className={className} color={color} />;
    case "instagram":
      return <FaInstagram className={className} color={color} />;
    case "facebook":
      return <FaFacebook className={className} color={color} />;
    case "telegram":
      return <FaTelegram className={className} color={color} />;
    default:
      return <MessageCircle className={className} color={color} />;
  }
}
