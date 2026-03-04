import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Form from "./Form";
import CanvasRevealEffect from "components/ui/CanvasRevealEffect";

/* ── inline style tokens ── */
const S = {
  page: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#000",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'Inter','Rubik','Segoe UI',sans-serif",
  },
  canvasWrap: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
  },
  radialOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
  },
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "120px",
    background: "linear-gradient(to bottom, #000 0%, transparent 100%)",
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "120px",
    background: "linear-gradient(to top, #000 0%, transparent 100%)",
  },
  nav: {
    position: "relative",
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 32px",
  },
  logo: {
    fontSize: "1.25rem",
    fontWeight: 900,
    background: "linear-gradient(90deg,#00e5ff,#0077ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    cursor: "pointer",
    border: "none",
    background: "none",
  },
  backBtn: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.45)",
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "color 0.2s",
  },
  content: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px 48px",
    position: "relative",
    zIndex: 10,
  },
  cardWrap: {
    width: "100%",
    maxWidth: "440px",
  },
  card: {
    borderRadius: "28px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    padding: "36px 32px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
  },
  cardTitle: {
    fontSize: "2rem",
    fontWeight: 900,
    letterSpacing: "-1px",
    color: "#fff",
    marginBottom: "6px",
    textAlign: "center",
  },
  cardSub: {
    fontSize: "0.95rem",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    marginBottom: "28px",
  },
  tabBar: {
    display: "flex",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "4px",
    gap: "4px",
    marginBottom: "28px",
  },
  tab: (active) => ({
    flex: 1,
    padding: "8px 0",
    fontSize: "0.875rem",
    fontWeight: 600,
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.25s ease",
    background: active ? "#fff" : "transparent",
    color: active ? "#000" : "rgba(255,255,255,0.45)",
    boxShadow: active ? "0 2px 12px rgba(0,0,0,0.3)" : "none",
  }),
  disclaimer: {
    textAlign: "center",
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.2)",
    marginTop: "20px",
    lineHeight: 1.6,
  },
  link: {
    textDecoration: "underline",
    cursor: "pointer",
    transition: "color 0.2s",
    color: "inherit",
  },
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [pageType, setPageType] = useState("login");

  return (
    <div style={S.page}>
      {/* Canvas background */}
      <div style={S.canvasWrap}>
        <CanvasRevealEffect
          colors={[[0, 229, 255], [0, 119, 255], [120, 80, 240]]}
          dotSize={2}
          spacing={20}
          speed={0.9}
        />
        <div style={S.radialOverlay} />
        <div style={S.topFade} />
        <div style={S.bottomFade} />
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        <button
          style={S.backBtn}
          onClick={() => navigate("/")}
        >
          <span style={{
            fontSize: "1.1rem",
            fontWeight: 900,
            background: "linear-gradient(90deg,#00e5ff,#0077ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>✦ Connects</span>
        </button>
        <button
          style={S.backBtn}
          onMouseEnter={(e) => (e.target.style.color = "rgba(255,255,255,0.8)")}
          onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.45)")}
          onClick={() => navigate("/")}
        >
          ← Back to home
        </button>
      </nav>

      {/* Main Content */}
      <div style={S.content}>
        <div style={S.cardWrap}>

          {/* Glass Card */}
          <div style={S.card}>

            {/* Header */}
            <h1 style={S.cardTitle}>
              {pageType === "login" ? "Welcome back" : "Join Connects"}
            </h1>
            <p style={S.cardSub}>
              {pageType === "login"
                ? "Sign in to your account"
                : "Create your free account today"}
            </p>

            {/* Tab Switcher */}
            <div style={S.tabBar}>
              <button style={S.tab(pageType === "login")} onClick={() => setPageType("login")}>
                Sign In
              </button>
              <button style={S.tab(pageType === "register")} onClick={() => setPageType("register")}>
                Sign Up
              </button>
            </div>

            {/* Animated Form */}
            <AnimatePresence mode="wait">
              <motion.div
                key={pageType}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Form pageType={pageType} setPageType={setPageType} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Disclaimer */}
          <p style={S.disclaimer}>
            By continuing you agree to our{" "}
            <span style={S.link}>Terms of Service</span>
            {" & "}
            <span style={S.link}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
