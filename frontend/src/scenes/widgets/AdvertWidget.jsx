import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, useTheme, Chip, Avatar,
  CircularProgress, Tooltip,
} from "@mui/material";
import {
  AddOutlined, DeleteOutlined, OpenInNewOutlined,
  CampaignOutlined, EditOutlined,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { useSelector } from "react-redux";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { AdCardStack } from "components/ui/ad-card-stack";
import API_BASE_URL from "config";
import { HelpOutlineOutlined } from "@mui/icons-material";

/* ── Help / Guidelines Dialog ────────────────────────────── */
const HelpDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
        Ad Creation Guidelines
      </DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Typography variant="body2" color="text.secondary">
          Welcome to Sponsored Ads! Please review the following guidelines to ensure your ad is approved and performs well:
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0, opacity: 0.8, fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <li><strong>Keep it relevant:</strong> Ensure your ad targets the right audience and aligns with Connects community standards.</li>
          <li><strong>High-Quality Media:</strong> Use high-resolution images or videos. Avoid blurry or pixelated media.</li>
          <li><strong>Clear Call-to-Action:</strong> Provide a valid URL so users can easily visit your product or service.</li>
          <li><strong>No Offensive Content:</strong> Ads containing hate speech, sensitive content, or misleading information will be swiftly removed.</li>
          <li><strong>Accurate Descriptions:</strong> Be honest about what you are promoting. Misleading descriptions are strictly prohibited.</li>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: "1rem" }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 8 }}>
          Understood
        </Button>
      </DialogActions>
    </Dialog>
  );
};


/* ── Create Ad Dialog ─────────────────────────────────────── */
const CreateAdDialog = ({ open, onClose, token, userId, onSaved }) => {
  const { palette } = useTheme();
  const mode = useSelector((s) => s.mode);
  const isDark = mode === "dark";

  /* Glass card colour tokens */
  const paperBg  = isDark ? "rgba(13,17,23,0.97)"       : "rgba(255,255,255,0.97)";
  const paperBdr = isDark ? "rgba(255,255,255,0.09)"    : "rgba(100,116,139,0.2)";
  const textPri  = isDark ? "#ffffff"                    : "#0f172a";
  const textSec  = isDark ? "rgba(255,255,255,0.6)"     : "#64748b";
  const inputBg  = isDark ? "rgba(255,255,255,0.06)"    : "rgba(0,0,0,0.03)";
  const inputClr = isDark ? "#ffffff"                    : "#0f172a";
  const labelClr = isDark ? "rgba(255,255,255,0.55)"    : "#64748b";
  const shadow   = isDark ? "0 24px 48px rgba(0,0,0,0.55)" : "0 16px 36px rgba(0,0,0,0.12)";
  const dropzoneBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)";

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: inputBg,
      color: inputClr,
      "& fieldset": { borderColor: paperBdr },
      "&:hover fieldset": { borderColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)" },
      "&.Mui-focused fieldset": { borderColor: palette.primary.main },
    },
    "& .MuiInputLabel-root": { color: labelClr },
    "& .MuiInputLabel-root.Mui-focused": { color: palette.primary.main },
    "& .MuiInputBase-inputMultiline": { color: inputClr },
  };

  const [title,       setTitle]   = useState("");
  const [description, setDesc]    = useState("");
  const [link,        setLink]    = useState("");
  const [mediaFile,   setFile]    = useState(null);
  const [preview,     setPreview] = useState(null);
  const [saving,      setSaving]  = useState(false);
  const [helpOpen,    setHelpOpen] = useState(false);

  const reset = () => { setTitle(""); setDesc(""); setLink(""); setFile(null); setPreview(null); };

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
    multiple: false,
  });

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("title",       title);
    fd.append("description", description);
    fd.append("link",        link);
    if (mediaFile) fd.append("media", mediaFile);
    const res = await fetch(`${API_BASE_URL}/ads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    setSaving(false);
    reset();
    onSaved(data);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={() => { reset(); onClose(); }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          background: paperBg,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1.5px solid ${paperBdr}`,
          boxShadow: shadow,
          color: textPri,
        },
      }}
      BackdropProps={{ sx: { backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.5)" } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", color: textPri }}>
        <FlexBetween>
          <Box display="flex" alignItems="center" gap="0.5rem">
            <CampaignOutlined color="primary" />
            Create Sponsored Ad
          </Box>
          <Tooltip title="View Ad Guidelines">
            <IconButton size="small" onClick={() => setHelpOpen(true)} sx={{ color: textSec }}>
              <HelpOutlineOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </FlexBetween>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "0.9rem", pt: "0.5rem !important" }}>
        <TextField label="Ad Title *" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" sx={fieldSx} />
        <TextField label="Description" value={description} onChange={(e) => setDesc(e.target.value)} fullWidth size="small" multiline rows={3} sx={fieldSx} />
        <TextField label="Product / Service URL" value={link} onChange={(e) => setLink(e.target.value)} fullWidth size="small" placeholder="https://your-website.com" sx={fieldSx} />
        <Box
          {...getRootProps()}
          sx={{
            border: `2px dashed ${isDragActive ? palette.primary.main : paperBdr}`,
            borderRadius: "12px", p: "1.2rem",
            textAlign: "center", cursor: "pointer",
            backgroundColor: isDragActive ? palette.primary.main + "18" : dropzoneBg,
            transition: "all 0.2s",
          }}
        >
          <input {...getInputProps()} />
          {preview ? (
            mediaFile?.type?.startsWith("video") ? (
              <video src={preview} style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 8 }} controls />
            ) : (
              <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 8, objectFit: "cover" }} />
            )
          ) : (
            <Typography sx={{ fontSize: "0.85rem", color: textSec }}>
              📸 Drag & drop a photo or video, or click to select
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: "1.5rem", pb: "1.5rem" }}>
        <Button
          onClick={() => { reset(); onClose(); }}
          variant="outlined"
          sx={{ borderRadius: 8, borderColor: paperBdr, color: textSec, "&:hover": { borderColor: textSec } }}
        >Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={!title.trim() || saving}
          variant="contained"
          sx={{ borderRadius: 8, px: "1.5rem" }}
        >
          {saving ? <CircularProgress size={18} /> : "Publish Ad"}
        </Button>
      </DialogActions>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Dialog>
  );
};

/* ── Main AdvertWidget ─────────────────────────────────────── */
const AdvertWidget = () => {
  const { palette } = useTheme();
  const dark   = palette.neutral.dark;
  const main   = palette.neutral.main;
  const medium = palette.neutral.medium;
  const token          = useSelector((s) => s.token);
  const loggedInUserId = useSelector((s) => s.user._id);
  const mode           = useSelector((s) => s.mode);
  const isDark         = mode === "dark";

  const [ads,        setAds]      = useState([]);
  const [index,      setIndex]    = useState(0);
  const [loaded,     setLoaded]   = useState(false);
  const [dialogOpen, setOpen]     = useState(false);

  const fetchAds = async () => {
    setLoaded(false);
    // Fetch all ads
    const res  = await fetch(`${API_BASE_URL}/ads/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Mine first, then random to fill the widget with variety
    const res2 = await fetch(`${API_BASE_URL}/ads/random`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mine   = await res.json();
    const randomAds = await res2.json();

    // Combine: all mine + the random ads (dedup by id)
    const combined = Array.isArray(mine) ? [...mine] : [];
    if (Array.isArray(randomAds)) {
      randomAds.forEach((rAd) => {
        if (!combined.find((a) => a._id === rAd._id)) {
          combined.push(rAd);
        }
      });
    } else if (randomAds && !combined.find((a) => a._id === randomAds._id)) {
      combined.push(randomAds);
    }
    setAds(combined);
    setLoaded(true);
  };

  useEffect(() => { fetchAds(); }, []); // eslint-disable-line

  const handleDelete = async (adId) => {
    await fetch(`${API_BASE_URL}/ads/${adId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setAds((prev) => {
      const updated = prev.filter((a) => a._id !== adId);
      setIndex((i) => Math.min(i, Math.max(0, updated.length - 1)));
      return updated;
    });
  };

  const handleAdSaved = (newAd) => {
    setAds((prev) => [newAd, ...prev]);
    setIndex(0);
  };


  return (
    <>
      <WidgetWrapper>
        {/* Header */}
        <FlexBetween mb="0.5rem">
          <Typography color={dark} variant="h5" fontWeight="500">Sponsored</Typography>
          <Tooltip title="Create a new sponsored ad (your previous ads are kept!)">
            <Chip
              icon={<AddOutlined />}
              label="Create Ad"
              onClick={() => setOpen(true)}
              size="small"
              clickable
              sx={{ fontWeight: 600, cursor: "pointer", bgcolor: palette.primary.light + "33", color: palette.primary.dark }}
            />
          </Tooltip>
        </FlexBetween>

        {!loaded && (
          <Box display="flex" justifyContent="center" py="2rem"><CircularProgress size={26} /></Box>
        )}

        {loaded && !ads.length && (
          <Box textAlign="center" py="1.5rem">
            <Typography color={medium} fontSize="0.85rem" mb="0.75rem">
              No sponsored ads yet. Be the first to promote!
            </Typography>
            <Button size="small" variant="contained" startIcon={<CampaignOutlined />} onClick={() => setOpen(true)} sx={{ borderRadius: 8 }}>
              Create Ad
            </Button>
          </Box>
        )}

        {loaded && ads.length > 0 && (
          <Box mt="1rem" mb="0.5rem">
            <AdCardStack
              ads={ads}
              isDark={isDark}
              myUserId={loggedInUserId}
              onDelete={handleDelete}
            />
          </Box>
        )}
      </WidgetWrapper>

      <CreateAdDialog
        open={dialogOpen}
        onClose={() => setOpen(false)}
        token={token}
        userId={loggedInUserId}
        onSaved={handleAdSaved}
      />
    </>
  );
};

export default AdvertWidget;