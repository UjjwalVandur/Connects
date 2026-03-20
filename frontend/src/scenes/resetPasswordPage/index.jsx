import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CanvasRevealEffect from "components/ui/CanvasRevealEffect";
import API_BASE_URL from "config";

const S = {
  page: {
    minHeight: "100vh", width: "100%", backgroundColor: "#000",
    position: "relative", display: "flex", flexDirection: "column",
    overflow: "hidden", fontFamily: "'Inter','Rubik','Segoe UI',sans-serif",
  },
  canvas: { position: "absolute", inset: 0, zIndex: 0 },
  overlay: {
    position: "absolute", inset: 0,
    background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
  },
  topFade: {
    position: "absolute", top: 0, left: 0, right: 0, height: "120px",
    background: "linear-gradient(to bottom, #000 0%, transparent 100%)",
  },
  content: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px 16px 48px", position: "relative", zIndex: 10,
  },
  card: {
    width: "100%", maxWidth: "440px", borderRadius: "28px",
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    padding: "36px 32px", boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
  },
  logo: {
    fontSize: "1.1rem", fontWeight: 900, background: "linear-gradient(90deg,#00e5ff,#0077ff)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    marginBottom: "24px", display: "block",
  },
  title: {
    fontSize: "1.8rem", fontWeight: 900, color: "#fff",
    letterSpacing: "-0.5px", marginBottom: "6px",
  },
  sub: { fontSize: "0.9rem", color: "rgba(255,255,255,0.45)", marginBottom: "28px" },
  label: { display: "block", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "6px" },
  input: {
    width: "100%", padding: "12px 16px", borderRadius: "12px", border: "none",
    background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: "0.95rem",
    outline: "none", boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    transition: "border-color 0.2s",
  },
  btn: (disabled) => ({
    width: "100%", padding: "14px", borderRadius: "999px", border: "none",
    background: disabled ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#00e5ff,#0077ff)",
    color: disabled ? "rgba(255,255,255,0.4)" : "#000",
    fontWeight: 700, fontSize: "0.95rem", cursor: disabled ? "not-allowed" : "pointer",
    marginTop: "20px", boxShadow: disabled ? "none" : "0 0 24px rgba(0,229,255,0.25)",
    transition: "all 0.2s",
  }),
};

const ResetPasswordPage = () => {
  const [params]      = useSearchParams();
  const navigate      = useNavigate();
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [status,      setStatus]      = useState("idle"); // idle | loading | success | error
  const [msg,         setMsg]         = useState("");

  const token = params.get("token");
  const email = params.get("email");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMsg("Invalid or missing reset link. Please request a new one.");
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setMsg("Password must be at least 6 characters.");
    if (password !== confirm) return setMsg("Passwords do not match.");
    setStatus("loading");
    setMsg("");

    try {
      const res  = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMsg(data.message);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setStatus("error");
        setMsg(data.message || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  };

  return (
    <div style={S.page}>
      <div style={S.canvas}>
        <CanvasRevealEffect colors={[[0, 229, 255], [0, 119, 255], [120, 80, 240]]} dotSize={2} spacing={20} speed={0.9} />
        <div style={S.overlay} />
        <div style={S.topFade} />
      </div>

      <div style={S.content}>
        <div style={S.card}>
          <span style={S.logo}>✦ Connects</span>
          <h1 style={S.title}>Set new password</h1>
          <p style={S.sub}>Your new password must be at least 6 characters.</p>

          {status === "success" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✅</div>
              <p style={{ color: "#4ade80", fontWeight: 600, marginBottom: "8px" }}>{msg}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={S.label}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  style={S.input}
                  required
                />
              </div>
              <div>
                <label style={S.label}>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  style={S.input}
                  required
                />
              </div>

              {msg && (
                <div style={{
                  marginTop: "14px", padding: "10px 16px", borderRadius: "12px",
                  background: status === "error" ? "rgba(239,68,68,0.12)" : "rgba(0,229,255,0.1)",
                  border: `1px solid ${status === "error" ? "rgba(239,68,68,0.3)" : "rgba(0,229,255,0.3)"}`,
                  color: status === "error" ? "#f87171" : "#67e8f9",
                  fontSize: "0.85rem", textAlign: "center",
                }}>
                  {msg}
                </div>
              )}

              <button type="submit" disabled={status === "loading" || status === "error" && !token} style={S.btn(status === "loading")}>
                {status === "loading" ? "Resetting…" : "Reset Password →"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{ marginTop: "14px", width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", cursor: "pointer" }}
              >
                ← Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
