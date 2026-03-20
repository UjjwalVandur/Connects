import React, { useState, useRef, useEffect } from "react";
import {
  Box, IconButton, InputBase, Typography, MenuItem,
  useTheme, useMediaQuery, Avatar, Paper, List, ListItem,
  ListItemAvatar, ListItemText, Badge, Popover, ClickAwayListener,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress,
} from "@mui/material";
import { Search, PhotoCamera } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout, setLogin } from "state";
import { useNavigate, useLocation } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import API_BASE_URL from "config";
import { useSocket } from "context/SocketContext";
import { MessageCircle, Heart, User as UserIcon } from "lucide-react";
import { ExpandableTabs } from "components/ui/expandable-tabs";
import { ActivityDropdown } from "components/ui/activity-dropdown";
import { Home, MessageSquare, Bell, Moon, Sun, HelpCircle, User, Settings } from "lucide-react";

/* ── SearchBar ─────────────────────────────────────────────── */
const SearchBarComponent = ({ token, navigate, isDarkMode, theme }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);
  const inputBg     = isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";
  const inputBorder = isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(100,116,139,0.25)";
  const inputColor  = isDarkMode ? "#ffffff" : "#0f172a";
  const placeholderColor = isDarkMode ? "rgba(255,255,255,0.4)" : "#94a3b8";
  const accentColor = isDarkMode ? "#00D5FA" : "#00A0BC";

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSearchResults([]); setShowResults(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(value)}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setSearchResults(data); setShowResults(true);
      } catch (e) { console.error("Search failed", e); }
    }, 350);
  };

  const handleSelectUser = (userId) => { setSearchQuery(""); setSearchResults([]); setShowResults(false); navigate(`/profile/${userId}`); };

  return (
    <ClickAwayListener onClickAway={() => setShowResults(false)}>
      <Box sx={{ position: "relative" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem", background: inputBg, backdropFilter: "blur(12px)", border: `1px solid ${inputBorder}`, borderRadius: "12px", px: "1rem", py: "0.4rem", transition: "border-color 0.2s, box-shadow 0.2s", "&:focus-within": { borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}22` } }}>
          <Search sx={{ color: placeholderColor, width: 18, height: 18 }} />
          <InputBase placeholder="Search users..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onFocus={() => searchResults.length && setShowResults(true)} sx={{ minWidth: "160px", color: inputColor, fontSize: "0.88rem", "& .MuiInputBase-input::placeholder": { color: placeholderColor, opacity: 1 } }} />
        </Box>
        {showResults && searchResults.length > 0 && (
          <Paper elevation={6} sx={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 1000, borderRadius: "12px", overflow: "hidden", maxHeight: "320px", overflowY: "auto" }}>
            <List disablePadding>
              {searchResults.map((u, i) => (
                <ListItem key={u._id} button onClick={() => handleSelectUser(u._id)} divider={i < searchResults.length - 1} sx={{ "&:hover": { backgroundColor: theme.palette.neutral.light }, cursor: "pointer", gap: "0.5rem", py: "0.6rem" }}>
                  <ListItemAvatar sx={{ minWidth: 44 }}><Avatar src={u.picturePath ? `${API_BASE_URL}/assets/${u.picturePath}` : undefined} sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main }}>{u.firstName?.[0]}</Avatar></ListItemAvatar>
                  <ListItemText primary={<Typography fontWeight="600" fontSize="0.9rem">{u.firstName} {u.lastName}</Typography>} secondary={<Typography fontSize="0.75rem" color={theme.palette.neutral.medium}>{u.occupation || ""}</Typography>} />
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
  icon: n.type === "like" ? <Heart style={{ width: 14, height: 14 }} /> : n.type === "comment" ? <MessageCircle style={{ width: 14, height: 14 }} /> : <UserIcon style={{ width: 14, height: 14 }} />,
  title: n.senderName || "Someone",
  description: n.message || "",
  time: formatTimeAgo(n.createdAt),
});

/* ── Navbar ────────────────────────────────────────────────── */
const Navbar = () => {
  const [notifications, setNotifications]   = useState([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [notifAnchor,   setNotifAnchor]     = useState(null);
  const [userAnchor,    setUserAnchor]      = useState(null);
  const [helpOpen,      setHelpOpen]        = useState(false);
  const [picOpen,       setPicOpen]         = useState(false);
  const [settingsOpen,  setSettingsOpen]    = useState(false);
  const [picFile,       setPicFile]         = useState(null);
  const [picPreview,    setPicPreview]      = useState(null);
  const [picSaving,     setPicSaving]       = useState(false);
  const picInputRef = useRef(null);
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const location    = useLocation();
  const user        = useSelector((s) => s.user);
  const token       = useSelector((s) => s.token);
  const mode        = useSelector((s) => s.mode);
  const socketRef   = useSocket();
  const isDesktop   = useMediaQuery("(min-width:1000px)");
  const theme       = useTheme();
  const primaryLight = theme.palette.primary.light;
  const isDarkMode  = theme.palette.mode === "dark";
  const fullName    = `${user.firstName} ${user.lastName}`;
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    fetch(`${API_BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((data) => Array.isArray(data) && setNotifications(data));
      
    fetch(`${API_BASE_URL}/messages/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((data) => setUnreadMsgCount(data.count || 0));
  }, [token]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    
    const notifHandler = (notif) => setNotifications((prev) => [notif, ...prev]);
    socket.on("newNotification", notifHandler);
    
    const msgHandler = (msg) => {
      if (msg.receiverId === user._id) {
        setUnreadMsgCount((prev) => prev + 1);
      }
    };
    socket.on("receiveMessage", msgHandler);
    
    return () => {
      socket.off("newNotification", notifHandler);
      socket.off("receiveMessage", msgHandler);
    };
  }, [socketRef, user._id]);

  const openNotifications = (e) => {
    setNotifAnchor(e.currentTarget);
    fetch(`${API_BASE_URL}/notifications/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } })
      .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))));
  };

  const clearUnreadMessages = () => {
    if (unreadMsgCount > 0) {
      setUnreadMsgCount(0);
      fetch(`${API_BASE_URL}/messages/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    }
  };

  const handlePicUpload = async () => {
    if (!picFile) return;
    setPicSaving(true);
    const fd = new FormData();
    fd.append("picture", picFile);
    try {
      const res  = await fetch(`${API_BASE_URL}/users/${user._id}/picture`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      dispatch(setLogin({ user: { ...user, picturePath: data.picturePath }, token }));
      setPicOpen(false); setPicFile(null); setPicPreview(null);
    } catch (e) { console.error(e); } finally { setPicSaving(false); }
  };

  const formatTimeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  let activeTab = null;
  if (location.pathname.includes("/home"))     activeTab = 0;
  if (location.pathname.includes("/messages")) activeTab = 1;

  const desktopTabs = [
    { title: "Home",        icon: Home,          onClick: () => navigate("/home") },
    {
      title: "Messages",
      icon: () => (
        <Badge badgeContent={unreadMsgCount} color="error" max={99} sx={{ "& .MuiBadge-badge": { right: -3, top: 3 } }}>
          <MessageSquare size={20} />
        </Badge>
      ),
      onClick: () => { clearUnreadMessages(); navigate("/messages"); }
    },
    {
      title: "Notifications",
      icon: () => (
        <Badge badgeContent={unreadCount} color="error" max={99} sx={{ "& .MuiBadge-badge": { right: -3, top: 3 } }}>
          <Bell size={20} />
        </Badge>
      ),
      onClick: (e) => openNotifications(e),
    },
    { type: "separator" },
    { title: isDarkMode ? "Light Mode" : "Dark Mode", icon: isDarkMode ? Sun : Moon, onClick: () => dispatch(setMode()) },
    { title: "Help",     icon: HelpCircle, onClick: () => setHelpOpen(true) },
    { type: "separator" },
    { title: fullName,   icon: User,       onClick: (e) => setUserAnchor(e.currentTarget) },
  ];

  /* mobile bottom nav active state */
  const mobileActive = location.pathname.includes("/home") ? 0
    : location.pathname.includes("/messages") ? 1
    : location.pathname.includes("/profile")  ? 2
    : -1;

  const mobileBtn = (active) => ({
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", flex: 1, gap: "3px", padding: "8px 4px",
    background: "none", border: "none", cursor: "pointer",
    color: active ? (isDarkMode ? "#00D5FA" : "#0077FF") : (isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"),
    transition: "color 0.2s", position: "relative",
  });

  const activeIndicator = (
    <Box sx={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 3, borderRadius: "0 0 4px 4px", background: "linear-gradient(90deg,#00D5FA,#0077FF)" }} />
  );

  return (
    <>
      {/* ══ DESKTOP NAVBAR ══════════════════════════════════ */}
      {isDesktop && (
        <FlexBetween
          padding="1rem 6%" position="sticky" top="0" zIndex="1000"
          style={{
            background:   isDarkMode ? "rgba(10,10,15,0.6)" : "rgba(248,250,255,0.6)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(100,116,139,0.12)",
            boxShadow:    isDarkMode ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <FlexBetween gap="1.75rem">
            <Typography fontWeight="bold" fontSize="clamp(1rem, 2rem, 2.25rem)" color="primary" onClick={() => navigate("/home")} sx={{ "&:hover": { color: isDarkMode ? primaryLight : theme.palette.primary.dark, cursor: "pointer" } }}>
              Connects
            </Typography>
            <SearchBarComponent token={token} navigate={navigate} theme={theme} isDarkMode={isDarkMode} />
          </FlexBetween>
          <ExpandableTabs tabs={desktopTabs} activeTab={activeTab} isDarkMode={isDarkMode} activeColor={isDarkMode ? "text-cyan-400" : "text-cyan-600"} className={isDarkMode ? "border-neutral-800 bg-neutral-900/80 shadow-lg" : "border-neutral-200 bg-white/80 shadow-md"} />
        </FlexBetween>
      )}

      {/* ══ MOBILE HEADER ═══════════════════════════════════ */}
      {!isDesktop && (
        <Box sx={{ position: "sticky", top: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "space-between", px: "1rem", py: "0.55rem", background: isDarkMode ? "rgba(10,10,15,0.88)" : "rgba(248,250,255,0.94)", backdropFilter: "blur(20px)", borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(100,116,139,0.12)", boxShadow: isDarkMode ? "0 2px 16px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.06)" }}>
          <IconButton onClick={() => setHelpOpen(true)} size="small" sx={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}>
            <HelpCircle size={22} />
          </IconButton>
          <Typography fontWeight="bold" fontSize="1.35rem" color="primary" onClick={() => navigate("/home")} sx={{ cursor: "pointer", userSelect: "none" }}>
            Connects
          </Typography>
          <IconButton onClick={openNotifications} size="small" sx={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}>
            <Badge badgeContent={unreadCount || null} color="error" max={99}>
              <Bell size={22} />
            </Badge>
          </IconButton>
        </Box>
      )}

      {/* ══ MOBILE BOTTOM NAV ═══════════════════════════════ */}
      {!isDesktop && (
        <Box sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000, display: "flex", alignItems: "stretch", background: isDarkMode ? "rgba(10,10,18,0.97)" : "rgba(255,255,255,0.98)", backdropFilter: "blur(24px)", borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", boxShadow: isDarkMode ? "0 -4px 24px rgba(0,0,0,0.5)" : "0 -4px 24px rgba(0,0,0,0.08)", pb: "env(safe-area-inset-bottom)" }}>
          {/* Home */}
          <button style={mobileBtn(mobileActive === 0)} onClick={() => navigate("/home")}>
            {mobileActive === 0 && activeIndicator}
            <Home size={22} />
            <span style={{ fontSize: "0.63rem", fontWeight: mobileActive === 0 ? 700 : 500 }}>Home</span>
          </button>
          {/* Messages */}
          <button style={mobileBtn(mobileActive === 1)} onClick={() => { clearUnreadMessages(); navigate("/messages"); }}>
            {mobileActive === 1 && activeIndicator}
            <Badge badgeContent={unreadMsgCount || null} color="error" max={99}>
              <MessageSquare size={22} />
            </Badge>
            <span style={{ fontSize: "0.63rem", fontWeight: mobileActive === 1 ? 700 : 500 }}>Messages</span>
          </button>
          {/* Profile — goes directly to profile page */}
          <button style={mobileBtn(mobileActive === 2)} onClick={() => navigate(`/profile/${user._id}`)}>
            {mobileActive === 2 && activeIndicator}
            <Avatar src={user.picturePath ? `${API_BASE_URL}/assets/${user.picturePath}` : undefined} sx={{ width: 26, height: 26, border: mobileActive === 2 ? "2px solid #00D5FA" : "2px solid rgba(128,128,128,0.3)", transition: "border-color 0.2s" }}>
              {user.firstName?.[0]}
            </Avatar>
            <span style={{ fontSize: "0.63rem", fontWeight: mobileActive === 2 ? 700 : 500 }}>Profile</span>
          </button>
          {/* Settings */}
          <button style={mobileBtn(false)} onClick={() => setSettingsOpen(true)}>
            <Settings size={22} />
            <span style={{ fontSize: "0.63rem", fontWeight: 500 }}>Settings</span>
          </button>
        </Box>
      )}

      {/* ══ SETTINGS SHEET (slide up) ════════════════════════ */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        PaperProps={{ sx: { position: "fixed", bottom: 0, left: 0, right: 0, m: 0, maxWidth: "100%", width: "100%", borderRadius: "24px 24px 0 0", background: isDarkMode ? "rgba(13,13,20,0.98)" : "rgba(255,255,255,0.98)", backdropFilter: "blur(28px)", border: isDarkMode ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(0,0,0,0.07)", p: "1.25rem 1.5rem 2.5rem" } }}
      >
        <Box sx={{ width: 36, height: 4, borderRadius: 2, background: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)", mx: "auto", mb: "1.25rem" }} />
        <Typography fontWeight={700} fontSize="1.1rem" mb="1.25rem">Settings</Typography>

        {/* Theme toggle */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "0.8rem", pb: "1rem", borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            <Box>
              <Typography fontWeight={600} fontSize="0.93rem">{isDarkMode ? "Dark Mode" : "Light Mode"}</Typography>
              <Typography fontSize="0.76rem" color={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}>Switch appearance</Typography>
            </Box>
          </Box>
          <Box onClick={() => dispatch(setMode())} sx={{ width: 50, height: 28, borderRadius: 14, cursor: "pointer", background: isDarkMode ? "linear-gradient(135deg,#00D5FA,#0077FF)" : "rgba(0,0,0,0.15)", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
            <Box sx={{ position: "absolute", top: 3, left: isDarkMode ? 25 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", transition: "left 0.3s" }} />
          </Box>
        </Box>

        {/* Change Photo */}
        <Box onClick={() => { setSettingsOpen(false); setTimeout(() => setPicOpen(true), 180); }} sx={{ display: "flex", alignItems: "center", gap: "0.75rem", p: "0.75rem 0.6rem", borderRadius: "12px", cursor: "pointer", "&:hover": { background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }, transition: "background 0.15s", mb: "0.2rem" }}>
          <PhotoCamera sx={{ fontSize: 22, opacity: 0.7 }} />
          <Box>
            <Typography fontWeight={600} fontSize="0.93rem">Change Photo</Typography>
            <Typography fontSize="0.76rem" color={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}>Update your profile picture</Typography>
          </Box>
        </Box>

        {/* Log Out */}
        <Box onClick={() => dispatch(setLogout())} sx={{ display: "flex", alignItems: "center", gap: "0.75rem", p: "0.75rem 0.6rem", borderRadius: "12px", cursor: "pointer", "&:hover": { background: "rgba(255,60,60,0.07)" }, transition: "background 0.15s" }}>
          <Box sx={{ fontSize: 20, display: "flex" }}>🚪</Box>
          <Typography fontWeight={600} fontSize="0.93rem" color="#ff4d4d">Log Out</Typography>
        </Box>

        <Typography fontSize="0.7rem" color={isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.22)"} textAlign="center" mt="2rem">
          Connects v2.0.0
        </Typography>
      </Dialog>

      {/* ══ DESKTOP: USER POPOVER ═══════════════════════════ */}
      <Popover open={Boolean(userAnchor)} anchorEl={userAnchor} onClose={() => setUserAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} transformOrigin={{ vertical: "top", horizontal: "center" }} PaperProps={{ sx: { width: 180, borderRadius: "12px", mt: "0.5rem", p: "0.5rem" } }}>
        <MenuItem onClick={() => { setUserAnchor(null); navigate(`/profile/${user._id}`); }} sx={{ borderRadius: "8px", mb: "4px" }}>Profile</MenuItem>
        <MenuItem onClick={() => { setUserAnchor(null); setPicOpen(true); }} sx={{ borderRadius: "8px", mb: "4px" }}>Change Photo</MenuItem>
        <MenuItem onClick={() => dispatch(setLogout())} sx={{ borderRadius: "8px", color: "#ff4d4d" }}>Log Out</MenuItem>
      </Popover>

      {/* ══ NOTIFICATIONS POPOVER ═══════════════════════════ */}
      <Popover open={Boolean(notifAnchor)} anchorEl={notifAnchor} onClose={() => setNotifAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} transformOrigin={{ vertical: "top", horizontal: "center" }} PaperProps={{ sx: { width: 360, borderRadius: "20px", mt: "0.5rem", background: "transparent", boxShadow: "none" } }}>
        <ActivityDropdown activities={notifications.map((n) => notifToActivity(n, formatTimeAgo))} isDark={isDarkMode} unreadCount={unreadCount} />
      </Popover>

      {/* ══ HELP DIALOG ═════════════════════════════════════ */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "20px", background: isDarkMode ? "rgba(13,17,23,0.96)" : "rgba(255,255,255,0.96)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: isDarkMode ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(100,116,139,0.2)", boxShadow: isDarkMode ? "0 24px 48px rgba(0,0,0,0.5)" : "0 16px 36px rgba(0,0,0,0.1)", color: isDarkMode ? "#ffffff" : "#0f172a" } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", pb: 0 }}>Help & Guidelines 🤝</DialogTitle>
        <DialogContent sx={{ pt: "1.5rem !important" }}>
          {[
            { icon: "🏠", title: "Home Feed",        text: "Your feed shows posts from other users. Like & comment to interact." },
            { icon: "✍️", title: "Creating Posts",   text: "Use the post box at the top of your home or profile page. Upload photos or videos, add a description, then Post!" },
            { icon: "👤", title: "Your Profile",     text: "Click your name or avatar to open your profile. View posts, update Social Profiles, and publish a Sponsored Ad." },
            { icon: "🔍", title: "Search",           text: "Type a name in the search bar to find users. Click a user to visit their profile." },
            { icon: "💬", title: "Messaging",        text: "Click the ✉️ icon. Select a friend to chat in real-time. Send images, files, and voice messages." },
            { icon: "🔔", title: "Notifications",    text: "The 🔔 icon shows your latest activity. Unread ones have a red badge. Opening marks all as read." },
            { icon: "📢", title: "Sponsored Ads",    text: "Click 'Create Ad' in the Sponsored sidebar. Provide title, description, link, and media." },
            { icon: "🔗", title: "Social Profiles",  text: "On your profile, add links to Twitter, LinkedIn, GitHub, Instagram, etc." },
            { icon: "🤝", title: "Friends",          text: "Click the person-add icon on any post or profile to add / remove a friend." },
          ].map(({ icon, title, text }) => (
            <Box key={title} mb="1.2rem">
              <Typography fontWeight="700" fontSize="0.95rem" mb="0.2rem" sx={{ color: isDarkMode ? "#fff" : "#0f172a" }}>{icon} {title}</Typography>
              <Typography fontSize="0.85rem" sx={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "#64748b" }}>{text}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: "1.5rem", pb: "1.5rem" }}>
          <Button onClick={() => setHelpOpen(false)} variant="contained" sx={{ borderRadius: 8 }}>Got it!</Button>
        </DialogActions>
      </Dialog>

      {/* ══ PHOTO UPLOAD DIALOG ═════════════════════════════ */}
      <Dialog open={picOpen} onClose={() => setPicOpen(false)} PaperProps={{ sx: { borderRadius: "20px", background: isDarkMode ? "rgba(13,17,23,0.96)" : "rgba(255,255,255,0.96)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: isDarkMode ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(100,116,139,0.2)", color: isDarkMode ? "#fff" : "#000", width: "350px", textAlign: "center", p: "1rem" } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Profile Photo</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap="1rem">
            <Avatar src={picPreview || (user.picturePath ? `${API_BASE_URL}/assets/${user.picturePath}` : null)} sx={{ width: 120, height: 120, border: `4px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }} />
            <input type="file" accept="image/*" hidden ref={picInputRef} onChange={(e) => { const f = e.target.files[0]; if (f) { setPicFile(f); setPicPreview(URL.createObjectURL(f)); } }} />
            <Button variant="outlined" startIcon={<PhotoCamera />} onClick={() => picInputRef.current.click()} sx={{ borderRadius: 8 }}>Choose new photo</Button>
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
