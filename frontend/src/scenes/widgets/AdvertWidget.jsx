import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, useTheme, Chip, Avatar,
  CircularProgress, Tooltip,
} from "@mui/material";
import {
  AddOutlined, DeleteOutlined, OpenInNewOutlined,
  CampaignOutlined, EditOutlined, ArrowBackIos, ArrowForwardIos,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { useSelector } from "react-redux";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
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
    <Dialog open={open} onClose={() => { reset(); onClose(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
        <FlexBetween>
          <Box display="flex" alignItems="center" gap="0.5rem">
            <CampaignOutlined color="primary" />
            Create Sponsored Ad
          </Box>
          <Tooltip title="View Ad Guidelines">
            <IconButton size="small" onClick={() => setHelpOpen(true)}>
              <HelpOutlineOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </FlexBetween>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "0.9rem", pt: "0.5rem !important" }}>
        <TextField label="Ad Title *" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" />
        <TextField label="Description" value={description} onChange={(e) => setDesc(e.target.value)} fullWidth size="small" multiline rows={3} />
        <TextField label="Product / Service URL" value={link} onChange={(e) => setLink(e.target.value)} fullWidth size="small" placeholder="https://your-website.com" />
        <Box
          {...getRootProps()}
          sx={{
            border: `2px dashed ${isDragActive ? palette.primary.main : palette.neutral.medium}`,
            borderRadius: "12px", p: "1.2rem",
            textAlign: "center", cursor: "pointer",
            backgroundColor: isDragActive ? palette.primary.light + "22" : palette.neutral.light,
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
            <Typography color={palette.neutral.medium} fontSize="0.85rem">
              📸 Drag & drop a photo or video, or click to select
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: "1.5rem", pb: "1.5rem" }}>
        <Button onClick={() => { reset(); onClose(); }} variant="outlined" sx={{ borderRadius: 8 }}>Cancel</Button>
        <Button onClick={handleSave} disabled={!title.trim() || saving} variant="contained" sx={{ borderRadius: 8, px: "1.5rem" }}>
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

  const ad       = ads[index];
  const isMyAd   = ad && String(ad.userId) === String(loggedInUserId);
  const mediaUrl = ad?.mediaPath ? `${API_BASE_URL}/assets/${ad.mediaPath}` : null;
  const isVideo  = ad?.mediaType === "video";

  return (
    <>
      <WidgetWrapper>
        {/* Header */}
        <FlexBetween mb="0.5rem">
          <Typography color={dark} variant="h5" fontWeight="500">Sponsored</Typography>
          <Box display="flex" alignItems="center" gap="0.5rem">
            {ads.length > 1 && (
              <>
                <IconButton size="small" onClick={() => setIndex((i) => (i - 1 + ads.length) % ads.length)}>
                  <ArrowBackIos sx={{ fontSize: 14 }} />
                </IconButton>
                <Typography fontSize="0.75rem" color={medium}>{index + 1}/{ads.length}</Typography>
                <IconButton size="small" onClick={() => setIndex((i) => (i + 1) % ads.length)}>
                  <ArrowForwardIos sx={{ fontSize: 14 }} />
                </IconButton>
              </>
            )}
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
          </Box>
        </FlexBetween>

        {!loaded && (
          <Box display="flex" justifyContent="center" py="2rem"><CircularProgress size={26} /></Box>
        )}

        {loaded && !ad && (
          <Box textAlign="center" py="1.5rem">
            <Typography color={medium} fontSize="0.85rem" mb="0.75rem">
              No sponsored ads yet. Be the first to promote!
            </Typography>
            <Button size="small" variant="contained" startIcon={<CampaignOutlined />} onClick={() => setOpen(true)} sx={{ borderRadius: 8 }}>
              Create Ad
            </Button>
          </Box>
        )}

        {loaded && ad && (
          <>
            {/* Media */}
            {isVideo && mediaUrl ? (
              <video src={mediaUrl} controls style={{ width: "100%", borderRadius: "0.75rem", margin: "0.75rem 0", maxHeight: 240, objectFit: "cover" }} />
            ) : mediaUrl ? (
              <img width="100%" alt="advert" src={mediaUrl} style={{ borderRadius: "0.75rem", margin: "0.75rem 0", maxHeight: 240, objectFit: "cover", display: "block" }} />
            ) : (
              <Box sx={{ borderRadius: "0.75rem", my: "0.75rem", height: 90, bgcolor: palette.neutral.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CampaignOutlined sx={{ fontSize: 36, color: palette.neutral.medium }} />
              </Box>
            )}

            {/* Ad info row */}
            <FlexBetween>
              <Box display="flex" alignItems="center" gap="0.5rem">
                <Avatar src={ad.picturePath ? `${API_BASE_URL}/assets/${ad.picturePath}` : undefined} sx={{ width: 26, height: 26, fontSize: "0.72rem" }}>
                  {ad.firstName?.[0]}
                </Avatar>
                <Typography color={main} fontWeight="700" fontSize="0.9rem">
                  {ad.title}
                </Typography>
              </Box>
              <Box display="flex">
                {isMyAd && (
                  <Tooltip title="Delete this ad">
                    <IconButton size="small" color="error" onClick={() => handleDelete(ad._id)}>
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {ad.link && (
                  <Tooltip title="Visit website">
                    <IconButton size="small" onClick={() => window.open(ad.link.startsWith("http") ? ad.link : `https://${ad.link}`, "_blank")}>
                      <OpenInNewOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </FlexBetween>

            {ad.link && (
              <Typography color="primary" fontSize="0.77rem"
                sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                onClick={() => window.open(ad.link.startsWith("http") ? ad.link : `https://${ad.link}`, "_blank")}
              >
                {ad.link}
              </Typography>
            )}
            {ad.description && (
              <Typography color={medium} fontSize="0.85rem" mt="0.3rem">{ad.description}</Typography>
            )}
            <Typography color={medium} fontSize="0.7rem" mt="0.4rem">
              Promoted by {ad.firstName} {ad.lastName}
            </Typography>
          </>
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