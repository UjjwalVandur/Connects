import { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Avatar, TextField, IconButton,
  List, ListItem, ListItemAvatar, ListItemText,
  useTheme, Tooltip, LinearProgress,
} from "@mui/material";
import {
  Send, ArrowBack, AttachFile, Mic, Stop,
  InsertDriveFile,
} from "@mui/icons-material";
import { keyframes } from "@emotion/react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "scenes/navbar";
import API_BASE_URL from "config";
import { useSocket } from "context/SocketContext";
import CanvasRevealEffect from "components/ui/CanvasRevealEffect";

const pulseAnim = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255,60,60,0.4); }
  70% { box-shadow: 0 0 0 8px rgba(255,60,60,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,60,60,0); }
`;

/* ── helpers ─────────────────────────────────────────────────── */
const glass = (alpha = 0.55) =>
  `rgba(255,255,255,${alpha})`;
const glassDark = (alpha = 0.08) =>
  `rgba(255,255,255,${alpha})`;

/* ── Message Bubble ──────────────────────────────────────────── */
const MessageBubble = ({ msg, isMe, palette, isDark }) => {
  const hasMedia = !!msg.mediaPath;
  const isImage  = msg.mediaType === "image";
  const isAudio  = msg.mediaType === "audio";
  const isVideo  = msg.mediaType === "video";
  const isFile   = msg.mediaType === "file";

  const bubbleBg = isMe
    ? "linear-gradient(135deg, #00D5FA 0%, #0077FF 100%)"
    : isDark
    ? "rgba(255,255,255,0.10)"
    : "rgba(255,255,255,0.72)";

  return (
    <Box
      sx={{
        maxWidth: isAudio ? "340px" : "72%",
        minWidth: isAudio ? "260px" : undefined,
        background: bubbleBg,
        color: isMe ? "#fff" : palette.neutral.dark,
        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        px: "1rem",
        py: "0.6rem",
        backdropFilter: "blur(12px)",
        boxShadow: isMe
          ? "0 4px 20px rgba(0,213,250,0.3)"
          : isDark
          ? "0 2px 12px rgba(0,0,0,0.4)"
          : "0 2px 12px rgba(0,0,0,0.10)",
        border: isMe
          ? "none"
          : isDark
          ? "1px solid rgba(255,255,255,0.12)"
          : "1px solid rgba(255,255,255,0.6)",
        transition: "box-shadow 0.2s",
      }}
    >
      {hasMedia && isImage && (
        <img
          src={msg.mediaPath?.startsWith("http") ? msg.mediaPath : `${API_BASE_URL}/assets/${msg.mediaPath}`}
          alt="img"
          style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 10, display: "block", marginBottom: msg.text ? "0.4rem" : 0 }}
        />
      )}
      {hasMedia && isVideo && (
        <video
          src={msg.mediaPath?.startsWith("http") ? msg.mediaPath : `${API_BASE_URL}/assets/${msg.mediaPath}`}
          controls
          style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10, display: "block", marginBottom: msg.text ? "0.4rem" : 0 }}
        />
      )}
      {hasMedia && isAudio && (
        <audio
          src={msg.mediaPath?.startsWith("http") ? msg.mediaPath : `${API_BASE_URL}/assets/${msg.mediaPath}`}
          controls
          style={{ width: "100%", minWidth: "230px", marginBottom: msg.text ? "0.4rem" : 0, borderRadius: 8 }}
        />
      )}
      {hasMedia && isFile && (
        <a
          href={msg.mediaPath?.startsWith("http") ? msg.mediaPath : `${API_BASE_URL}/assets/${msg.mediaPath}`}
          target="_blank"
          rel="noreferrer"
          download
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "inherit", textDecoration: "none", marginBottom: msg.text ? "0.4rem" : 0 }}
        >
          <InsertDriveFile fontSize="small" />
          <Typography fontSize="0.82rem" sx={{ wordBreak: "break-all" }}>{msg.fileName || msg.mediaPath}</Typography>
        </a>
      )}
      {msg.text && <Typography fontSize="0.9rem" sx={{ lineHeight: 1.45 }}>{msg.text}</Typography>}
      <Typography fontSize="0.65rem" sx={{ opacity: 0.65, mt: "3px", textAlign: isMe ? "right" : "left" }}>
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Typography>
    </Box>
  );
};

/* ── Main Page ───────────────────────────────────────────────── */
const MessagesPage = () => {
  const [friends,        setFriends]        = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [newMsg,         setNewMsg]         = useState("");
  const [recording,      setRecording]      = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const mediaRecorder  = useRef(null);
  const audioChunks    = useRef([]);
  const { palette }    = useTheme();
  const navigate       = useNavigate();
  const user           = useSelector((s) => s.user);
  const token          = useSelector((s) => s.token);
  const mode           = useSelector((s) => s.mode);
  const socketRef      = useSocket();
  const isDark         = mode === "dark";

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  /* canvas colours matching home page */
  const canvasColors = isDark
    ? [[0, 229, 255], [0, 119, 255], [120, 80, 240]]
    : [[99, 102, 241], [139, 92, 246], [59, 130, 246]];
  const bgColor = isDark ? "#000" : "#f8faff";
  const radialOverlay = isDark
    ? "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)"
    : "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(248,250,255,0.84) 0%, rgba(248,250,255,0.45) 60%, transparent 100%)";

  /* sidebar glass styles */
  const sidebarBg = isDark ? "rgba(20,20,28,0.88)" : "rgba(255,255,255,0.82)";
  const headerBg  = isDark ? "rgba(15,15,22,0.92)" : "rgba(255,255,255,0.90)";
  const inputBarBg = isDark ? "rgba(15,15,22,0.92)" : "rgba(255,255,255,0.90)";

  // Load friends
  useEffect(() => {
    fetch(`${API_BASE_URL}/users/${user._id}/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setFriends(data);
      else if (data && typeof data === "object" && Array.isArray(data.friends)) setFriends(data.friends);
      else setFriends([]);
    });
  }, [user._id, token]);

  // Load conversation
  useEffect(() => {
    if (!selectedFriend) return;
    fetch(`${API_BASE_URL}/messages/${selectedFriend._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((data) => {
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    });
  }, [selectedFriend, token]);

  // Real-time incoming
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const handler = (msg) => {
      if (selectedFriend && (msg.senderId === selectedFriend._id || msg.receiverId === selectedFriend._id)) {
        setMessages((p) => [...p, msg]);
        setTimeout(scrollToBottom, 50);
      }
    };
    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, [socketRef, selectedFriend]);

  /* send */
  const sendMessage = async (text = "", file = null) => {
    if (!selectedFriend || (!text.trim() && !file)) return;
    setUploading(true);
    const fd = new FormData();
    if (text.trim()) fd.append("text", text.trim());
    if (file) fd.append("media", file, file.name || "voice.webm");
    const res   = await fetch(`${API_BASE_URL}/messages/${selectedFriend._id}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    const saved = await res.json();
    setMessages((p) => [...p, saved]);
    setNewMsg("");
    setUploading(false);
    setTimeout(scrollToBottom, 50);
  };

  /* voice */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current   = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await sendMessage("", file);
      };
      mediaRecorder.current.start();
      setRecording(true);
    } catch { alert("Microphone access denied."); }
  };
  const stopRecording = () => { mediaRecorder.current?.stop(); setRecording(false); };
  const handleFilePick = (e) => { const file = e.target.files[0]; if (file) sendMessage("", file); e.target.value = ""; };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: bgColor, position: "relative" }}>

      {/* ── Animated Canvas Background (full page) ─────────── */}
      <Box sx={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <CanvasRevealEffect colors={canvasColors} dotSize={2} spacing={20} speed={0.9} />
        <Box sx={{ position: "absolute", inset: 0, background: radialOverlay }} />
      </Box>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <Box sx={{ position: "relative", zIndex: 10 }}>
        <Navbar />
      </Box>

      {/* ── Body ───────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 1, mx: { xs: 0, md: "2rem" }, my: { xs: 0, md: "1rem" }, pb: { xs: "66px", md: 0 }, borderRadius: { xs: 0, md: "20px" }, gap: { xs: 0, md: "1rem" } }}>

        {/* ── Friends Sidebar ─────────────────────────────── */}
        <Box
          sx={{
            display: { xs: selectedFriend ? "none" : "flex", md: "flex" },
            width: { xs: "100%", md: "290px" },
            minWidth: { md: "290px" },
            overflow: "hidden",
            flexDirection: "column",
            borderRadius: { xs: 0, md: "18px" },
            background: isDark ? "rgba(20,20,28,0.70)" : "rgba(255,255,255,0.60)",
            backdropFilter: "blur(12px)",
            border: { md: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.7)", xs: "none" },
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          {/* sidebar header */}
          <Box
            sx={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              p: "1rem 1.2rem",
              borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <IconButton
              onClick={() => navigate("/home")}
              size="small"
              sx={{
                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                "&:hover": { background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)" },
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: "0.01em" }}>
              Messages
            </Typography>
          </Box>

          {/* friend list */}
          <List sx={{ overflow: "auto", flex: 1, py: "0.5rem" }}>
            {friends.length === 0 && (
              <Typography color={palette.neutral.medium} p="1rem" fontSize="0.85rem" textAlign="center">
                Add friends to start chatting!
              </Typography>
            )}
            {friends.map((f) => (
              <ListItem
                key={f._id}
                button
                selected={selectedFriend?._id === f._id}
                onClick={() => setSelectedFriend(f)}
                sx={{
                  borderRadius: "12px",
                  mx: "0.5rem",
                  mb: "0.2rem",
                  width: "calc(100% - 1rem)",
                  "&.Mui-selected": {
                    background: "linear-gradient(135deg, rgba(0,213,250,0.18) 0%, rgba(0,119,255,0.18) 100%)",
                    border: "1px solid rgba(0,213,250,0.3)",
                  },
                  "&:hover": {
                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                  },
                  cursor: "pointer",
                  px: "1rem",
                  py: "0.7rem",
                  transition: "all 0.18s",
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={f.picturePath ? (f.picturePath.startsWith("http") ? f.picturePath : `${API_BASE_URL}/assets/${f.picturePath}`) : undefined}
                    sx={{ width: 42, height: 42, border: "2px solid rgba(0,213,250,0.4)" }}
                  >
                    {f.firstName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography fontWeight="600" fontSize="0.95rem">{f.firstName} {f.lastName}</Typography>}
                  secondary={<Typography fontSize="0.74rem" color={palette.neutral.medium} noWrap>{f.occupation}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* ── Conversation Area ────────────────────────────── */}
        {selectedFriend ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: { xs: 0, md: "18px" },
              background: isDark ? "rgba(10,10,18,0.50)" : "rgba(255,255,255,0.35)",
              backdropFilter: "blur(12px)",
              border: { md: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(255,255,255,0.65)", xs: "none" },
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
          >
            {/* Chat header */}
            <Box
              sx={{
                display: "flex", alignItems: "center", gap: "1rem",
                p: { xs: "0.75rem 1rem", md: "0.85rem 1.5rem" },
                borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.55)",
                backdropFilter: "blur(12px)",
              }}
            >
              <IconButton sx={{ display: { md: "none" } }} onClick={() => setSelectedFriend(null)}>
                <ArrowBack />
              </IconButton>
              <Avatar
                src={selectedFriend.picturePath ? (selectedFriend.picturePath.startsWith("http") ? selectedFriend.picturePath : `${API_BASE_URL}/assets/${selectedFriend.picturePath}`) : undefined}
                sx={{ width: 44, height: 44, border: "2px solid rgba(0,213,250,0.5)", boxShadow: "0 0 10px rgba(0,213,250,0.3)" }}
              />
              <Box>
                <Typography fontWeight="700" fontSize="1rem">{selectedFriend.firstName} {selectedFriend.lastName}</Typography>
                <Typography fontSize="0.75rem" color={palette.neutral.medium}>{selectedFriend.occupation}</Typography>
              </Box>
            </Box>

            {/* Messages scroll area */}
            <Box
              sx={{
                flex: 1, overflowY: "auto", p: { xs: "1rem", md: "1.2rem 1.5rem" },
                display: "flex", flexDirection: "column", gap: "0.6rem",
                "&::-webkit-scrollbar": { width: "5px" },
                "&::-webkit-scrollbar-thumb": {
                  background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                  borderRadius: "10px",
                },
              }}
            >
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user._id;
                return (
                  <Box
                    key={msg._id || i}
                    sx={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: "0.5rem" }}
                  >
                    {!isMe && (
                      <Avatar
                        src={selectedFriend.picturePath ? (selectedFriend.picturePath.startsWith("http") ? selectedFriend.picturePath : `${API_BASE_URL}/assets/${selectedFriend.picturePath}`) : undefined}
                        sx={{ width: 28, height: 28, border: "1.5px solid rgba(0,213,250,0.4)" }}
                      />
                    )}
                    <MessageBubble msg={msg} isMe={isMe} palette={palette} isDark={isDark} />
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            {uploading && (
              <LinearProgress
                sx={{
                  mx: "1.5rem",
                  borderRadius: "4px",
                  "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #00D5FA, #0077FF)" },
                }}
              />
            )}

            {/* Input bar */}
            <Box
              sx={{
                p: { xs: "0.75rem 0.8rem", md: "0.85rem 1.2rem" },
                borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.60)",
                backdropFilter: "blur(12px)",
                display: "flex", gap: "0.5rem", alignItems: "center",
              }}
            >
              <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt" style={{ display: "none" }} onChange={handleFilePick} />

              <Tooltip title="Attach file or image">
                <IconButton
                  onClick={() => fileInputRef.current.click()}
                  size="small"
                  sx={{
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    "&:hover": { background: "rgba(0,213,250,0.18)" },
                    transition: "background 0.18s",
                  }}
                >
                  <AttachFile fontSize="small" />
                </IconButton>
              </Tooltip>

              <TextField
                fullWidth
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(newMsg); } }}
                placeholder={recording ? "🔴 Recording… click stop to send" : `Message ${selectedFriend.firstName}…`}
                disabled={recording}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "2rem",
                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(8px)",
                    "& fieldset": {
                      borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
                    },
                    "&:hover fieldset": { borderColor: "#00D5FA" },
                    "&.Mui-focused fieldset": { borderColor: "#00D5FA" },
                  },
                  "& input": { px: "1.1rem", py: "0.6rem" },
                }}
              />

              {!newMsg.trim() && !recording && (
                <Tooltip title="Record voice message">
                  <IconButton
                    onClick={startRecording}
                    size="small"
                    sx={{
                      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                      "&:hover": { background: "rgba(0,213,250,0.18)" },
                      transition: "background 0.18s",
                    }}
                  >
                    <Mic fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {recording && (
                <Tooltip title="Stop & send voice message">
                  <IconButton
                    onClick={stopRecording}
                    size="small"
                    sx={{
                      background: "rgba(255,60,60,0.15)",
                      animation: `${pulseAnim} 1s infinite`,
                    }}
                  >
                    <Stop fontSize="small" sx={{ color: "#ff3c3c" }} />
                  </IconButton>
                </Tooltip>
              )}

              {newMsg.trim() && !recording && (
                <Tooltip title="Send">
                  <IconButton
                    onClick={() => sendMessage(newMsg)}
                    size="small"
                    sx={{
                      background: "linear-gradient(135deg, #00D5FA 0%, #0077FF 100%)",
                      color: "#fff",
                      "&:hover": { opacity: 0.88, transform: "scale(1.07)" },
                      transition: "all 0.18s",
                      boxShadow: "0 3px 12px rgba(0,213,250,0.4)",
                    }}
                  >
                    <Send fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "1rem",
              borderRadius: "18px",
              background: isDark ? "rgba(10,10,18,0.50)" : "rgba(255,255,255,0.40)",
              backdropFilter: "blur(20px)",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            }}
          >
            <Box
              sx={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #00D5FA 0%, #0077FF 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 30px rgba(0,213,250,0.4)",
                mb: "0.5rem",
              }}
            >
              <Send sx={{ color: "#fff", fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight="700" sx={{ background: "linear-gradient(135deg, #00D5FA, #0077FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Your Messages
            </Typography>
            <Typography fontSize="0.9rem" color={palette.neutral.medium}>
              Select a friend from the left to start chatting
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessagesPage;
