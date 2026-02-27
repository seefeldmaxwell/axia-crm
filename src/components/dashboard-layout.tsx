"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserPlus, Building2, Users, Briefcase, Phone as PhoneIcon,
  Activity, Calendar, Mail, Settings, Package,
  Zap, Menu, X, LogOut, BarChart3, Megaphone,
  Search as SearchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Avatar } from "./ui/avatar";
import { AxiaLogo } from "./ui/axia-logo";
import { ThemeToggle } from "./ui/theme-toggle";
import { api } from "@/lib/api";

const navSections = [
  {
    label: "Sales",
    items: [
      { href: "/leads", label: "Leads", icon: UserPlus },
      { href: "/vendors", label: "Vendors", icon: Building2 },
      { href: "/clients", label: "Clients", icon: Briefcase },
      { href: "/lead-gen", label: "Lead Generation", icon: Zap },
      { href: "/contacts", label: "Contacts", icon: Users },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/deals", label: "Deal Registration", icon: BarChart3 },
    ],
  },
  {
    label: "Productivity",
    items: [
      { href: "/activities", label: "Activities", icon: Activity },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/mail", label: "Mail", icon: Mail },
      { href: "/dialer", label: "Phone", icon: PhoneIcon },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, org, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mailUnread, setMailUnread] = useState(0);

  useEffect(() => {
    // Fetch unread count from Gmail
    if (user && org) {
      api.getGmailInbox("INBOX", 50).then((data: any) => {
        const unread = (data.messages || []).filter((m: any) => !m.read).length;
        setMailUnread(unread);
      }).catch(() => {});
    }
  }, [user, org]);

  if (!user) return null;

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo + brand */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <AxiaLogo size={28} color="#0071E3" />
          <span
            className="text-[13px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
          >
            AXIA
          </span>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-[12px] rounded cursor-pointer"
          style={{
            background: "var(--bg-quaternary)",
            border: "1px solid var(--border-primary)",
            color: "var(--text-tertiary)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <SearchIcon size={13} />
          <span className="flex-1">Search...</span>
          <kbd
            className="text-[10px] px-1 rounded"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto py-1">
        {navSections.map((section, si) => (
          <div key={si} className={cn(si > 0 && "mt-4")}>
            <p
              className="px-4 mb-1 data-label"
              style={{ fontSize: "10px", letterSpacing: "0.08em" }}
            >
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={mobile ? () => setMobileOpen(false) : undefined}
                  className={cn(
                    "flex items-center gap-2.5 mx-2 px-2.5 py-[7px] text-[13px] transition-colors relative",
                    active
                      ? "font-medium"
                      : "hover:bg-[var(--bg-tertiary)]"
                  )}
                  style={{
                    borderRadius: "var(--radius-sm)",
                    color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                    background: active ? "var(--accent-blue-muted)" : undefined,
                    borderLeft: active ? "2px solid var(--accent-blue)" : "2px solid transparent",
                  }}
                >
                  <item.icon size={16} className="shrink-0" strokeWidth={1.5} />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.href === "/mail" && mailUnread > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 shrink-0"
                      style={{
                        background: "var(--accent-blue)",
                        color: "#fff",
                        borderRadius: "var(--radius-sm)",
                        lineHeight: 1,
                      }}
                    >
                      {mailUnread > 99 ? "99+" : mailUnread}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* System status */}
      <div className="px-4 py-2 shrink-0" style={{ borderTop: "1px solid var(--border-secondary)" }}>
        <div className="flex items-center gap-2">
          <div className="status-dot" style={{ background: "var(--accent-green)" }} />
          <span className="data-label">OPERATIONAL</span>
        </div>
      </div>

      {/* Theme toggle + User */}
      <div className="shrink-0 px-3 pb-3 pt-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
        <div className="flex items-center gap-2 mb-3">
          <ThemeToggle />
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Theme</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Avatar name={user.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{user.name}</p>
            <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[11px] transition-colors"
          style={{
            color: "var(--accent-red)",
            borderRadius: "var(--radius-sm)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-red-muted)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* Sidebar — 220px fixed, Palantir style */}
      <nav
        className="fixed left-0 top-0 bottom-0 z-50 w-[220px] flex-col hidden md:flex"
        style={{
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-primary)",
        }}
      >
        <SidebarContent />
      </nav>

      {/* Mobile header */}
      <div
        className="fixed top-0 left-0 right-0 h-[48px] flex items-center px-4 z-40 md:hidden"
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1 -ml-1"
          style={{ color: "var(--text-primary)" }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex-1 flex justify-center">
          <div
            className="w-7 h-7 flex items-center justify-center text-white text-[11px] font-bold"
            style={{
              background: "var(--accent-blue)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
            }}
          >
            A
          </div>
        </div>
        <div className="w-5" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
          <div
            className="fixed left-0 top-[48px] bottom-0 w-[260px] z-50 md:hidden overflow-y-auto flex flex-col"
            style={{
              background: "var(--bg-secondary)",
              borderRight: "1px solid var(--border-primary)",
            }}
          >
            <SidebarContent mobile />
          </div>
        </>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col mt-[48px] md:mt-0 md:ml-[220px]">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
