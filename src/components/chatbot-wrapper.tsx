"use client";

import { usePathname } from "next/navigation";
import { ChatBot } from "@/components/ui/chatbot";

export function ChatBotWrapper() {
  const pathname = usePathname();

  if (pathname === "/landing") return null;

  return <ChatBot />;
}
