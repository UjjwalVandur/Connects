import {
  ManageAccountsOutlined,
  LocationOnOutlined,
  WorkOutlineOutlined,
  AddOutlined,
  DeleteOutlined,
  SaveOutlined,
  LinkOutlined,
  Twitter,
  LinkedIn,
  GitHub,
  Instagram,
  YouTube,
  Language,
} from "@mui/icons-material";
import {
  Box, Typography, Divider, useTheme, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "config";

const PLATFORM_OPTIONS = [
  { key: "Twitter",   label: "Twitter / X",  Icon: Twitter },
  { key: "LinkedIn",  label: "LinkedIn",      Icon: LinkedIn },
  { key: "GitHub",    label: "GitHub",        Icon: GitHub },
  { key: "Instagram", label: "Instagram",     Icon: Instagram },
  { key: "YouTube",   label: "YouTube",       Icon: YouTube },
  { key: "Website",   label: "Website",       Icon: Language },
  { key: "Other",     label: "Other",         Icon: LinkOutlined },
];

const platformIcon = (platform, props = {}) => {
  const found = PLATFORM_OPTIONS.find((p) => p.key === platform);
  const Ico = found?.Icon || LinkOutlined;
  return <Ico {...props} />;
};

/* ── Edit Social Links Dialog ─────────────────────────────── */
const SocialDialog = ({ open, onClose, initialProfiles, token, userId, onSaved }) => {
  const { palette } = useTheme();
  const [profiles, setProfiles] = useState(initialProfiles || []);

  useEffect(() => {
    if (open) setProfiles(initialProfiles || []);
  }, [open, initialProfiles]);

  const addRow = () =>
    setProfiles((p) => [...p, { platform: "Website", socialLink: "" }]);

  const updateRow = (idx, field, val) =>
    setProfiles((p) => p.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));

  const removeRow = (idx) =>
    setProfiles((p) => p.filter((_, i) => i !== idx));

  const handleSave = async () => {
    await fetch(`${API_BASE_URL}/users/${userId}/socials`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ socialProfiles: profiles }),
    });
    onSaved(profiles);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Manage Social Profiles</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "0.75rem", pt: "0.5rem !important" }}>
        {profiles.length === 0 && (
          <Typography color={palette.neutral.medium} fontSize="0.85rem">
            No social profiles yet. Click "+ Add" to add one.
          </Typography>
        )}
        {profiles.map((row, idx) => (
          <Box key={idx} display="flex" gap="0.5rem" alignItems="center">
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Platform</InputLabel>
              <Select
                value={row.platform}
                label="Platform"
                onChange={(e) => updateRow(idx, "platform", e.target.value)}
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <MenuItem key={p.key} value={p.key}>
                    <Box display="flex" alignItems="center" gap="0.4rem">
                      {platformIcon(p.key, { fontSize: "small" })}
                      {p.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="URL"
              size="small"
              value={row.socialLink}
              onChange={(e) => updateRow(idx, "socialLink", e.target.value)}
              placeholder="https://"
              fullWidth
            />

            <IconButton onClick={() => removeRow(idx)} size="small" color="error">
              <DeleteOutlined />
            </IconButton>
          </Box>
        ))}
        <Button
          startIcon={<AddOutlined />}
          size="small"
          onClick={addRow}
          sx={{ alignSelf: "flex-start", mt: "0.25rem" }}
        >
          Add Profile
        </Button>
      </DialogContent>
      <DialogActions sx={{ px: "1.5rem", pb: "1.5rem" }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 8 }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveOutlined />} sx={{ borderRadius: 8 }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ── Main UserWidget ──────────────────────────────────────── */
const UserWidget = ({ userId, picturePath, isOwnProfile }) => {
  const [user, setUser] = useState(null);
  const [socialDialogOpen, setSocialDialogOpen] = useState(false);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const dark   = palette.neutral.dark;
  const medium = palette.neutral.medium;
  const main   = palette.neutral.main;

  const canEdit = isOwnProfile !== undefined ? isOwnProfile : loggedInUserId === userId;

  const getUser = async () => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setUser(data);
  };

  useEffect(() => { getUser(); }, [userId]); // eslint-disable-line

  if (!user) return null;

  const { firstName, lastName, location, occupation, viewedProfile, impressions, friends, socialProfiles = [] } = user;

  const handleSocialSaved = (updatedProfiles) => {
    setUser((prev) => ({ ...prev, socialProfiles: updatedProfiles }));
  };

  return (
    <>
      <WidgetWrapper>
        {/* FIRST ROW */}
        <FlexBetween gap="0.5rem" pb="1.1rem" onClick={() => navigate(`/profile/${userId}`)}>
          <FlexBetween gap="1rem">
            <UserImage image={picturePath} />
            <Box>
              <Typography
                variant="h4" color={dark} fontWeight="500"
                sx={{ "&:hover": { color: palette.primary.light, cursor: "pointer" } }}
              >
                {firstName} {lastName}
              </Typography>
              <Typography color={medium}>{friends.length} friends</Typography>
            </Box>
          </FlexBetween>
          {canEdit && <ManageAccountsOutlined />}
        </FlexBetween>

        <Divider />

        {/* SECOND ROW */}
        <Box p="1rem 0">
          <Box display="flex" alignItems="center" gap="1rem" mb="0.5rem">
            <LocationOnOutlined fontSize="large" sx={{ color: main }} />
            <Typography color={medium}>{location}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap="1rem">
            <WorkOutlineOutlined fontSize="large" sx={{ color: main }} />
            <Typography color={medium}>{occupation}</Typography>
          </Box>
        </Box>

        <Divider />

        {/* THIRD ROW — Stats */}
        <Box p="1rem 0">
          <FlexBetween mb="0.5rem">
            <Typography color={medium}>Who's viewed your profile</Typography>
            <Typography color={main} fontWeight="500">{viewedProfile}</Typography>
          </FlexBetween>
          <FlexBetween>
            <Typography color={medium}>Impressions of your post</Typography>
            <Typography color={main} fontWeight="500">{impressions}</Typography>
          </FlexBetween>
        </Box>

        <Divider />

        {/* FOURTH ROW — Social Profiles */}
        <Box p="1rem 0">
          <FlexBetween mb="1rem">
            <Typography fontSize="1rem" color={main} fontWeight="500">
              Social Profiles
            </Typography>
            {canEdit && (
              <Tooltip title="Manage social profiles">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setSocialDialogOpen(true); }}
                  sx={{ bgcolor: palette.primary.light + "33" }}
                >
                  <AddOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </FlexBetween>

          {socialProfiles.length === 0 && (
            <Typography color={medium} fontSize="0.82rem" fontStyle="italic">
              {canEdit ? 'Click "+" to add your social links' : "No social profiles added."}
            </Typography>
          )}

          {socialProfiles.map((profile, idx) => (
            <FlexBetween key={idx} gap="1rem" mb="0.6rem">
              <FlexBetween gap="0.75rem">
                <Box
                  sx={{
                    width: 36, height: 36, borderRadius: "50%",
                    bgcolor: palette.primary.light + "33",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {platformIcon(profile.platform, { sx: { color: palette.primary.main }, fontSize: "small" })}
                </Box>
                <Box>
                  <Typography color={main} fontWeight="600" fontSize="0.88rem">
                    {profile.platform}
                  </Typography>
                  <Typography
                    color="primary"
                    fontSize="0.75rem"
                    sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                    onClick={() =>
                      window.open(
                        profile.socialLink.startsWith("http") ? profile.socialLink : `https://${profile.socialLink}`,
                        "_blank"
                      )
                    }
                  >
                    {profile.socialLink || "No link set"}
                  </Typography>
                </Box>
              </FlexBetween>
            </FlexBetween>
          ))}

          {/* Edit button if canEdit and has profiles */}
          {canEdit && socialProfiles.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => { e.stopPropagation(); setSocialDialogOpen(true); }}
              sx={{ mt: "0.5rem", borderRadius: 8, fontSize: "0.75rem" }}
            >
              Edit Profiles
            </Button>
          )}
        </Box>
      </WidgetWrapper>

      <SocialDialog
        open={socialDialogOpen}
        onClose={() => setSocialDialogOpen(false)}
        initialProfiles={socialProfiles}
        token={token}
        userId={userId}
        onSaved={handleSocialSaved}
      />
    </>
  );
};

export default UserWidget;