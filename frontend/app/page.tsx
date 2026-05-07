"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { n: "01", icon: "◎", title: "Upload Your Photo", desc: "Upload a clear full-body photo. Our AI maps your exact body shape, proportions, and skin tone with pixel-perfect precision." },
  { n: "02", icon: "⊹", title: "Choose an Outfit", desc: "Browse thousands of curated items from the world's top fashion retailers and build any combination you desire." },
  { n: "03", icon: "✦", title: "See the AI Result", desc: "A photorealistic preview rendered on your actual body — not a generic mannequin — in under 30 seconds." },
];

const FEATURES = [
  { icon: "◈", title: "Photorealistic Try-On", desc: "Results rendered on your actual body with full fabric texture, lighting physics, and natural drape simulation." },
  { icon: "◷", title: "Instant Results", desc: "Our proprietary pipeline returns a high-quality image in under 30 seconds, every single time." },
  { icon: "⊞", title: "Every Category", desc: "Tops, bottoms, dresses, shoes, bags, and accessories. Mix-and-match complete outfits effortlessly." },
  { icon: "⇄", title: "Unlimited Swaps", desc: "Swap any item instantly and compare looks side-by-side until you discover your perfect combination." },
  { icon: "◎", title: "95% Accuracy", desc: "State-of-the-art diffusion models preserve drape, fit, and proportion with over 95% measured accuracy." },
  { icon: "⊘", title: "Privacy by Design", desc: "Photos are encrypted end-to-end and automatically deleted when your session ends. Zero compromise." },
];

const LOGOS = [
  { name: "SHEIN", domain: "shein.com" },
  { name: "H&M", domain: "hm.com" },
  { name: "Zara", domain: "zara.com" },
  { name: "ASOS", domain: "asos.com" },
  { name: "Uniqlo", domain: "uniqlo.com" },
  { name: "Nike", domain: "nike.com" },
  { name: "Adidas", domain: "adidas.com" },
  { name: "Forever 21", domain: "forever21.com" },
];

const TESTIMONIALS = [
  { init: "SJ", name: "Sarah Johnson", role: "Fashion Blogger", text: "I tried on 20 outfits in the time it used to take me to choose one. The accuracy is genuinely remarkable — it looks exactly like me in the clothes." },
  { init: "MK", name: "Marcus Kim", role: "Style Consultant", text: "My clients arrive to sessions knowing exactly what works for them. It saves hours and consistently leads to better, more confident outcomes." },
  { init: "AL", name: "Aria Lee", role: "Lifestyle Creator", text: "It actually looks like me in the clothes — not some generic model. I've recommended Virtual Stylist to everyone I know." },
];

const FAQS = [
  { q: "How does virtual try-on work?", a: "Our generative AI maps the selected clothing item onto your uploaded photo, preserving your body shape, skin tone, and the fabric's texture and natural drape." },
  { q: "Is my photo data secure?", a: "Yes. Photos are encrypted in transit and at rest, used only to generate your result, and automatically deleted after your session ends." },
  { q: "What formats are supported?", a: "JPEG, PNG, and WebP up to 10 MB. For best results, use a well-lit full-body photo against a plain background." },
  { q: "How accurate are the results?", a: "Our model achieves over 95% accuracy for fit representation. Complex structured garments improve continuously with every model update." },
  { q: "Is there a mobile app?", a: "The web app is fully optimised for mobile. A native app is on our roadmap — sign up to be notified at launch." },
];

// ─── Hook: Intersection Observer ────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Reveal component ───────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push("/builder");
    else setLoading(false);
  }, [router]);

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 24);
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "#fff", animation: "spin 0.9s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", color: "#0a0a0a", overflowX: "hidden", fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif" }}>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .wrap { width: 100%; max-width: 1080px; margin: 0 auto; padding: 0 32px; }
        .wrap-narrow { width: 100%; max-width: 720px; margin: 0 auto; padding: 0 32px; }

        @media (max-width: 768px) {
          .wrap, .wrap-narrow { padding: 0 20px; }
          .hide-sm { display: none !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-4-stat { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-ctas { flex-direction: column !important; align-items: stretch !important; }
          .hero-ctas button { width: 100%; }
          .showcase-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
        @media (max-width: 520px) {
          .grid-4-stat { grid-template-columns: 1fr 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }

        /* Marquee */
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-track { display: flex; width: max-content; animation: marquee 28s linear infinite; }

        /* Bounce scroll cue */
        @keyframes nudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }

        /* Spin */
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Shimmer */
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }

        /* Pulse ring */
        @keyframes ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }

        /* Button */
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 15px 36px; border-radius: 100px; font-size: 15px; font-weight: 600;
          color: #fff; background: #0a0a0a; border: none; cursor: pointer;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          letter-spacing: -0.01em; white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.82; transform: scale(1.02); box-shadow: 0 8px 32px rgba(0,0,0,0.18); }

        .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 14px 32px; border-radius: 100px; font-size: 15px; font-weight: 500;
          color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14); cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.14); color: #fff; border-color: rgba(255,255,255,0.28); }

        .btn-secondary {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 14px 32px; border-radius: 100px; font-size: 15px; font-weight: 500;
          color: #0a0a0a; background: transparent;
          border: 1px solid rgba(0,0,0,0.15); cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .btn-secondary:hover { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.3); }

        /* Feature card */
        .feature-card {
          padding: 32px 30px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.06);
          background: #fff; transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .feature-card:hover { border-color: rgba(0,0,0,0.12); box-shadow: 0 12px 40px rgba(0,0,0,0.07); transform: translateY(-2px); }

        /* Step card */
        .step-card {
          padding: 44px 36px; border-right: 1px solid rgba(0,0,0,0.06);
          transition: background 0.2s;
        }
        .step-card:last-child { border-right: none; }
        .step-card:hover { background: rgba(0,0,0,0.015); }

        @media (max-width: 768px) {
          .step-card { border-right: none; border-bottom: 1px solid rgba(0,0,0,0.06); padding: 32px 24px; }
          .step-card:last-child { border-bottom: none; }
        }

        /* Testimonial card */
        .t-card {
          padding: 36px 32px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.06);
          background: #fff; display: flex; flex-direction: column; gap: 24px;
          transition: box-shadow 0.25s, transform 0.25s;
        }
        .t-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.08); transform: translateY(-3px); }

        /* Nav link */
        .nav-link {
          font-size: 14px; font-weight: 500; text-decoration: none;
          transition: color 0.15s; letter-spacing: -0.01em;
        }

        /* Divider */
        .divider { border: none; border-top: 1px solid rgba(0,0,0,0.06); margin: 0; }

        /* FAQ */
        .faq-item { border-bottom: 1px solid rgba(0,0,0,0.06); }
        .faq-item:first-child { border-top: 1px solid rgba(0,0,0,0.06); }

        /* Orb */
        .orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          filter: blur(80px); will-change: transform;
        }

        /* Stat border */
        .stat-item { padding: 32px 20px; text-align: center; }
        .stat-item + .stat-item { border-left: 1px solid rgba(255,255,255,0.06); }

        @media (max-width: 768px) {
          .stat-item + .stat-item { border-left: none; border-top: 1px solid rgba(255,255,255,0.06); }
        }

        /* Scroll progress line */
        #progress-line {
          position: fixed; top: 0; left: 0; height: 2px;
          background: linear-gradient(90deg, #a0a0a0, #333);
          z-index: 200; transition: width 0.1s linear;
        }

        /* Product showcase floating cards */
        .float-card {
          position: absolute; border-radius: 16px; background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.6);
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          padding: 16px 20px;
        }

        /* Glass pill */
        .glass-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 18px; border-radius: 100px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(12px);
          color: rgba(255,255,255,0.8);
          font-size: 13px; font-weight: 500; letter-spacing: 0.01em;
        }
      `}</style>

      {/* Scroll progress */}
      <div id="progress-line" style={{ width: `${Math.min(scrollY / (typeof document !== "undefined" ? (document.body.scrollHeight - window.innerHeight) : 1) * 100, 100)}%` }} />

      {/* ─────────────── NAV ─────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(250,250,250,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
        transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div className="wrap" style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: "#0a0a0a",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, color: "#fff", fontWeight: 700, letterSpacing: "-0.02em",
            }}>
              S
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: scrolled ? "#0a0a0a" : "#fff", letterSpacing: "-0.02em", transition: "color 0.3s" }}>
              Stylist
            </span>
          </Link>

          <nav className="hide-sm" style={{ display: "flex", gap: 40, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            {[["Features", "#features"], ["How it Works", "#how-it-works"], ["Pricing", "#pricing"], ["FAQ", "#faq"]].map(([l, h]) => (
              <a key={h} href={h} className="nav-link"
                style={{ color: scrolled ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.65)" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = scrolled ? "#0a0a0a" : "#fff")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = scrolled ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.65)")}>
                {l}
              </a>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => router.push("/login")}
              className="hide-sm"
              style={{
                padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                color: scrolled ? "#0a0a0a" : "rgba(255,255,255,0.75)",
                background: "transparent", border: `1px solid ${scrolled ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.2)"}`,
                cursor: "pointer", transition: "all 0.2s", letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = scrolled ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Sign in
            </button>
            <button
              onClick={() => router.push("/login")}
              style={{
                padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                color: scrolled ? "#fff" : "#0a0a0a",
                background: scrolled ? "#0a0a0a" : "#fff",
                border: "none", cursor: "pointer", transition: "all 0.25s",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              Try free
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────── HERO ─────────────── */}
      <section style={{
        minHeight: "100svh",
        background: "#0a0a0a",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Background orbs */}
        <div className="orb" style={{ width: 700, height: 700, top: "10%", left: "50%", marginLeft: -350, background: "radial-gradient(circle, rgba(180,180,180,0.08) 0%, transparent 70%)" }} />
        <div className="orb" style={{ width: 400, height: 400, top: "60%", left: "20%", background: "radial-gradient(circle, rgba(120,120,120,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="orb" style={{ width: 300, height: 300, top: "30%", right: "15%", background: "radial-gradient(circle, rgba(150,150,150,0.06) 0%, transparent 70%)", filter: "blur(50px)" }} />

        {/* Grain texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")", opacity: 0.4, pointerEvents: "none" }} />

        {/* Subtle grid lines */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />

        <div className="wrap" style={{ position: "relative", zIndex: 1, paddingTop: 120, paddingBottom: 120 }}>
          {/* Badge */}
          <div style={{ marginBottom: 36, animation: "fadeUp 0.8s ease both" }}>
            <span className="glass-pill">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px rgba(74,222,128,0.6)" }} />
              Now available — AI Virtual Try-On
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(48px, 7.5vw, 88px)",
            fontWeight: 800, color: "#ffffff",
            lineHeight: 1.02, letterSpacing: "-0.04em",
            marginBottom: 24, maxWidth: 860, margin: "0 auto 24px",
            animation: "fadeUp 0.8s ease 0.08s both",
          }}>
            Your wardrobe,
            <br />
            <span style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              reimagined by AI.
            </span>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "rgba(255,255,255,0.42)", lineHeight: 1.65,
            maxWidth: 460, margin: "0 auto 52px",
            fontWeight: 400, letterSpacing: "-0.01em",
            animation: "fadeUp 0.8s ease 0.16s both",
          }}>
            Upload your photo and see exactly how any outfit looks on your body — photorealistic, in under 30 seconds.
          </p>

          {/* CTAs */}
          <div className="hero-ctas" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 72, animation: "fadeUp 0.8s ease 0.24s both" }}>
            <button className="btn-primary" onClick={() => router.push("/login")}
              style={{ background: "#fff", color: "#0a0a0a", boxShadow: "0 0 0 0 rgba(255,255,255,0)", padding: "15px 36px" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 40px rgba(255,255,255,0.2)"; e.currentTarget.style.opacity = "0.92"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 0 0 rgba(255,255,255,0)"; e.currentTarget.style.opacity = "1"; }}
            >
              Start styling — it&apos;s free
            </button>
            <button className="btn-ghost"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
              See how it works ↓
            </button>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap", animation: "fadeUp 0.8s ease 0.32s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex" }}>
                {["SJ", "MK", "AL", "RB", "TW"].map((init, i) => (
                  <div key={init} style={{
                    width: 28, height: 28, borderRadius: "50%", fontSize: 10, fontWeight: 700,
                    color: "#fff", border: "2px solid #0a0a0a", marginLeft: i === 0 ? 0 : -8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `hsl(${200 + i * 30}, 30%, ${35 + i * 5}%)`,
                  }}>{init}</div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", letterSpacing: "-0.01em" }}>
                <strong style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>10,000+</strong> users styling smarter
              </span>
            </div>
            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.12)" }} className="hide-sm" />
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 20 20" fill="#fbbf24">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", marginLeft: 4 }}>4.9 / 5</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: "nudge 2.5s ease-in-out infinite" }}>
          <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.2))" }} />
        </div>

        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </section>

      {/* ─────────────── BRAND LOGOS ─────────────── */}
      <section style={{ padding: "40px 0", borderBottom: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", background: "#fafafa" }}>
        <p style={{ textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(0,0,0,0.3)", marginBottom: 28 }}>
          Compatible with leading fashion retailers
        </p>
        <div style={{ overflow: "hidden" }}>
          <div className="marquee-track">
            {[...LOGOS, ...LOGOS].map((logo, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "10px 32px", marginRight: 12, borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.06)", background: "#fff",
                whiteSpace: "nowrap", height: 52, minWidth: 120,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://logo.clearbit.com/${logo.domain}`}
                  alt={logo.name}
                  style={{ height: 20, width: "auto", maxWidth: 90, objectFit: "contain", filter: "grayscale(100%)", opacity: 0.45 }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const span = document.createElement("span");
                    span.textContent = logo.name;
                    span.style.cssText = "font-size:12px;font-weight:700;color:rgba(0,0,0,0.3);letter-spacing:0.06em";
                    e.currentTarget.parentElement?.appendChild(span);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── HOW IT WORKS ─────────────── */}
      <section id="how-it-works" style={{ padding: "120px 0", background: "#fafafa" }}>
        <div className="wrap">
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,0,0,0.35)", marginBottom: 18 }}>
                How It Works
              </p>
              <h2 style={{ fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, color: "#0a0a0a", maxWidth: 520, margin: "0 auto 18px" }}>
                Effortless from photo to outfit.
              </h2>
              <p style={{ fontSize: 17, color: "rgba(0,0,0,0.4)", lineHeight: 1.65, maxWidth: 400, margin: "0 auto" }}>
                Three simple steps. Photorealistic results every time.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "#fff", borderRadius: 24, border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.04)" }}>
              {STEPS.map((step, i) => (
                <div key={i} className="step-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(0,0,0,0.25)" }}>{step.n}</span>
                    <span style={{ fontSize: 22, color: "rgba(0,0,0,0.12)" }}>{step.icon}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.025em", marginBottom: 14, lineHeight: 1.25 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(0,0,0,0.45)", lineHeight: 1.75 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────── PRODUCT SHOWCASE ─────────────── */}
      <section style={{ background: "#0a0a0a", padding: "120px 0", position: "relative", overflow: "hidden" }}>
        <div className="orb" style={{ width: 600, height: 600, top: "50%", left: "50%", marginLeft: -300, marginTop: -300, background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />

        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="showcase-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <Reveal>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>
                  The Technology
                </p>
                <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, color: "#fff", marginBottom: 24 }}>
                  Diffusion AI that truly understands your body.
                </h2>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.38)", lineHeight: 1.75, marginBottom: 36 }}>
                  Our model doesn&apos;t paste clothes on top of your photo. It understands fabric physics, body contours, lighting conditions, and how garments naturally drape — producing results indistinguishable from a real fitting.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    ["95%+ accuracy", "Measured across 50,000 real try-on sessions"],
                    ["< 30 seconds", "From upload to photorealistic result"],
                    ["Every garment type", "Tops, bottoms, outerwear, shoes, bags & accessories"],
                  ].map(([stat, desc]) => (
                    <div key={stat} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: "-0.01em" }}>{stat}</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Visual: Floating UI mockup */}
            <Reveal delay={150}>
              <div style={{ position: "relative", height: 420 }}>
                {/* Main card */}
                <div style={{
                  position: "absolute", inset: 0,
                  borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
                  backdropFilter: "blur(10px)",
                }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
                      <path d="M16 8L24 12V20L16 24L8 20V12L16 8Z" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="rgba(255,255,255,0.02)" />
                      <circle cx="16" cy="16" r="3" fill="rgba(255,255,255,0.3)" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                    AI Processing
                  </p>
                  {/* Animated dots */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.15)", animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>

                {/* Floating accuracy badge */}
                <div className="float-card" style={{ top: -16, right: -16, minWidth: 140 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.5)" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Accuracy</span>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.03em" }}>95.2%</p>
                </div>

                {/* Floating speed badge */}
                <div className="float-card" style={{ bottom: -16, left: -16, minWidth: 140 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Result time</span>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.03em" }}>28s</p>
                </div>

                <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────────── FEATURES ─────────────── */}
      <section id="features" style={{ padding: "120px 0", background: "#fafafa" }}>
        <div className="wrap">
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,0,0,0.3)", marginBottom: 18 }}>
                Features
              </p>
              <h2 style={{ fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, color: "#0a0a0a", maxWidth: 480, margin: "0 auto" }}>
                Built for the way you actually shop.
              </h2>
            </div>
          </Reveal>

          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 50}>
                <div className="feature-card" style={{ height: "100%" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, fontSize: 16, color: "rgba(0,0,0,0.4)" }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.02em", marginBottom: 10, lineHeight: 1.3 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(0,0,0,0.45)", lineHeight: 1.75 }}>
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── STATS ─────────────── */}
      <section style={{ background: "#0a0a0a", padding: "80px 0" }}>
        <div className="wrap">
          <div className="grid-4-stat" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            {[
              { val: "10k+", label: "Active users" },
              { val: "95%", label: "Accuracy rate" },
              { val: "<30s", label: "Result time" },
              { val: "4.9", label: "Average rating" },
            ].map(({ val, label }, i) => (
              <div key={i} className="stat-item">
                <p style={{ fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>{val}</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", letterSpacing: "0.02em" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── TESTIMONIALS ─────────────── */}
      <section style={{ padding: "120px 0", background: "#fafafa" }}>
        <div className="wrap">
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,0,0,0.3)", marginBottom: 18 }}>
                Reviews
              </p>
              <h2 style={{ fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, color: "#0a0a0a" }}>
                People love it.
              </h2>
            </div>
          </Reveal>

          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="t-card">
                  <div style={{ display: "flex", gap: 3 }}>
                    {[0, 1, 2, 3, 4].map((s) => (
                      <svg key={s} width="12" height="12" viewBox="0 0 20 20" fill="#fbbf24">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p style={{ flex: 1, fontSize: 15, color: "rgba(0,0,0,0.65)", lineHeight: 1.75, letterSpacing: "-0.01em" }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#0a0a0a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                    }}>
                      {t.init}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.01em" }}>{t.name}</p>
                      <p style={{ fontSize: 12, color: "rgba(0,0,0,0.35)", marginTop: 1 }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ─────────────── FAQ ─────────────── */}
      <section id="faq" style={{ padding: "120px 0", background: "#fafafa" }}>
        <div className="wrap-narrow">
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,0,0,0.3)", marginBottom: 18 }}>
                FAQ
              </p>
              <h2 style={{ fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, color: "#0a0a0a" }}>
                Common questions.
              </h2>
            </div>
          </Reveal>

          <div>
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "22px 0", background: "none", border: "none", cursor: "pointer", gap: 20, textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#0a0a0a", lineHeight: 1.4, letterSpacing: "-0.02em" }}>{faq.q}</span>
                  <div style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
                    background: openFaq === i ? "#0a0a0a" : "rgba(0,0,0,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.22s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <line x1="5" y1="1" x2="5" y2="9" stroke={openFaq === i ? "#fff" : "#0a0a0a"} strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="1" y1="5" x2="9" y2="5" stroke={openFaq === i ? "#fff" : "#0a0a0a"} strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </div>
                </button>
                <div style={{
                  overflow: "hidden", maxHeight: openFaq === i ? "200px" : "0",
                  transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
                }}>
                  <p style={{ paddingBottom: 22, fontSize: 15, color: "rgba(0,0,0,0.45)", lineHeight: 1.75 }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── CTA ─────────────── */}
      <section id="pricing" style={{ background: "#0a0a0a", padding: "140px 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="orb" style={{ width: 500, height: 500, top: "50%", left: "50%", marginLeft: -250, marginTop: -250, background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)" }} />

        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <Reveal>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 24 }}>
              Get Started
            </p>
            <h2 style={{ fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#fff", marginBottom: 20, maxWidth: 600, margin: "0 auto 20px" }}>
              Try on your dream wardrobe today.
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.35)", lineHeight: 1.65, maxWidth: 380, margin: "0 auto 52px" }}>
              Join 10,000+ users who never buy without trying on virtually first. Free forever plan available.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
              <button
                className="btn-primary"
                onClick={() => router.push("/login")}
                style={{ background: "#fff", color: "#0a0a0a", padding: "16px 40px", fontSize: 16 }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(255,255,255,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                Start for free →
              </button>
              <button className="btn-ghost" style={{ padding: "16px 36px", fontSize: 15 }}>
                View pricing
              </button>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.18)", letterSpacing: "-0.01em" }}>
              No credit card required
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer id="contact" style={{ background: "#060606", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="wrap" style={{ padding: "64px 32px 40px" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1.5fr", gap: 48, marginBottom: 56 }}>

            {/* Brand */}
            <div>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#0a0a0a" }}>
                  S
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#fff", letterSpacing: "-0.02em" }}>Virtual Stylist</span>
              </Link>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.7, marginBottom: 24, maxWidth: 240 }}>
                AI-powered virtual try-on. Shop smarter, style better.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {["𝕏", "◉", "◈", "◎"].map((icon, i) => (
                  <div key={i} style={{
                    width: 30, height: 30, borderRadius: 7,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, cursor: "pointer", transition: "all 0.2s", color: "rgba(255,255,255,0.3)",
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"; }}>
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 20 }}>Product</p>
              {["Features", "How it Works", "Pricing", "Changelog"].map((item) => (
                <a key={item} href="#" style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "none", marginBottom: 12, transition: "color 0.15s", letterSpacing: "-0.01em" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)")}>
                  {item}
                </a>
              ))}
            </div>

            {/* Company */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 20 }}>Company</p>
              {["About", "Privacy Policy", "Terms", "Support"].map((item) => (
                <a key={item} href="#" style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "none", marginBottom: 12, transition: "color 0.15s", letterSpacing: "-0.01em" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)")}>
                  {item}
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 20 }}>Stay updated</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.65, marginBottom: 16 }}>
                Style tips and product updates, once a week.
              </p>
              <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  style={{
                    padding: "11px 16px", borderRadius: 10, fontSize: 13,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff", outline: "none", transition: "border-color 0.2s",
                    letterSpacing: "-0.01em",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <button
                  type="submit"
                  style={{
                    padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    color: "#0a0a0a", background: "#fff", border: "none", cursor: "pointer",
                    transition: "opacity 0.2s", letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div style={{ paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", letterSpacing: "-0.01em" }}>
              © {new Date().getFullYear()} Virtual Stylist. All rights reserved.
            </p>
            <div style={{ display: "flex", gap: 24 }}>
              {["Privacy", "Terms", "Cookies"].map((item) => (
                <a key={item} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", textDecoration: "none", transition: "color 0.15s", letterSpacing: "-0.01em" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.45)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.15)")}>
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
