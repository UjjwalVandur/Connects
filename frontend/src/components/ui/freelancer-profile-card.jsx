import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, Users, Eye, FileText, Link, Check } from "lucide-react";

import { cn } from "lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";

// ── Preset gradient options for the banner ────────────────────
const GRADIENTS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#00D5FA,#0077FF)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#f77062,#fe5196)",
  "linear-gradient(135deg,#c471f5,#12c2e9)",
  "linear-gradient(135deg,#30cfd0,#667eea)",
];

// ── Card animation variants ───────────────────────────────────
const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  hover:   { scale: 1.02, transition: { duration: 0.25 } },
};

const contentVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const panelVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, height: 0, transition: { duration: 0.2 } },
};

/**
 * FreelancerProfileCard — enhanced with:
 *  • Pencil button → opens edit panel (gradient picker + tool links)
 *  • Real stats: posts · friends · views
 *  • No bottom action button (removed)
 */
export const FreelancerProfileCard = React.forwardRef(
  (
    {
      className,
      name,
      title,
      avatarSrc,
      bannerGradient,        // controlled from widget via localStorage
      onBannerChange,        // (gradient: string) => void
      posts,
      friends,
      views,
      toolLinks,             // [{label, url}] — max 2
      onToolLinksChange,     // ([{label, url}]) => void
      isOwner = true,        // false = view-only (no pencil, shows Visit Profile btn)
      onVisitProfile,        // () => void — shown when isOwner is false
      isDark,
      ...props
    },
    ref
  ) => {
    const [editOpen, setEditOpen] = React.useState(false);
    const [localLinks, setLocalLinks] = React.useState(toolLinks || [{label:"Link 1",url:""},{label:"Link 2",url:""}]);

    // Sync from parent when toolLinks prop changes (e.g. localStorage load)
    React.useEffect(() => {
      if (toolLinks) setLocalLinks(toolLinks);
    }, [JSON.stringify(toolLinks)]); // eslint-disable-line

    const avatarName = name
      ? name.split(" ").map((n) => n[0]).join("")
      : "?";

    // ── Theme tokens ──────────────────────────────────────────
    const cardBg       = isDark ? "rgba(13,17,23,0.85)"           : "rgba(255,255,255,0.85)";
    const cardBorder   = isDark ? "rgba(255,255,255,0.09)"         : "rgba(100,116,139,0.15)";
    const textPrimary  = isDark ? "#ffffff"                        : "#0f172a";
    const textMuted    = isDark ? "rgba(255,255,255,0.55)"         : "#64748b";
    const statsBg      = isDark ? "rgba(255,255,255,0.05)"         : "rgba(0,0,0,0.03)";
    const statsBorder  = isDark ? "rgba(255,255,255,0.08)"         : "rgba(100,116,139,0.12)";
    const editBtnBg    = isDark ? "rgba(255,255,255,0.12)"         : "rgba(0,0,0,0.08)";
    const panelBg      = isDark ? "rgba(10,12,18,0.95)"            : "rgba(245,247,255,0.97)";
    const inputBg      = isDark ? "rgba(255,255,255,0.06)"         : "rgba(0,0,0,0.04)";
    const inputBorder  = isDark ? "rgba(255,255,255,0.12)"         : "rgba(100,116,139,0.25)";
    const divColor     = isDark ? "rgba(255,255,255,0.08)"         : "rgba(0,0,0,0.07)";

    const handleLinkChange = (idx, field, val) => {
      const next = localLinks.map((l, i) => i === idx ? { ...l, [field]: val } : l);
      setLocalLinks(next);
    };

    const saveLinks = () => {
      onToolLinksChange?.(localLinks);
      setEditOpen(false);
    };

    return (
      <motion.div
        ref={ref}
        className={cn("relative w-full overflow-hidden rounded-2xl", className)}
        style={{
          background: cardBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${cardBorder}`,
          boxShadow: isDark ? "0 24px 48px rgba(0,0,0,0.5)" : "0 12px 32px rgba(0,0,0,0.1)",
        }}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        {...props}
      >
        {/* ── Banner ─────────────────────────────────────────── */}
        <div
          className="h-32 w-full"
          style={{ background: bannerGradient || GRADIENTS[1] }}
        />

        {/* ── Pencil (Edit) Button — owner only ───────────────── */}
        {isOwner && (
          <button
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:scale-110"
            style={{
              background: editBtnBg,
              backdropFilter: "blur(8px)",
              border: `1px solid ${cardBorder}`,
              color: textMuted,
            }}
            onClick={() => setEditOpen((v) => !v)}
            aria-label={editOpen ? "Close edit" : "Edit card"}
          >
            {editOpen ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </button>
        )}

        {/* ── Avatar (overlaps banner) ────────────────────────── */}
        <div
          className="absolute left-1/2"
          style={{ top: "128px", transform: "translate(-50%, -50%)" }}
        >
          <Avatar
            className="h-20 w-20"
            style={{
              border: `4px solid ${cardBg}`,
              boxShadow: "0 4px 16px rgba(0,213,250,0.25)",
              borderRadius: "50%",
            }}
          >
            <AvatarImage
              src={avatarSrc}
              alt={name}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
            <AvatarFallback
              style={{
                background: "linear-gradient(135deg,#00D5FA,#0077FF)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.1rem",
                borderRadius: "50%",
              }}
            >
              {avatarName}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* ── Edit Panel ──────────────────────────────────────── */}
        <AnimatePresence>
          {editOpen && (
            <motion.div
              key="edit-panel"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                background: panelBg,
                borderBottom: `1px solid ${cardBorder}`,
                overflow: "hidden",
              }}
            >
              <div className="px-5 pt-3 pb-4">
                {/* Gradient picker */}
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: textMuted }}>
                  Banner Style
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {GRADIENTS.map((g, i) => (
                    <button
                      key={i}
                      title={`Gradient ${i + 1}`}
                      className="h-7 w-7 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        background: g,
                        borderColor: bannerGradient === g ? "#00D5FA" : "transparent",
                        boxShadow: bannerGradient === g ? "0 0 0 2px #00D5FA" : "none",
                      }}
                      onClick={() => onBannerChange?.(g)}
                    />
                  ))}
                </div>

                {/* Tool link editor */}
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: textMuted }}>
                  Tool Links
                </p>
                <div className="flex flex-col gap-2 mb-3">
                  {localLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Link className="h-3.5 w-3.5 shrink-0" style={{ color: "#00D5FA" }} />
                      <input
                        type="text"
                        placeholder={`Label (e.g. GitHub)`}
                        value={link.label}
                        onChange={(e) => handleLinkChange(idx, "label", e.target.value)}
                        className="w-24 rounded-md px-2 py-1 text-xs outline-none"
                        style={{
                          background: inputBg,
                          border: `1px solid ${inputBorder}`,
                          color: textPrimary,
                        }}
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                        className="flex-1 rounded-md px-2 py-1 text-xs outline-none"
                        style={{
                          background: inputBg,
                          border: `1px solid ${inputBorder}`,
                          color: textPrimary,
                        }}
                      />
                    </div>
                  ))}
                </div>

                <button
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#00D5FA,#0077FF)" }}
                  onClick={saveLinks}
                >
                  <Check className="h-3.5 w-3.5" /> Save
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content Area ─────────────────────────────────────── */}
        <motion.div className="px-5 pb-5 pt-12" variants={contentVariants}>
          {/* Name + Title + Tool Icons */}
          <motion.div className="mb-4 flex items-start justify-between" variants={itemVariants}>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: textPrimary }}>
                {name}
              </h2>
              <p className="text-sm" style={{ color: textMuted }}>
                {title}
              </p>
            </div>
            {/* Tool link pills */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex gap-1.5">
                {localLinks.filter((l) => l.url).map((link, i) => (
                  <a
                    key={i}
                    href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noreferrer"
                    title={link.label || link.url}
                    className="flex h-7 w-7 items-center justify-center rounded-md transition-all hover:scale-110"
                    style={{
                      background: isDark ? "rgba(0,213,250,0.15)" : "rgba(0,160,188,0.12)",
                      border: isDark ? "1px solid rgba(0,213,250,0.2)" : "1px solid rgba(0,160,188,0.2)",
                    }}
                  >
                    <Link className="h-3.5 w-3.5" style={{ color: isDark ? "#00D5FA" : "#00A0BC" }} />
                  </a>
                ))}
                {localLinks.filter((l) => l.url).length === 0 && (
                  <span className="text-xs" style={{ color: textMuted }}>—</span>
                )}
              </div>
              <span className="text-xs" style={{ color: textMuted }}>Links</span>
            </div>
          </motion.div>

          {/* Stats: Posts · Friends · Views */}
          <motion.div
            className="my-4 flex items-center justify-around rounded-xl p-4"
            style={{ background: statsBg, border: `1px solid ${statsBorder}` }}
            variants={itemVariants}
          >
            <StatItem icon={FileText} value={posts ?? 0} label="posts"   textPrimary={textPrimary} textMuted={textMuted} />
            <Divider dividerColor={divColor} />
            <StatItem icon={Users}    value={friends ?? 0} label="friends" textPrimary={textPrimary} textMuted={textMuted} />
            <Divider dividerColor={divColor} />
            <StatItem icon={Eye}      value={views ?? 0}   label="views"   textPrimary={textPrimary} textMuted={textMuted} />
          </motion.div>

          {/* Visit Profile button — only for non-owners (hover popover view) */}
          {!isOwner && onVisitProfile && (
            <motion.div variants={itemVariants}>
              <button
                className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#00A0BC,#00D5FA)",
                  boxShadow: "0 4px 15px rgba(0,213,250,0.35)",
                }}
                onClick={onVisitProfile}
              >
                {/* Shimmer sweep on hover */}
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/20 transition-transform duration-500 group-hover:translate-x-[200%]"
                />
                Visit Profile →
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }
);

FreelancerProfileCard.displayName = "FreelancerProfileCard";

// ── StatItem ──────────────────────────────────────────────────
const StatItem = ({ icon: Icon, value, label, textPrimary, textMuted }) => (
  <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
    <div className="flex items-center gap-1">
      {Icon && <Icon className="h-3.5 w-3.5" style={{ color: "#00D5FA" }} />}
      <span className="text-base font-semibold" style={{ color: textPrimary }}>
        {typeof value === "number" && value >= 1000
          ? `${(value / 1000).toFixed(1)}k`
          : value}
      </span>
    </div>
    <span className="text-xs capitalize" style={{ color: textMuted }}>{label}</span>
  </div>
);

// ── Divider ───────────────────────────────────────────────────
const Divider = ({ dividerColor }) => (
  <div className="h-10 w-px" style={{ background: dividerColor }} />
);

export default FreelancerProfileCard;
