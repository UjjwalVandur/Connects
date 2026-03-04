import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useAnimation, useInView } from "framer-motion";
import { ContainerScroll } from "components/ui/ContainerScrollAnimation";

/* ─── tiny reusable fade-in wrapper ─── */
const FadeIn = ({ children, delay = 0, y = 40 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

/* ─── feature card data ─── */
const features = [
  {
    icon: "🌐",
    title: "Connect Globally",
    desc: "Build meaningful relationships with people from every corner of the world. Your network, your way.",
  },
  {
    icon: "💬",
    title: "Real-Time Chat",
    desc: "Seamless messaging with voice notes, images, and attachments—all in one beautiful interface.",
  },
  {
    icon: "✨",
    title: "Curated Feed",
    desc: "A smart, personalized feed that surfaces the posts and people that matter most to you.",
  },
  {
    icon: "🔒",
    title: "Privacy First",
    desc: "Your data stays yours. End-to-end security baked into every interaction on Connects.",
  },
  {
    icon: "🚀",
    title: "Lightning Fast",
    desc: "Optimized from the ground up for speed. No lag, no waiting—just smooth, instant interactions.",
  },
  {
    icon: "🎯",
    title: "Sponsored Ads",
    desc: "Reach the right audience with precision-targeted sponsored posts and promotional content.",
  },
];

/* ─── styles ─── */
const S = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#010101",
    color: "#ffffff",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflowX: "hidden",
  },
  /* NAV */
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 5%",
    height: "64px",
    background: "rgba(1,1,1,0.7)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(0,229,255,0.08)",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: 800,
    background: "linear-gradient(90deg,#00e5ff,#0077ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.5px",
    cursor: "pointer",
  },
  navLinks: { display: "flex", gap: "1rem", alignItems: "center" },
  navBtn: (primary) => ({
    padding: "0.45rem 1.2rem",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    border: primary ? "none" : "1px solid rgba(0,229,255,0.4)",
    background: primary
      ? "linear-gradient(135deg,#00e5ff,#0077ff)"
      : "transparent",
    color: primary ? "#000" : "#00e5ff",
    transition: "all 0.2s ease",
  }),
  /* HERO */
  hero: {
    paddingTop: "64px",
    textAlign: "center",
  },
  badge: {
    display: "inline-block",
    padding: "0.35rem 1rem",
    borderRadius: "999px",
    border: "1px solid rgba(0,229,255,0.3)",
    background: "rgba(0,229,255,0.07)",
    color: "#00e5ff",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.5px",
    marginBottom: "1.5rem",
  },
  h1: {
    fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
    fontWeight: 900,
    lineHeight: 1.05,
    letterSpacing: "-2px",
    margin: "0 auto 1.5rem",
    maxWidth: "900px",
  },
  gradient: {
    background: "linear-gradient(135deg,#00e5ff 0%,#0077ff 60%,#a855f7 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtext: {
    fontSize: "clamp(1rem, 2vw, 1.25rem)",
    color: "rgba(255,255,255,0.55)",
    maxWidth: "560px",
    margin: "0 auto 2.5rem",
    lineHeight: 1.7,
  },
  heroBtns: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "0.5rem",
  },
  ctaPrimary: {
    padding: "0.9rem 2.2rem",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#00e5ff,#0077ff)",
    color: "#000",
    fontWeight: 700,
    fontSize: "1rem",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 0 30px rgba(0,229,255,0.35)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  ctaSecondary: {
    padding: "0.9rem 2.2rem",
    borderRadius: "12px",
    background: "transparent",
    color: "#fff",
    fontWeight: 600,
    fontSize: "1rem",
    border: "1px solid rgba(255,255,255,0.15)",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
  },
  /* MOCK SCREEN (inside scroll card) */
  mockScreen: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg,#050c1a 0%,#0a0a0a 100%)",
    display: "flex",
    flexDirection: "column",
    padding: "16px",
    gap: "12px",
  },
  mockBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  mockDot: (c) => ({
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: c,
  }),
  mockTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#00e5ff",
    fontWeight: 700,
  },
  mockContent: {
    display: "flex",
    gap: "12px",
    flex: 1,
    overflow: "hidden",
  },
  mockSidebar: {
    width: "200px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  mockFeed: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  mockCard: (h) => ({
    height: h,
    borderRadius: "10px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "12px",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
  }),
  mockAvatar: (color) => ({
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
  mockLines: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    paddingTop: "4px",
  },
  mockLine: (w, op) => ({
    height: "8px",
    borderRadius: "4px",
    background: `rgba(255,255,255,${op})`,
    width: w,
  }),
  mockImg: {
    height: "80px",
    borderRadius: "8px",
    background: "linear-gradient(135deg,rgba(0,229,255,0.15),rgba(0,119,255,0.1))",
    marginTop: "8px",
  },
  /* FEATURES */
  features: {
    padding: "6rem 5%",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  sectionLabel: {
    textAlign: "center",
    color: "#00e5ff",
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "1rem",
  },
  sectionTitle: {
    textAlign: "center",
    fontSize: "clamp(1.8rem, 4vw, 3rem)",
    fontWeight: 800,
    letterSpacing: "-1px",
    marginBottom: "1rem",
  },
  sectionSub: {
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: "1.05rem",
    maxWidth: "500px",
    margin: "0 auto 4rem",
    lineHeight: 1.7,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  featureCard: {
    padding: "1.8rem",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    transition: "border-color 0.3s, background 0.3s, transform 0.3s",
    cursor: "default",
  },
  featureIcon: {
    fontSize: "2rem",
    marginBottom: "1rem",
    display: "block",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "rgba(0,229,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
    color: "#fff",
  },
  featureDesc: {
    fontSize: "0.9rem",
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.65,
  },
  /* CTA BANNER */
  ctaBanner: {
    margin: "2rem 5% 6rem",
    borderRadius: "28px",
    padding: "4rem 2rem",
    textAlign: "center",
    background:
      "linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(0,119,255,0.1) 50%, rgba(168,85,247,0.08) 100%)",
    border: "1px solid rgba(0,229,255,0.15)",
    position: "relative",
    overflow: "hidden",
  },
  ctaBannerGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    width: "600px",
    height: "200px",
    background: "radial-gradient(ellipse,rgba(0,229,255,0.12) 0%,transparent 70%)",
    pointerEvents: "none",
  },
  ctaBannerTitle: {
    fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
    fontWeight: 800,
    letterSpacing: "-1px",
    marginBottom: "1rem",
    position: "relative",
  },
  ctaBannerSub: {
    color: "rgba(255,255,255,0.5)",
    marginBottom: "2rem",
    fontSize: "1.05rem",
    position: "relative",
  },
  /* FOOTER */
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    padding: "2rem 5%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
  },
  footerText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: "0.85rem",
  },
};

/* ─── mock app preview ─── */
const MockAppPreview = () => (
  <div style={S.mockScreen}>
    <div style={S.mockBar}>
      <div style={S.mockDot("#FF5F57")} />
      <div style={S.mockDot("#FFBD2E")} />
      <div style={S.mockDot("#28CA40")} />
      <div style={S.mockTitle}>✦ Connects — Social Feed</div>
    </div>
    <div style={S.mockContent}>
      {/* sidebar */}
      <div style={S.mockSidebar}>
        <div style={{ ...S.mockCard("90px"), flexDirection: "column", alignItems: "center" }}>
          <div style={S.mockAvatar("linear-gradient(135deg,#00e5ff,#0077ff)")} />
          <div style={{ ...S.mockLine("70%", 0.5), marginTop: "8px" }} />
          <div style={{ ...S.mockLine("50%", 0.3), marginTop: "4px" }} />
        </div>
        {["Friends", "Messages", "Notifications"].map((label) => (
          <div
            key={label}
            style={{
              height: "34px",
              borderRadius: "8px",
              background: label === "Messages" ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.03)",
              border: label === "Messages" ? "1px solid rgba(0,229,255,0.25)" : "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              paddingLeft: "12px",
              fontSize: "0.75rem",
              color: label === "Messages" ? "#00e5ff" : "rgba(255,255,255,0.4)",
              fontWeight: 600,
            }}
          >
            {label}
          </div>
        ))}
      </div>
      {/* feed */}
      <div style={S.mockFeed}>
        {[
          { color: "linear-gradient(135deg,#a855f7,#ec4899)", hasImg: true },
          { color: "linear-gradient(135deg,#00e5ff,#0077ff)", hasImg: false },
        ].map(({ color, hasImg }, i) => (
          <div key={i} style={S.mockCard("auto")}>
            <div style={S.mockAvatar(color)} />
            <div style={{ ...S.mockLines, width: "100%" }}>
              <div style={S.mockLine("55%", 0.6)} />
              <div style={S.mockLine("80%", 0.25)} />
              <div style={S.mockLine("65%", 0.25)} />
              {hasImg && <div style={S.mockImg} />}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                {["❤️ 124", "💬 32", "🔁 18"].map((r) => (
                  <span
                    key={r}
                    style={{
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.35)",
                      background: "rgba(255,255,255,0.04)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── main landing page ─── */
const LandingPage = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = React.useState(null);
  const [hoverBtn, setHoverBtn] = React.useState(null);

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <span style={S.logo}>✦ Connects</span>
        <div style={S.navLinks}>
          <button
            style={S.navBtn(false)}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "rgba(0,229,255,0.8)";
              e.target.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(0,229,255,0.4)";
              e.target.style.color = "#00e5ff";
            }}
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
          <button
            style={S.navBtn(true)}
            onMouseEnter={(e) => {
              e.target.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = "1";
            }}
            onClick={() => navigate("/login")}
          >
            Get Started →
          </button>
        </div>
      </nav>

      {/* HERO + SCROLL ANIMATION */}
      <section style={S.hero}>
        <ContainerScroll
          titleComponent={
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span style={S.badge}>✦ Now in Public Beta</span>
              </motion.div>

              <motion.h1
                style={S.h1}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                The social network{" "}
                <span style={S.gradient}>built for real connections</span>
              </motion.h1>

              <motion.p
                style={S.subtext}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 }}
              >
                Chat, share, discover, and grow — Connects brings people together
                with a feed that actually feels personal.
              </motion.p>

              <motion.div
                style={S.heroBtns}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                <button
                  style={S.ctaPrimary}
                  onClick={() => navigate("/login")}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 0 45px rgba(0,229,255,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 0 30px rgba(0,229,255,0.35)";
                  }}
                >
                  Join for free — it's quick ✦
                </button>
                <button
                  style={S.ctaSecondary}
                  onClick={() => navigate("/login")}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.4)";
                    e.target.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.15)";
                    e.target.style.color = "#fff";
                  }}
                >
                  Sign in →
                </button>
              </motion.div>
            </div>
          }
        >
          <MockAppPreview />
        </ContainerScroll>
      </section>

      {/* FEATURES */}
      <section style={S.features}>
        <FadeIn>
          <p style={S.sectionLabel}>Everything you need</p>
          <h2 style={S.sectionTitle}>
            A platform that <span style={S.gradient}>grows with you</span>
          </h2>
          <p style={S.sectionSub}>
            From real-time messaging to curated feeds, Connects has every tool to
            keep you plugged in.
          </p>
        </FadeIn>

        <div style={S.grid}>
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.08}>
              <div
                style={{
                  ...S.featureCard,
                  ...(hoveredCard === i
                    ? {
                        borderColor: "rgba(0,229,255,0.25)",
                        background: "rgba(0,229,255,0.05)",
                        transform: "translateY(-4px)",
                      }
                    : {}),
                }}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={S.featureIcon}>{f.icon}</div>
                <p style={S.featureTitle}>{f.title}</p>
                <p style={S.featureDesc}>{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <FadeIn>
        <div style={{ padding: "0 5%" }}>
          <div style={S.ctaBanner}>
            <div style={S.ctaBannerGlow} />
            <h2 style={S.ctaBannerTitle}>
              Ready to <span style={S.gradient}>Connect</span>?
            </h2>
            <p style={S.ctaBannerSub}>
              Join thousands of people already using Connects every day.
            </p>
            <button
              style={{
                ...S.ctaPrimary,
                padding: "1rem 2.8rem",
                fontSize: "1.05rem",
                position: "relative",
              }}
              onClick={() => navigate("/login")}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 0 45px rgba(0,229,255,0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 0 30px rgba(0,229,255,0.35)";
              }}
            >
              Create your account →
            </button>
          </div>
        </div>
      </FadeIn>

      {/* FOOTER */}
      <footer style={S.footer}>
        <span style={S.logo}>✦ Connects</span>
        <span style={S.footerText}>
          © {new Date().getFullYear()} Connects · Built with ❤️
        </span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {["Privacy", "Terms", "Support"].map((l) => (
            <span
              key={l}
              style={{ ...S.footerText, cursor: "pointer" }}
              onMouseEnter={(e) => (e.target.style.color = "#00e5ff")}
              onMouseLeave={(e) =>
                (e.target.style.color = "rgba(255,255,255,0.3)")
              }
            >
              {l}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
