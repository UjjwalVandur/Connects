import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box,
} from "@mui/material";
import API_BASE_URL from "config";

/**
 * AdCardStack — card-stack display for Sponsored Ads.
 * Props:
 *   ads      — array of ad objects from the API
 *   isDark   — boolean from Redux mode
 *   onDelete — (adId) => void
 *   myUserId — logged-in user id
 */
export function AdCardStack({ ads, isDark, onDelete, myUserId }) {
  const [cards, setCards] = useState(ads);

  // Sync internal cards state with external ads prop (fixes real-time deletion)
  useEffect(() => {
    setCards(ads);
  }, [ads]);

  const [showInfoIdx, setShowInfoIdx] = useState(null);
  const [modalAd, setModalAd] = useState(null);
  const [dragDirection, setDragDirection] = useState(null);
  const autoScrollRef = useRef(null);
  const isHoveringRef = useRef(false);

  const dragY = useMotionValue(0);
  const rotateX = useTransform(dragY, [-200, 0, 200], [12, 0, -12]);

  const OFFSET = 9;
  const SCALE_STEP = 0.055;
  const DIM_STEP = 0.14;
  const SWIPE_THRESHOLD = 50;
  const spring = { type: "spring", stiffness: 180, damping: 28 };

  const moveToEnd = useCallback(() => setCards((p) => [...p.slice(1), p[0]]), []);

  /* ── Auto-scroll every 10 seconds (pauses on hover) ── */
  useEffect(() => {
    autoScrollRef.current = setInterval(() => {
      if (!isHoveringRef.current) {
        moveToEnd();
      }
    }, 10000);
    return () => clearInterval(autoScrollRef.current);
  }, [moveToEnd]);

  const handleDragEnd = (_, info) => {
    const { y } = info.offset;
    const { y: vy } = info.velocity;
    if (Math.abs(y) > SWIPE_THRESHOLD || Math.abs(vy) > 500) {
      setDragDirection(y < 0 ? "up" : "down");
      setTimeout(() => {
        if (y < 0) moveToEnd();
        else setCards((p) => [p[p.length - 1], ...p.slice(0, -1)]);
        setDragDirection(null);
      }, 140);
    }
    dragY.set(0);
  };

  /* ── Colour tokens ── */
  const cardBg   = isDark ? "rgba(13,17,23,0.92)"      : "rgba(255,255,255,0.92)";
  const cardBdr  = isDark ? "rgba(255,255,255,0.09)"   : "rgba(100,116,139,0.2)";
  const shadow   = isDark ? "0 24px 48px rgba(0,0,0,0.55)" : "0 16px 36px rgba(0,0,0,0.12)";
  const shadowBk = isDark ? "0 10px 24px rgba(0,0,0,0.3)"  : "0 8px 20px rgba(0,0,0,0.06)";
  const textPri  = isDark ? "#ffffff"                   : "#0f172a";
  const textSec  = isDark ? "rgba(255,255,255,0.55)"    : "#64748b";
  const badgeBg  = isDark ? "rgba(0,213,250,0.15)"      : "rgba(0,160,188,0.1)";
  const badgeClr = isDark ? "#00d5fa"                   : "#006b7d";
  const overlayBg = isDark
    ? "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)"
    : "linear-gradient(to top, rgba(255,255,255,0.93) 0%, transparent 100%)";
  const btnBg    = isDark ? "rgba(0,213,250,0.18)"      : "rgba(0,160,188,0.12)";
  const btnClr   = isDark ? "#00d5fa"                   : "#006b7d";
  const btnHover = isDark ? "rgba(0,213,250,0.28)"      : "rgba(0,160,188,0.22)";

  /* MUI Dialog paper style — matches glass card theme */
  const dialogPaper = {
    borderRadius: "20px",
    background: isDark ? "rgba(13,17,23,0.97)" : "rgba(255,255,255,0.98)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1.5px solid ${cardBdr}`,
    boxShadow: shadow,
    overflow: "hidden",
    color: textPri,
    maxWidth: 480,
    width: "100%",
  };

  const CARD_W = 280;
  const CARD_H = 180;

  if (!cards.length) return null;

  return (
    <>
      {/* ── Card stack ─────────────────────────────────────── */}
      <div style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H + OFFSET * Math.min(cards.length - 1, 4),
        margin: "0 auto",
      }}>
        <ul style={{ position: "relative", width: "100%", height: CARD_H, margin: 0, padding: 0 }}>
          {cards.map((ad, i) => {
            const isFront = i === 0;
            const brightness = Math.max(0.35, 1 - i * DIM_STEP);
            const mediaUrl = ad.mediaPath ? `${API_BASE_URL}/assets/${ad.mediaPath}` : null;
            const isVideo = ad.mediaType === "video";
            const isMyAd = String(ad.userId) === String(myUserId);
            const isHovered = showInfoIdx === ad._id;

            return (
              <motion.li
                key={ad._id}
                style={{
                  position: "absolute", width: "100%", height: CARD_H,
                  listStyle: "none", borderRadius: 14, overflow: "hidden",
                  cursor: isFront ? "grab" : "auto", touchAction: "none",
                  backgroundColor: cardBg, backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  border: `1.5px solid ${cardBdr}`,
                  rotateX: isFront ? rotateX : 0, transformPerspective: 1000,
                  boxShadow: isFront ? shadow : shadowBk,
                }}
                animate={{
                  top: `${i * -OFFSET}px`,
                  scale: 1 - i * SCALE_STEP,
                  filter: `brightness(${brightness})`,
                  zIndex: cards.length - i,
                  opacity: dragDirection && isFront ? 0 : 1,
                }}
                transition={spring}
                drag={isFront ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.65}
                onDrag={(_, info) => { if (isFront) dragY.set(info.offset.y); }}
                onDragEnd={handleDragEnd}
                whileDrag={isFront ? { zIndex: cards.length + 1, cursor: "grabbing", scale: 1.04 } : {}}
                onHoverStart={() => {
                  if (isFront) {
                    setShowInfoIdx(ad._id);
                    isHoveringRef.current = true;
                  }
                }}
                onHoverEnd={() => {
                  setShowInfoIdx(null);
                  isHoveringRef.current = false;
                }}
              >
                {/* Media */}
                {mediaUrl && !isVideo && (
                  <img src={mediaUrl} alt={ad.title} draggable={false}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none", userSelect: "none" }} />
                )}
                {mediaUrl && isVideo && (
                  <video src={mediaUrl} muted loop playsInline autoPlay={isFront}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                )}
                {!mediaUrl && (
                  <div style={{
                    width: "100%", height: "100%", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: isDark
                      ? "linear-gradient(135deg,#0d1117,#1a2332)"
                      : "linear-gradient(135deg,#e0f2fe,#f0f9ff)",
                  }}>
                    <span style={{ fontSize: 40 }}>📣</span>
                  </div>
                )}

                {/* Hover overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isFront && isHovered ? 1 : 0 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    position: "absolute", inset: 0, background: overlayBg,
                    display: "flex", flexDirection: "column", justifyContent: "flex-end",
                    padding: "16px 18px", // Increased padding
                    pointerEvents: isFront && isHovered ? "auto" : "none",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 12, left: 12,
                    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.6px",
                    textTransform: "uppercase", padding: "3px 10px", borderRadius: 999,
                    background: badgeBg, color: badgeClr,
                  }}>Sponsored</span>

                  {isMyAd && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(ad._id); }}
                      style={{
                        position: "absolute", top: 10, right: 10,
                        background: "rgba(239,68,68,0.18)", border: "none", borderRadius: "50%",
                        width: 28, height: 28, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#ef4444", fontSize: 15, transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.3)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                      title="Delete this ad"
                    >
                      ✕
                    </button>
                  )}

                  <p style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 700, color: textPri }}>{ad.title}</p>
                  {ad.description && (
                    <p style={{ margin: "0 0 12px", fontSize: "0.8rem", color: textSec, lineHeight: 1.5 }}>
                      {ad.description.length > 70 ? ad.description.slice(0, 70) + "…" : ad.description}
                    </p>
                  )}
                  <p style={{ margin: "0 0 14px", fontSize: "0.75rem", color: textSec }}>By {ad.firstName} {ad.lastName}</p>

                  <button
                    onClick={(e) => { e.stopPropagation(); setModalAd(ad); }}
                    style={{
                      background: btnBg, color: btnClr, border: `1px solid ${btnClr}40`,
                      borderRadius: 999, padding: "5px 14px",
                      fontSize: "0.72rem", fontWeight: 700,
                      cursor: "pointer", letterSpacing: "0.3px", alignSelf: "flex-start",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = btnHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = btnBg; }}
                  >Read More →</button>
                </motion.div>
              </motion.li>
            );
          })}
        </ul>

        {/* Swipe hint + auto-scroll indicator */}
        <p style={{
          textAlign: "center", marginTop: OFFSET * Math.min(cards.length, 4) + 8,
          fontSize: "0.65rem", color: textSec, letterSpacing: "0.3px",
        }}>
          ↕ Drag · auto-scrolls every 10s · {cards.length} ad{cards.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Read More MUI Dialog ── mirrors Create Ad dialog style ── */}
      <Dialog
        open={Boolean(modalAd)}
        onClose={() => setModalAd(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogPaper }}
        BackdropProps={{ sx: { backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.55)" } }}
      >
        {modalAd && (
          <>
            {/* Media */}
            {modalAd.mediaPath && modalAd.mediaType !== "video" && (
              <Box sx={{ lineHeight: 0 }}>
                <img src={`${API_BASE_URL}/assets/${modalAd.mediaPath}`} alt={modalAd.title}
                  style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
              </Box>
            )}
            {modalAd.mediaPath && modalAd.mediaType === "video" && (
              <Box sx={{ lineHeight: 0 }}>
                <video src={`${API_BASE_URL}/assets/${modalAd.mediaPath}`} controls
                  style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
              </Box>
            )}
            {!modalAd.mediaPath && (
              <Box sx={{
                height: 100, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 48,
                background: isDark
                  ? "linear-gradient(135deg,#0d1117,#1a2332)"
                  : "linear-gradient(135deg,#e0f2fe,#f0f9ff)",
              }}>📣</Box>
            )}

            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", color: textPri, pb: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.6px",
                    textTransform: "uppercase", padding: "2px 8px", borderRadius: 999,
                    background: badgeBg, color: badgeClr, marginRight: 8,
                  }}>Sponsored</span>
                  {modalAd.title}
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: "0.75rem !important", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {modalAd.description && (
                <Typography sx={{ fontSize: "0.9rem", color: textSec, lineHeight: 1.65 }}>
                  {modalAd.description}
                </Typography>
              )}
              <Typography sx={{ fontSize: "0.78rem", color: textSec }}>
                Promoted by{" "}
                <strong style={{ color: textPri }}>{modalAd.firstName} {modalAd.lastName}</strong>
              </Typography>
              {modalAd.link && (
                <Typography
                  sx={{ fontSize: "0.78rem", color: badgeClr, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                  onClick={() => window.open(
                    modalAd.link.startsWith("http") ? modalAd.link : `https://${modalAd.link}`, "_blank"
                  )}
                >
                  {modalAd.link}
                </Typography>
              )}
            </DialogContent>

            <DialogActions sx={{ px: "1.5rem", pb: "1.5rem", gap: 1 }}>
              {modalAd.link && (
                <Button
                  variant="contained"
                  startIcon={<ExternalLink size={14} />}
                  onClick={() => window.open(
                    modalAd.link.startsWith("http") ? modalAd.link : `https://${modalAd.link}`, "_blank"
                  )}
                  sx={{
                    borderRadius: 8, px: "1.5rem",
                    backgroundColor: badgeClr, color: isDark ? "#000" : "#fff",
                    "&:hover": { opacity: 0.85 },
                  }}
                >
                  Visit Website
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => setModalAd(null)}
                sx={{
                  borderRadius: 8,
                  borderColor: cardBdr,
                  color: textSec,
                  "&:hover": { borderColor: textSec, background: "transparent" },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
