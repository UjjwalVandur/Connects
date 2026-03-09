import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  Select,
  MenuItem,
  FormControl,
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
} from "@mui/material";
import {
  Search,
  Message,
  DarkMode,
  LightMode,
  Notifications,
  Help,
  Menu,
  Close,
  FavoriteOutlined,
  ChatBubbleOutlineOutlined,
  PersonAddOutlined,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout } from "state";
import { useNavigate, useLocation } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import API_BASE_URL from "config";
import { useSocket } from "context/SocketContext";

import { ExpandableTabs } from "components/ui/expandable-tabs";
import { Home, MessageSquare, Bell, Moon, Sun, HelpCircle, User } from "lucide-react";

// ─── SearchBar defined OUTSIDE Navbar to prevent re-mount on every keystroke ───
const SearchBarComponent = ({ token, navigate, neutralLight, theme }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

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
        <FlexBetween backgroundColor={neutralLight} borderRadius="9px" gap="1rem" padding="0.1rem 1.5rem">
          <InputBase
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length && setShowResults(true)}
            sx={{ minWidth: "180px" }}
          />
          <Search sx={{ color: theme.palette.neutral.medium, cursor: "pointer" }} />
        </FlexBetween>

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

const notifIcon = (type) => {
  if (type === "like") return <FavoriteOutlined sx={{ fontSize: 18, color: "#e0245e" }} />;
  if (type === "comment") return <ChatBubbleOutlineOutlined sx={{ fontSize: 18, color: "#1da1f2" }} />;
  return <PersonAddOutlined sx={{ fontSize: 18, color: "#17bf63" }} />;
};

const Navbar = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
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
      <FlexBetween padding="1rem 6%" backgroundColor={alt} position="sticky" top="0" zIndex="1000">
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
        PaperProps={{ sx: { width: 360, maxHeight: 480, overflow: "auto", borderRadius: "12px", mt: "0.5rem" } }}
      >
        <Box p="1rem 1.5rem" borderBottom={`1px solid ${theme.palette.divider}`}>
          <Typography fontWeight="700" fontSize="1.1rem">Notifications</Typography>
        </Box>
        {notifications.length === 0 ? (
          <Typography color={theme.palette.neutral.medium} p="1.5rem" textAlign="center">No notifications yet</Typography>
        ) : (
          <List disablePadding>
            {notifications.map((n, i) => (
              <ListItem
                key={n._id || i}
                divider
                sx={{ px: "1.5rem", py: "0.75rem", backgroundColor: n.read ? "transparent" : theme.palette.primary.light + "11", gap: "0.75rem", alignItems: "flex-start" }}
              >
                <ListItemAvatar sx={{ minWidth: 44, position: "relative" }}>
                  <Avatar src={n.senderPicture ? `${API_BASE_URL}/assets/${n.senderPicture}` : undefined} sx={{ width: 40, height: 40 }}>
                    {n.senderName?.[0]}
                  </Avatar>
                  <Box sx={{ position: "absolute", bottom: -2, right: -2, bgcolor: "white", borderRadius: "50%", p: "1px" }}>
                    {notifIcon(n.type)}
                  </Box>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography fontSize="0.85rem"><b>{n.senderName}</b> {n.message}</Typography>}
                  secondary={<Typography fontSize="0.75rem" color={theme.palette.neutral.medium}>{formatTimeAgo(n.createdAt)}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Popover>

      {/* ── Help & Guidelines Dialog ── */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", pb: 0 }}>
          Help & Guidelines 🤝
        </DialogTitle>
        <DialogContent sx={{ pt: "0.75rem !important" }}>
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
            <Box key={title} mb="0.9rem">
              <Typography fontWeight="700" fontSize="0.95rem" mb="0.15rem">
                {icon} {title}
              </Typography>
              <Typography fontSize="0.85rem" color={theme.palette.neutral.medium}>
                {text}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: "1.5rem", pb: "1.5rem" }}>
          <Button onClick={() => setHelpOpen(false)} variant="contained" sx={{ borderRadius: 8 }}>Got it!</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;
