"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  GitBranch,
  Radio,
  BarChart3,
  Play,
  Check,
  Shield,
  Users,
  Zap,
  Bot,
} from "lucide-react";
import { AxiaLogo } from "@/components/ui/axia-logo";

/* ── Intersection Observer Hook ── */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Data ── */

const navLinks = ["Platform", "Features", "Pricing", "Contact"];

const metrics = [
  { value: "10,000+", label: "Leads Managed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 50ms", label: "API Response" },
  { value: "SOC 2", label: "Compliant" },
];

const capabilities = [
  {
    icon: Brain,
    title: "Intelligence Engine",
    description:
      "AI-driven lead generation, prospect enrichment, and predictive scoring. Surface the highest-value opportunities before your competitors see them.",
    link: "Explore scoring models",
  },
  {
    icon: GitBranch,
    title: "Operations Center",
    description:
      "End-to-end deal pipeline with Azure-style kanban boards, task management, and revenue forecasting. Full lifecycle from prospect to close.",
    link: "View pipeline tools",
  },
  {
    icon: Radio,
    title: "Communications Hub",
    description:
      "Unified inbox, power dialer with call scripts, and AI chatbot assistant. Every interaction logged, every context preserved across channels.",
    link: "See integrations",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Real-time reports, pipeline forecasting, conversion funnels, and team performance metrics. Decision-grade data delivered in milliseconds.",
    link: "Preview dashboards",
  },
];

const features = [
  {
    icon: Users,
    title: "Built for Teams",
    description:
      "Admin and member roles, record ownership, transfer and sharing controls. Every action is logged, every permission is auditable.",
    bullets: [
      "Role-based access control",
      "Record ownership & transfers",
      "Full audit trail",
    ],
  },
  {
    icon: Zap,
    title: "Real-Time Data",
    description:
      "Powered by Cloudflare D1 at the edge. Sub-50ms response times globally. Your data is replicated, encrypted, and always available.",
    bullets: [
      "Cloudflare edge deployment",
      "Global low-latency sync",
      "Encrypted at rest & transit",
    ],
  },
  {
    icon: Bot,
    title: "AI-Powered Workflows",
    description:
      "Built-in chatbot assistant, intelligent lead scoring, and automated workflow triggers. Let the system handle the repetitive work.",
    bullets: [
      "AI chatbot assistant",
      "Predictive lead scoring",
      "Automated task routing",
    ],
  },
];

const stackLabels = [
  "Cloudflare Workers",
  "D1 Database",
  "Google OAuth",
  "Microsoft Auth",
  "Hono.js",
  "React",
  "Next.js",
];

const pricingTiers = [
  {
    name: "STARTER",
    price: "Free",
    period: "",
    description: "For individuals getting started with CRM.",
    features: [
      "1 user",
      "100 leads",
      "Basic pipeline",
      "Email integration",
      "Community support",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "PROFESSIONAL",
    price: "$60",
    period: "/mo per user",
    description: "For growing teams that need the full command center.",
    features: [
      "Up to 10 users",
      "Unlimited leads",
      "Advanced pipeline & forecasting",
      "Power dialer & call recording",
      "AI lead scoring",
      "Custom dashboards",
      "Priority support",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    period: "",
    description: "For organizations requiring dedicated infrastructure.",
    features: [
      "Unlimited users",
      "Unlimited everything",
      "SSO & SAML",
      "Dedicated account manager",
      "Custom SLA",
      "On-premise option",
      "24/7 phone support",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const footerColumns = [
  {
    title: "Platform",
    links: ["Features", "Pricing", "Integrations", "API Docs"],
  },
  { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
];

/* ── CSS-only Network Visualization ── */

function NetworkGraph() {
  const nodes = [
    { x: 10, y: 50, size: 8, delay: 0 },
    { x: 25, y: 22, size: 6, delay: 0.4 },
    { x: 25, y: 78, size: 6, delay: 0.8 },
    { x: 42, y: 38, size: 5, delay: 0.2 },
    { x: 42, y: 62, size: 5, delay: 0.6 },
    { x: 50, y: 50, size: 12, delay: 0 },
    { x: 58, y: 30, size: 5, delay: 1.0 },
    { x: 58, y: 70, size: 5, delay: 0.3 },
    { x: 75, y: 22, size: 6, delay: 0.7 },
    { x: 75, y: 78, size: 6, delay: 0.5 },
    { x: 90, y: 50, size: 8, delay: 0.9 },
  ];

  const lines = [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5],
    [5, 6], [5, 7], [6, 8], [7, 9], [8, 10], [9, 10],
    [1, 4], [2, 3], [6, 9], [7, 8],
  ];

  return (
    <div
      className="relative w-full mx-auto"
      style={{ maxWidth: 700, height: 200 }}
    >
      {/* Connection lines via SVG */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0" />
            <stop
              offset="50%"
              stopColor="var(--accent-blue)"
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor="var(--accent-blue)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {lines.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="var(--accent-blue)"
            strokeWidth="0.3"
            strokeOpacity="0.2"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.1;0.35;0.1"
              dur={`${3 + (i % 5) * 0.6}s`}
              begin={`${i * 0.2}s`}
              repeatCount="indefinite"
            />
          </line>
        ))}

        {/* Data particles */}
        {[
          [0, 5],
          [5, 10],
          [1, 8],
          [2, 9],
        ].map(([a, b], i) => (
          <circle
            key={`p${i}`}
            r="0.6"
            fill="var(--accent-blue)"
            fillOpacity="0.9"
          >
            <animateMotion
              dur={`${3 + i * 0.5}s`}
              begin={`${i * 0.7}s`}
              repeatCount="indefinite"
              path={`M${nodes[a].x},${nodes[a].y} L${nodes[b].x},${nodes[b].y}`}
            />
            <animate
              attributeName="fill-opacity"
              values="0;0.9;0.9;0"
              dur={`${3 + i * 0.5}s`}
              begin={`${i * 0.7}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>

      {/* Nodes as absolute-positioned divs with glow */}
      {nodes.map((node, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.size * 2,
            height: node.size * 2,
            transform: "translate(-50%, -50%)",
            background: "var(--accent-blue)",
            opacity: i === 5 ? 0.9 : 0.5 + (node.size / 24),
            boxShadow:
              i === 5
                ? "0 0 30px rgba(45,127,249,0.5), 0 0 60px rgba(45,127,249,0.2)"
                : `0 0 ${node.size * 2}px rgba(45,127,249,0.3)`,
            animation: `nodePulse ${3 + node.delay * 2}s ease-in-out ${node.delay}s infinite`,
          }}
        />
      ))}

      {/* Center label */}
      <div
        className="absolute text-center"
        style={{
          left: "50%",
          top: "88%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.15em",
          color: "var(--accent-blue)",
          opacity: 0.6,
        }}
      >
        AXIA CORE
      </div>

      {/* Edge labels */}
      <div
        className="absolute"
        style={{
          left: "10%",
          top: "88%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-mono)",
          fontSize: 8,
          letterSpacing: "0.12em",
          color: "var(--text-tertiary)",
          opacity: 0.4,
        }}
      >
        INGEST
      </div>
      <div
        className="absolute"
        style={{
          left: "90%",
          top: "88%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-mono)",
          fontSize: 8,
          letterSpacing: "0.12em",
          color: "var(--text-tertiary)",
          opacity: 0.4,
        }}
      >
        OUTPUT
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute("data-theme", "dark");

    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mono = { fontFamily: "var(--font-mono)" } as const;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Inline keyframes */}
      <style>{`
        @keyframes nodePulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%,-50%) scale(1.3); opacity: 1; }
        }
        @keyframes gridDrift {
          0% { background-position: 0 0; }
          100% { background-position: 24px 24px; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes typeFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* ── 1. NAVBAR ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(13, 14, 18, 0.95)"
            : "rgba(13, 14, 18, 0)",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled
            ? "1px solid var(--border-secondary)"
            : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <AxiaLogo size={32} color="#0071E3" />
            <span
              className="text-[14px] font-semibold tracking-[0.25em] uppercase"
              style={{ ...mono, color: "var(--text-primary)" }}
            >
              AXIA
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[11px] uppercase tracking-[0.12em] transition-colors"
                style={{ ...mono, color: "var(--text-tertiary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-tertiary)")
                }
              >
                {item}
              </a>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[11px] uppercase tracking-[0.08em] px-4 py-2 transition-colors"
              style={{ ...mono, color: "var(--text-secondary)" }}
            >
              Sign In
            </Link>
            <a
              href="#access"
              className="text-[11px] uppercase tracking-[0.08em] px-5 py-2 text-white font-medium transition-all"
              style={{
                ...mono,
                background: "var(--accent-blue)",
                borderRadius: "var(--radius-sm)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-blue-hover)";
                e.currentTarget.style.boxShadow =
                  "0 0 30px rgba(45,127,249,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent-blue)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Request Access
            </a>
          </div>
        </div>
      </nav>

      {/* ── 2. HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--text-tertiary) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            opacity: 0.04,
            animation: "gridDrift 20s linear infinite",
          }}
        />

        {/* Radial vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 45%, transparent 0%, #0D0E12 75%)",
          }}
        />

        {/* Blue ambient glow */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(45,127,249,0.06) 0%, transparent 65%)",
          }}
        />

        {/* Faint scanline */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ opacity: 0.015 }}
        >
          <div
            className="absolute left-0 right-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--accent-blue), transparent)",
              animation: "scanline 8s linear infinite",
            }}
          />
        </div>

        <div
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 1s ease, transform 1s ease",
          }}
        >
          {/* System status badge */}
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 mb-10"
            style={{
              background: "rgba(45,127,249,0.08)",
              border: "1px solid rgba(45,127,249,0.2)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: "var(--accent-green)",
                boxShadow: "0 0 8px var(--accent-green)",
                animation: "typeFlicker 3s ease-in-out infinite",
              }}
            />
            <span
              className="text-[10px] uppercase tracking-[0.15em]"
              style={{ ...mono, color: "var(--accent-blue)" }}
            >
              All Systems Operational — v2.0
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-[clamp(36px,6vw,64px)] font-bold leading-[1.05] mb-6 tracking-[-0.03em]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <span className="text-white">THE OPERATING SYSTEM</span>
            <br />
            <span style={{ color: "var(--text-tertiary)" }}>
              FOR YOUR BUSINESS
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-[17px] leading-relaxed max-w-2xl mx-auto mb-12"
            style={{ color: "var(--text-secondary)" }}
          >
            Axia unifies sales, marketing, communications, and analytics into
            one intelligent command center.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-20">
            <a
              href="#access"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 text-[12px] uppercase tracking-[0.1em] font-semibold text-white transition-all"
              style={{
                ...mono,
                background: "var(--accent-blue)",
                borderRadius: "var(--radius-sm)",
                boxShadow:
                  "0 0 40px rgba(45,127,249,0.35), 0 0 80px rgba(45,127,249,0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-blue-hover)";
                e.currentTarget.style.boxShadow =
                  "0 0 50px rgba(45,127,249,0.5), 0 0 100px rgba(45,127,249,0.15)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent-blue)";
                e.currentTarget.style.boxShadow =
                  "0 0 40px rgba(45,127,249,0.35), 0 0 80px rgba(45,127,249,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Request Access
              <ArrowRight size={14} />
            </a>
            <button
              className="inline-flex items-center gap-2.5 px-8 py-3.5 text-[12px] uppercase tracking-[0.1em] font-semibold transition-all"
              style={{
                ...mono,
                background: "transparent",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-blue)";
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.boxShadow =
                  "0 0 20px rgba(45,127,249,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-primary)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Play size={13} fill="currentColor" />
              Watch Demo
            </button>
          </div>

          {/* Network visualization */}
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 2s ease 0.6s",
            }}
          >
            <NetworkGraph />
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48"
          style={{
            background: "linear-gradient(to top, var(--bg-primary), transparent)",
          }}
        />
      </section>

      {/* ── 3. METRICS BAR ── */}
      <section
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-secondary)",
          borderBottom: "1px solid var(--border-secondary)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-[var(--border-secondary)]">
              {metrics.map((m, i) => (
                <div key={i} className="text-center px-6">
                  <div
                    className="text-[28px] font-bold mb-1 tracking-tight"
                    style={{
                      ...mono,
                      color: "var(--text-primary)",
                      textShadow: "0 0 30px rgba(45,127,249,0.25)",
                    }}
                  >
                    {m.value}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-[0.12em]"
                    style={{ ...mono, color: "var(--text-tertiary)" }}
                  >
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 4. CAPABILITIES ── */}
      <section id="platform" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16 text-center">
              <span
                className="text-[10px] uppercase tracking-[0.2em] mb-4 block"
                style={{ ...mono, color: "var(--accent-blue)" }}
              >
                Platform Capabilities
              </span>
              <h2
                className="text-[clamp(24px,3.5vw,36px)] font-bold tracking-[-0.02em]"
                style={{ color: "var(--text-primary)" }}
              >
                Four pillars of operational excellence
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {capabilities.map((cap, i) => (
              <Reveal key={cap.title} delay={i * 0.1}>
                <div
                  className="group p-7 h-full transition-all duration-300 cursor-default"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-md)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(45,127,249,0.4)";
                    e.currentTarget.style.background = "var(--bg-tertiary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 40px rgba(45,127,249,0.06), inset 0 1px 0 rgba(45,127,249,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                    e.currentTarget.style.background = "var(--bg-secondary)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="w-11 h-11 flex items-center justify-center mb-5"
                    style={{
                      background: "var(--accent-blue-muted)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <cap.icon
                      size={20}
                      style={{ color: "var(--accent-blue)" }}
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3
                    className="text-[15px] font-semibold mb-3"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {cap.title}
                  </h3>
                  <p
                    className="text-[13px] leading-relaxed mb-5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {cap.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] transition-colors"
                    style={{ ...mono, color: "var(--accent-blue)" }}
                  >
                    {cap.link}
                    <ArrowRight size={12} />
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. FEATURES — WHY AXIA ── */}
      <section
        id="features"
        className="py-32 px-6"
        style={{ borderTop: "1px solid var(--border-secondary)" }}
      >
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-20 text-center">
              <span
                className="text-[10px] uppercase tracking-[0.2em] mb-4 block"
                style={{ ...mono, color: "var(--accent-blue)" }}
              >
                Why Axia
              </span>
              <h2
                className="text-[clamp(24px,3.5vw,36px)] font-bold tracking-[-0.02em]"
                style={{ color: "var(--text-primary)" }}
              >
                Infrastructure that scales with your ambition
              </h2>
            </div>
          </Reveal>

          <div className="flex flex-col gap-24">
            {features.map((feat, i) => {
              const isReversed = i % 2 === 1;
              return (
                <Reveal key={feat.title} delay={0.1}>
                  <div
                    className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-12 md:gap-20`}
                  >
                    {/* Visual placeholder — styled dark panel */}
                    <div className="flex-1 w-full">
                      <div
                        className="relative w-full overflow-hidden"
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-primary)",
                          borderRadius: "var(--radius-md)",
                          aspectRatio: "16 / 10",
                        }}
                      >
                        {/* Grid overlay */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              "linear-gradient(var(--border-secondary) 1px, transparent 1px), linear-gradient(90deg, var(--border-secondary) 1px, transparent 1px)",
                            backgroundSize: "40px 40px",
                            opacity: 0.5,
                          }}
                        />
                        {/* Centered icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="w-16 h-16 flex items-center justify-center rounded-full"
                            style={{
                              background: "var(--accent-blue-muted)",
                              boxShadow:
                                "0 0 60px rgba(45,127,249,0.2), 0 0 120px rgba(45,127,249,0.05)",
                            }}
                          >
                            <feat.icon
                              size={28}
                              style={{ color: "var(--accent-blue)" }}
                              strokeWidth={1.5}
                            />
                          </div>
                        </div>
                        {/* Corner label */}
                        <div
                          className="absolute top-4 left-4 text-[9px] uppercase tracking-[0.12em] px-2 py-1"
                          style={{
                            ...mono,
                            color: "var(--text-tertiary)",
                            background: "var(--bg-tertiary)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-secondary)",
                          }}
                        >
                          {`0${i + 1} / 03`}
                        </div>
                      </div>
                    </div>

                    {/* Text content */}
                    <div className="flex-1 w-full">
                      <h3
                        className="text-[22px] font-bold mb-4 tracking-[-0.01em]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {feat.title}
                      </h3>
                      <p
                        className="text-[14px] leading-relaxed mb-6"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {feat.description}
                      </p>
                      <div className="flex flex-col gap-3">
                        {feat.bullets.map((bullet) => (
                          <div
                            key={bullet}
                            className="flex items-center gap-3"
                          >
                            <div
                              className="w-5 h-5 flex items-center justify-center rounded-full shrink-0"
                              style={{
                                background: "var(--accent-blue-muted)",
                              }}
                            >
                              <Check
                                size={11}
                                style={{ color: "var(--accent-blue)" }}
                                strokeWidth={2.5}
                              />
                            </div>
                            <span
                              className="text-[13px]"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {bullet}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. INTEGRATIONS ── */}
      <section
        className="py-28 px-6"
        style={{ borderTop: "1px solid var(--border-secondary)" }}
      >
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-14 text-center">
              <span
                className="text-[10px] uppercase tracking-[0.2em] mb-4 block"
                style={{ ...mono, color: "var(--accent-blue)" }}
              >
                Infrastructure
              </span>
              <h2
                className="text-[clamp(24px,3.5vw,36px)] font-bold tracking-[-0.02em]"
                style={{ color: "var(--text-primary)" }}
              >
                Built on the modern stack
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
              {stackLabels.map((label) => (
                <div
                  key={label}
                  className="px-5 py-3 text-[12px] tracking-[0.06em] transition-all duration-200"
                  style={{
                    ...mono,
                    color: "var(--text-secondary)",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-sm)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(45,127,249,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 7. PRICING ── */}
      <section
        id="pricing"
        className="py-32 px-6"
        style={{ borderTop: "1px solid var(--border-secondary)" }}
      >
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-16 text-center">
              <span
                className="text-[10px] uppercase tracking-[0.2em] mb-4 block"
                style={{ ...mono, color: "var(--accent-blue)" }}
              >
                Pricing
              </span>
              <h2
                className="text-[clamp(24px,3.5vw,36px)] font-bold tracking-[-0.02em]"
                style={{ color: "var(--text-primary)" }}
              >
                Scale on your terms
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 0.1}>
                <div
                  className="p-7 flex flex-col h-full transition-all duration-300 relative"
                  style={{
                    background: tier.featured
                      ? "var(--bg-tertiary)"
                      : "var(--bg-secondary)",
                    border: tier.featured
                      ? "1px solid rgba(45,127,249,0.5)"
                      : "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: tier.featured
                      ? "0 0 60px rgba(45,127,249,0.1), inset 0 1px 0 rgba(45,127,249,0.15)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!tier.featured) {
                      e.currentTarget.style.borderColor =
                        "rgba(45,127,249,0.3)";
                      e.currentTarget.style.boxShadow =
                        "0 0 30px rgba(45,127,249,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!tier.featured) {
                      e.currentTarget.style.borderColor =
                        "var(--border-primary)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  {tier.featured && (
                    <div
                      className="absolute -top-px left-1/2 -translate-x-1/2 px-4 py-1 text-[9px] uppercase tracking-[0.15em] font-semibold"
                      style={{
                        ...mono,
                        background: "var(--accent-blue)",
                        color: "#fff",
                        borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                      }}
                    >
                      Recommended
                    </div>
                  )}

                  <span
                    className="text-[10px] uppercase tracking-[0.15em] mb-5 block"
                    style={{
                      ...mono,
                      color: tier.featured
                        ? "var(--accent-blue)"
                        : "var(--text-tertiary)",
                    }}
                  >
                    {tier.name}
                  </span>

                  <div className="mb-2">
                    <span
                      className="text-[40px] font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span
                        className="text-[12px] ml-1"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {tier.period}
                      </span>
                    )}
                  </div>

                  <p
                    className="text-[13px] leading-relaxed mb-7"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {tier.description}
                  </p>

                  <div className="flex-1 mb-7">
                    {tier.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 mb-3"
                      >
                        <Check
                          size={13}
                          className="shrink-0 mt-0.5"
                          style={{
                            color: tier.featured
                              ? "var(--accent-blue)"
                              : "var(--text-tertiary)",
                          }}
                          strokeWidth={2}
                        />
                        <span
                          className="text-[13px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <a
                    href="#access"
                    className="block text-center text-[11px] uppercase tracking-[0.08em] font-semibold py-3 transition-all"
                    style={{
                      ...mono,
                      background: tier.featured
                        ? "var(--accent-blue)"
                        : "transparent",
                      color: tier.featured ? "#fff" : "var(--text-secondary)",
                      border: tier.featured
                        ? "1px solid var(--accent-blue)"
                        : "1px solid var(--border-primary)",
                      borderRadius: "var(--radius-sm)",
                      boxShadow: tier.featured
                        ? "0 0 25px rgba(45,127,249,0.25)"
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (tier.featured) {
                        e.currentTarget.style.background =
                          "var(--accent-blue-hover)";
                        e.currentTarget.style.boxShadow =
                          "0 0 35px rgba(45,127,249,0.35)";
                      } else {
                        e.currentTarget.style.borderColor =
                          "var(--accent-blue)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (tier.featured) {
                        e.currentTarget.style.background =
                          "var(--accent-blue)";
                        e.currentTarget.style.boxShadow =
                          "0 0 25px rgba(45,127,249,0.25)";
                      } else {
                        e.currentTarget.style.borderColor =
                          "var(--border-primary)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }
                    }}
                  >
                    {tier.cta}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CTA SECTION ── */}
      <section
        id="access"
        className="py-32 px-6 relative overflow-hidden"
        style={{ borderTop: "1px solid var(--border-secondary)" }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(45,127,249,0.08) 0%, transparent 65%)",
          }}
        />

        <Reveal>
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <Shield
              size={32}
              className="mx-auto mb-6"
              style={{ color: "var(--accent-blue)", opacity: 0.6 }}
              strokeWidth={1.5}
            />
            <h2
              className="text-[clamp(28px,4.5vw,44px)] font-bold tracking-[-0.02em] mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              READY TO TAKE CONTROL?
            </h2>
            <p
              className="text-[15px] mb-12 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Join teams consolidating their entire operation into a single
              command center.
            </p>

            {/* Email form */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto mb-6"
            >
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 w-full sm:w-auto px-4 py-3.5 text-[13px] outline-none transition-all"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  ...mono,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-blue)";
                  e.currentTarget.style.boxShadow =
                    "0 0 20px rgba(45,127,249,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[11px] uppercase tracking-[0.08em] font-semibold text-white transition-all shrink-0"
                style={{
                  ...mono,
                  background: "var(--accent-blue)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "0 0 30px rgba(45,127,249,0.3)",
                  border: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "var(--accent-blue-hover)";
                  e.currentTarget.style.boxShadow =
                    "0 0 40px rgba(45,127,249,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--accent-blue)";
                  e.currentTarget.style.boxShadow =
                    "0 0 30px rgba(45,127,249,0.3)";
                }}
              >
                Request Early Access
                <ArrowRight size={13} />
              </button>
            </form>

            <p
              className="text-[11px]"
              style={{ ...mono, color: "var(--text-tertiary)" }}
            >
              Join 500+ teams already on the waitlist
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── 9. FOOTER ── */}
      <footer
        className="py-16 px-6"
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-primary)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
            {/* Brand */}
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <AxiaLogo size={28} color="#0071E3" />
                <span
                  className="text-[12px] tracking-[0.2em] uppercase"
                  style={{ ...mono, color: "var(--text-secondary)" }}
                >
                  AXIA
                </span>
              </div>
              <p
                className="text-[12px] leading-relaxed mb-4 max-w-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Intelligence platform for modern business operations.
              </p>
              <div className="flex flex-col gap-1">
                <span
                  className="text-[11px]"
                  style={{ ...mono, color: "var(--text-tertiary)" }}
                >
                  Miami, FL
                </span>
                <span
                  className="text-[11px]"
                  style={{ ...mono, color: "var(--text-tertiary)" }}
                >
                  hello@axia.crm
                </span>
              </div>
            </div>

            {/* Columns */}
            {footerColumns.map((col) => (
              <div key={col.title}>
                <span
                  className="text-[10px] uppercase tracking-[0.15em] block mb-5"
                  style={{ ...mono, color: "var(--text-tertiary)" }}
                >
                  {col.title}
                </span>
                {col.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-[12px] mb-3 transition-colors"
                    style={{ ...mono, color: "var(--text-secondary)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--text-primary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-secondary)")
                    }
                  >
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ borderTop: "1px solid var(--border-primary)" }}
          >
            <p
              className="text-[10px] tracking-[0.06em]"
              style={{ ...mono, color: "var(--text-tertiary)" }}
            >
              &copy; 2026 Axia Technologies &middot; All rights reserved
            </p>
            <div className="flex items-center gap-6">
              {["Status", "Uptime", "API", "Changelog"].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-[10px] uppercase tracking-[0.08em] transition-colors"
                  style={{ ...mono, color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--text-secondary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-tertiary)")
                  }
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Contact anchor ── */}
      <div id="contact" />
    </div>
  );
}
