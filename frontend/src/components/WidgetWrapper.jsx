import { Box } from "@mui/material";
import { styled } from "@mui/system";

/**
 * WidgetWrapper — glass-card shell matching the SocialCard post theme.
 *
 * Dark mode  → dark navy glass  (#0d1117 @ 80% opacity, white/10 border)
 * Light mode → white frost glass (white @ 85% opacity, slate-200 border)
 *
 * backdrop-filter blur is applied via sx prop on usage; here we use a
 * CSS variable trick through the theme palette to stay inside styled().
 */
const WidgetWrapper = styled(Box)(({ theme }) => {
  const isDark = theme.palette.mode === "dark";
  return {
    padding: "1.5rem 1.5rem 0.75rem 1.5rem",
    borderRadius: "1rem",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    transition: "all 0.3s ease",

    // Dark: deep navy translucent glass
    // Light: frosted white glass
    backgroundColor: isDark
      ? "rgba(13, 17, 23, 0.82)"
      : "rgba(255, 255, 255, 0.82)",

    border: isDark
      ? "1px solid rgba(255, 255, 255, 0.08)"
      : "1px solid rgba(100, 116, 139, 0.18)",

    boxShadow: isDark
      ? "0 4px 32px rgba(0, 0, 0, 0.45)"
      : "0 4px 24px rgba(100, 116, 139, 0.12)",
  };
});

export default WidgetWrapper;