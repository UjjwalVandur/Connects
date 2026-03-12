import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  MenuItem,
  useTheme,
  useMediaQuery,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Popover,
  ClickAwayListener,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Menu,
  Close,
  FavoriteOutlined,
  ChatBubbleOutlineOutlined,
  PersonAddOutlined,
  PhotoCamera,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout, setLogin } from "state";
import { useNavigate, useLocation } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import API_BASE_URL from "config";
import { useSocket } from "context/SocketContext";
import { MessageCircle, Heart, User as UserIcon } from "lucide-react";

import { ExpandableTabs } from "components/ui/expandable-tabs";
import { ActivityDropdown } from "components/ui/activity-dropdown";
import { Home, MessageSquare, Bell, Moon, Sun, HelpCircle, User } from "lucide-react";

// ─── SearchBar defined OUTSIDE Navbar to prevent re-mount on every keystroke ───
const SearchBarComponent = ({ token, navigate, isDarkMode, theme }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

  // Theme-aware colour tokens for the search field
  const inputBg     = isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";
  const inputBorder = isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(100,116,139,0.25)";
  const inputColor  = isDarkMode ? "#ffffff"                 : "#0f172a";
  const placeholderColor = isDarkMode ? "rgba(255,255,255,0.4)" : "#94a3b8";
  const accentColor = isDarkMode ? "#00D5FA"                 : "#00A0BC";

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/users/search?q=${encodeURIComponent(value)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (e) {
        console.error("Search failed", e);
      }
    }, 350);
  };

  const handleSelectUser = (userId) => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    navigate(`/profile/${userId}`);
  };

  return (
    <ClickAwayListener onClickAway={() => setShowResults(false)}>
      <Box sx={{ position: "relative" }}>
        {/* Themed search field */}
        <Box
          sx={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: inputBg,
            backdropFilter: "blur(12px)",
            border: `1px solid ${inputBorder}`,
            borderRadius: "12px",
            px: "1rem", py: "0.4rem",
            transition: "border-color 0.2s, box-shadow 0.2s",
            "&:focus-within": {
              borderColor: accentColor,
              boxShadow: `0 0 0 3px ${accentColor}22`,
            },
          }}
        >
          <Search sx={{ color: placeholderColor, width: 18, height: 18 }} />
          <InputBase
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length && setShowResults(true)}
            sx={{
              minWidth: "160px",
              color: inputColor,
              fontSize: "0.88rem",
              "& .MuiInputBase-input::placeholder": { color: placeholderColor, opacity: 1 },
            }}
          />
        </Box>

        {showResults && searchResults.length > 0 && (
          <Paper elevation={6} sx={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 1000, borderRadius: "12px", overflow: "hidden", maxHeight: "320px", overflowY: "auto" }}>
            <List disablePadding>
              {searchResults.map((u, i) => (
                <ListItem
                  key={u._id}
                  button
                  onClick={() => handleSelectUser(u._id)}
                  divider={i < searchResults.length - 1}
                  sx={{ "&:hover": { backgroundColor: theme.palette.neutral.light }, cursor: "pointer", gap: "0.5rem", py: "0.6rem" }}
                >
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <Avatar src={u.picturePath ? `${API_BASE_URL}/assets/${u.picturePath}` : undefined} sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main }}>
                      {u.firstName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography fontWeight="600" fontSize="0.9rem">{u.firstName} {u.lastName}</Typography>}
                    secondary={<Typography fontSize="0.75rem" color={theme.palette.neutral.medium}>{u.occupation || ""}</Typography>}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
        {showResults && searchResults.length === 0 && searchQuery.trim() && (
          <Paper elevation={6} sx={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 1000, borderRadius: "12px", p: "1rem" }}>
            <Typography color={theme.palette.neutral.medium} fontSize="0.85rem" textAlign="center">No users found for "{searchQuery}"</Typography>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};

const notifToActivity = (n, formatTimeAgo) => ({
  id: n._id,
  icon: n.type === "like"
    ? <Heart style={{ width: 14, height: 14 }} />
    : n.type === "comment"
      ? <MessageCircle style={{ width: 14, height: 14 }} />
      : <UserIcon style={{ width: 14, height: 14 }} />,
  title: n.senderName || "Someone",
  description: n.message || "",
  time: formatTimeAgo(n.createdAt),
});

const Navbar = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [picOpen, setPicOpen] = useState(false);
  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [picSaving, setPicSaving] = useState(false);
  const picInputRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const mode = useSelector((state) => state.mode);
  const socketRef = useSocket();
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const theme = useTheme();
  const neutralLight = theme.palette.neutral.light;
  const dark = theme.palette.neutral.dark;
  const background = theme.palette.background.default;
  const primaryLight = theme.palette.primary.light;
  const alt = theme.palette.background.alt;
  const fullName = `${user.firstName} ${user.lastName}`;
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load initial notifications
  useEffect(() => {
    fetch(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setNotifications(data));
  }, [token]);

  // Listen for new notifications via socket
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const handler = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };
    socket.on("newNotification", handler);
    return () => socket.off("newNotification", handler);
  }, [socketRef]);

  const openNotifications = (e) => {
    setNotifAnchor(e.currentTarget);
    // Mark all as read
    fetch(`${API_BASE_URL}/notifications/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))));
  };

  const handlePicUpload = async () => {
    if (!picFile) return;
    setPicSaving(true);
    const fd = new FormData();
    fd.append("picture", picFile);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${user._id}/picture`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      dispatch(setLogin({ user: { ...user, picturePath: data.picturePath }, token }));
      setPicOpen(false);
      setPicFile(null);
      setPicPreview(null);
    } catch (e) {
      console.error(e);
    } finally {
      setPicSaving(false);
    }
  };

  const formatTimeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const isDarkMode = theme.palette.mode === "dark";

  let activeTab = null;
  if (location.pathname.includes("/home")) activeTab = 0;
  else if (location.pathname.includes("/messages")) activeTab = 1;

  const tabs = [
    {
      title: "Home",
      icon: Home,
      onClick: () => navigate("/home"),
    },
    {
      title: "Messages",
      icon: MessageSquare,
      onClick: () => navigate("/messages"),
    },
    {
      title: "Notifications",
      icon: () => (
        <Badge badgeContent={unreadCount} color="error" max={99} sx={{ '& .MuiBadge-badge': { right: -3, top: 3 } }}>
          <Bell size={20} />
        </Badge>
      ),
      onClick: (e) => openNotifications(e),
    },
    { type: "separator" },
    {
      title: isDarkMode ? "Light Mode" : "Dark Mode",
      icon: isDarkMode ? Sun : Moon,
      onClick: () => dispatch(setMode()),
    },
    {
      title: "Help",
      icon: HelpCircle,
      onClick: () => setHelpOpen(true),
    },
    { type: "separator" },
    {
      title: fullName,
      icon: User,
      onClick: (e) => setUserAnchor(e.currentTarget),
    },
  ];

  return (
    <>
      <FlexBetween
        padding="1rem 6%"
        position="sticky"
        top="0"
        zIndex="1000"
        style={{
          background: isDarkMode
            ? "rgba(10,10,15,0.6)"
            : "rgba(248,250,255,0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: isDarkMode
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(100,116,139,0.12)",
          boxShadow: isDarkMode
            ? "0 4px 24px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <FlexBetween gap="1.75rem">
          <Typography fontWeight="bold" fontSize="clamp(1rem, 2rem, 2.25rem)" color="primary" onClick={() => navigate("/home")} sx={{ "&:hover": { color: theme.palette.mode === "dark" ? primaryLight : theme.palette.primary.dark, cursor: "pointer" } }}>
            Connects
          </Typography>
          {isNonMobileScreens && <SearchBarComponent token={token} navigate={navigate} neutralLight={neutralLight} theme={theme} />}
        </FlexBetween>

        {isNonMobileScreens ? (
          <ExpandableTabs 
            tabs={tabs} 
            activeTab={activeTab}
            isDarkMode={isDarkMode}
            activeColor={isDarkMode ? "text-cyan-400" : "text-cyan-600"} 
            className={isDarkMode ? "border-neutral-800 bg-neutral-900/80 shadow-lg" : "border-neutral-200 bg-white/80 shadow-md"}
          />
        ) : (
          <IconButton onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}><Menu /></IconButton>
        )}

        {/* Mobile NAV */}
        {!isNonMobileScreens && isMobileMenuToggled && (
          <Box position="fixed" right="0" bottom="0" height="100%" zIndex="10" maxWidth="500px" minWidth="300px" backgroundColor={background}>
            <Box display="flex" justifyContent="flex-end" p="1rem">
              <IconButton onClick={() => setIsMobileMenuToggled(false)}><Close /></IconButton>
            </Box>
              <ExpandableTabs 
                tabs={tabs} 
                activeTab={activeTab}
                isDarkMode={isDarkMode}
                activeColor={isDarkMode ? "text-cyan-400" : "text-cyan-600"} 
                className={isDarkMode ? "border-neutral-800 bg-neutral-900/80 shadow-lg" : "border-neutral-200 bg-white/80 shadow-md"}
              />
          </Box>
        )}
      </FlexBetween>

      {/* ── User Dropdown Popover ── */}
      <Popover
        open={Boolean(userAnchor)}
        anchorEl={userAnchor}
        onClose={() => setUserAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{ sx: { width: 180, borderRadius: "12px", mt: "0.5rem", p: "0.5rem" } }}
      >
        <MenuItem onClick={() => { setUserAnchor(null); navigate(`/profile/${user._id}`); }} sx={{ borderRadius: "8px", mb: "4px" }}>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { setUserAnchor(null); setPicOpen(true); }} sx={{ borderRadius: "8px", mb: "4px" }}>
          Change Photo
        </MenuItem>
        <MenuItem onClick={() => dispatch(setLogout())} sx={{ borderRadius: "8px", color: "#ff4d4d" }}>
          Log Out
        </MenuItem>
      </Popover>

      {/* ── Notifications Popover ── */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          sx: {
            width: 360, borderRadius: "20px", mt: "0.5rem",
            background: "transparent", boxShadow: "none"
          }
        }}
      >
        <ActivityDropdown
          activities={notifications.map(n => notifToActivity(n, formatTimeAgo))}
          isDark={isDarkMode}
          unreadCount={unreadCount}
        />
      </Popover>

      {/* ── Help & Guidelines Dialog (Glassmorphism) ── */}
      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: isDarkMode ? "rgba(13,17,23,0.96)" : "rgba(255,255,255,0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: isDarkMode ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(100,116,139,0.2)",
            boxShadow: isDarkMode ? "0 24px 48px rgba(0,0,0,0.5)" : "0 16px 36px rgba(0,0,0,0.1)",
            color: isDarkMode ? "#ffffff" : "#0f172a",
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", pb: 0 }}>
          Help & Guidelines 🤝
        </DialogTitle>
        <DialogContent sx={{ pt: "1.5rem !important" }}>
          {[
            { icon: "🏠", title: "Home Feed", text: "Your feed shows posts from other users — not your own. Like & comment to interact. Double-tap images to like instantly." },
            { icon: "✍️", title: "Creating Posts", text: "Use the post box at the top of your home or profile page. Upload photos or videos, add a description, then Post!" },
            { icon: "👤", title: "Your Profile", text: "Click your name or avatar to open your profile. You can view all your posts, update Social Profiles, and publish a Sponsored Ad." },
            { icon: "🔍", title: "Search", text: "Type a name in the search bar to find users. Results appear as a dropdown — click a user to visit their profile." },
            { icon: "💬", title: "Messaging", text: "Click the ✉️ icon in the navbar. Select a friend to chat in real-time. You can also send images, files, and record voice messages (tap the 🎙 button)." },
            { icon: "🔔", title: "Notifications", text: "The 🔔 icon shows your latest activity — likes, comments, and friend requests. Unread notifications have a red badge. Opening the panel marks all as read." },
            { icon: "📢", title: "Sponsored Ads", text: "Click 'Create Ad' in the Sponsored sidebar to publish your ad to all users. Provide a title, description, link, and optional media. You can delete your ad anytime." },
            { icon: "🔗", title: "Social Profiles", text: "On your profile, click '+' next to 'Social Profiles' to add links to Twitter, LinkedIn, GitHub, Instagram, etc. Others can see and click them." },
            { icon: "🤝", title: "Friends", text: "Click the person-add icon on any post or profile to add a friend. Friends appear in your Friends List widget. You can unfriend the same way." },
          ].map(({ icon, title, text }) => (
            <Box key={title} mb="1.2rem">
              <Typography fontWeight="700" fontSize="0.95rem" mb="0.2rem" sx={{ color: isDarkMode ? "#fff" : "#0f172a" }}>
                {icon} {title}
              </Typography>
              <Typography fontSize="0.85rem" sx={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "#64748b" }}>
                {text}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: "1.5rem", pb: "1.5rem" }}>
          <Button onClick={() => setHelpOpen(false)} variant="contained" sx={{ borderRadius: 8 }}>Got it!</Button>
        </DialogActions>
      </Dialog>

      {/* ── Photo Upload Dialog ── */}
      <Dialog
        open={picOpen}
        onClose={() => setPicOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: isDarkMode ? "rgba(13,17,23,0.96)" : "rgba(255,255,255,0.96)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            border: isDarkMode ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(100,116,139,0.2)",
            color: isDarkMode ? "#fff" : "#000",
            width: "350px", textAlign: "center", p: "1rem"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Update Profile Photo</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap="1rem">
            <Avatar
              src={picPreview || (user.picturePath ? `${API_BASE_URL}/assets/${user.picturePath}` : null)}
              sx={{ width: 120, height: 120, border: `4px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}
            />
            <input
              type="file" accept="image/*" hidden ref={picInputRef}
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) { setPicFile(f); setPicPreview(URL.createObjectURL(f)); }
              }}
            />
            <Button variant="outlined" startIcon={<PhotoCamera />} onClick={() => picInputRef.current.click()} sx={{ borderRadius: 8 }}>
              Choose new photo
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: "1rem" }}>
          <Button onClick={() => { setPicOpen(false); setPicFile(null); setPicPreview(null); }} sx={{ color: "text.secondary" }}>Cancel</Button>
          <Button onClick={handlePicUpload} variant="contained" disabled={!picFile || picSaving} sx={{ borderRadius: 8 }}>
            {picSaving ? <CircularProgress size={20} /> : "Save Photo"}
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
};

export default Navbar;
