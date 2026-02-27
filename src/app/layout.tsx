import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ChatBotWrapper } from "@/components/chatbot-wrapper";

export const metadata: Metadata = {
  title: "Axia CRM",
  description: "Intelligence Platform — Axia CRM",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try { document.documentElement.setAttribute('data-theme', localStorage.getItem('axia-theme') || 'dark') } catch(e) {}
        `}} />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
            <ChatBotWrapper />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
