import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Typography, Avatar, TextField, IconButton,
  List, ListItem, ListItemAvatar, ListItemText,
  useTheme, InputAdornment, Tooltip, Menu, MenuItem,
  LinearProgress, Chip,
} from "@mui/material";
import {
  Send, ArrowBack, AttachFile, Mic, MicOff, Stop,
  Image as ImageIcon, InsertDriveFile, PlayArrow,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "scenes/navbar";
import API_BASE_URL from "config";
import { useSocket } from "context/SocketContext";

/* ── Bubble for rendering a message ──────────────────────────── */
const MessageBubble = ({ msg, isMe, friendPic, API_BASE_URL, palette }) => {
  const hasMedia = !!msg.mediaPath;
  const isImage  = msg.mediaType === "image";
  const isAudio  = msg.mediaType === "audio";
  const isVideo  = msg.mediaType === "video";
  const isFile   = msg.mediaType === "file";

  return (
    <Box sx={{ maxWidth: "72%", backgroundColor: isMe ? palette.primary.main : palette.neutral.light, color: isMe ? "#fff" : palette.neutral.dark, borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", px: "1rem", py: "0.5rem" }}>
      {hasMedia && isImage && (
        <img src={`${API_BASE_URL}/assets/${msg.mediaPath}`} alt="img" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, display: "block", marginBottom: msg.text ? "0.4rem" : 0 }} />
      )}
      {hasMedia && isVideo && (
        <video src={`${API_BASE_URL}/assets/${msg.mediaPath}`} controls style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, display: "block", marginBottom: msg.text ? "0.4rem" : 0 }} />
      )}
      {hasMedia && isAudio && (
        <audio src={`${API_BASE_URL}/assets/${msg.mediaPath}`} controls style={{ width: "100%", marginBottom: msg.text ? "0.4rem" : 0 }} />
      )}
      {hasMedia && isFile && (
        <a href={`${API_BASE_URL}/assets/${msg.mediaPath}`} target="_blank" rel="noreferrer" download style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "inherit", textDecoration: "none", marginBottom: msg.text ? "0.4rem" : 0 }}>
          <InsertDriveFile fontSize="small" />
          <Typography fontSize="0.82rem" sx={{ wordBreak: "break-all" }}>{msg.fileName || msg.mediaPath}</Typography>
        </a>
      )}
      {msg.text && <Typography fontSize="0.9rem">{msg.text}</Typography>}
      <Typography fontSize="0.65rem" sx={{ opacity: 0.7, mt: "2px", textAlign: isMe ? "right" : "left" }}>
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Typography>
    </Box>
  );
};

const MessagesPage = () => {
  const [friends,         setFriends]         = useState([]);
  const [selectedFriend,  setSelectedFriend]  = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [newMsg,          setNewMsg]          = useState("");
  const [recording,       setRecording]       = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const mediaRecorder  = useRef(null);
  const audioChunks    = useRef([]);
  const { palette }    = useTheme();
  const navigate       = useNavigate();
  const user           = useSelector((s) => s.user);
  const token          = useSelector((s) => s.token);
  const socketRef      = useSocket();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Load friends
  useEffect(() => {
    fetch(`${API_BASE_URL}/users/${user._id}/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then(setFriends);
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

  /* ── Send text or file ───────────────────────────────────── */
  const sendMessage = async (text = "", file = null) => {
    if (!selectedFriend) return;
    if (!text.trim() && !file) return;
    setUploading(true);

    const fd = new FormData();
    if (text.trim()) fd.append("text", text.trim());
    if (file) fd.append("media", file, file.name || "voice.webm");

    const res  = await fetch(`${API_BASE_URL}/messages/${selectedFriend._id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const saved = await res.json();
    setMessages((p) => [...p, saved]);
    setNewMsg("");
    setUploading(false);
    setTimeout(scrollToBottom, 50);
  };

  /* ── Voice recording ─────────────────────────────────────── */
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
    } catch {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  /* ── File picker ─────────────────────────────────────────── */
  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (file) sendMessage("", file);
    e.target.value = "";
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Friends Sidebar ─────────────────────────────── */}
        <Box sx={{ width: { xs: selectedFriend ? 0 : "100%", md: "300px" }, overflow: "hidden", borderRight: `1px solid ${palette.divider}`, display: "flex", flexDirection: "column" }}>
          {/* Back to home */}
          <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem", p: "0.75rem 1rem", borderBottom: `1px solid ${palette.divider}`, backgroundColor: palette.background.alt }}>
            <IconButton onClick={() => navigate("/home")} size="small">
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight="700">Messages</Typography>
          </Box>
          <List sx={{ overflow: "auto", flex: 1 }}>
            {friends.length === 0 && (
              <Typography color={palette.neutral.medium} p="1rem" fontSize="0.85rem">
                Add friends to start chatting!
              </Typography>
            )}
            {friends.map((f) => (
              <ListItem key={f._id} button selected={selectedFriend?._id === f._id}
                onClick={() => setSelectedFriend(f)}
                sx={{ "&.Mui-selected": { backgroundColor: palette.primary.light + "22" }, "&:hover": { backgroundColor: palette.neutral.light }, cursor: "pointer", px: "1.2rem", py: "0.7rem" }}
              >
                <ListItemAvatar>
                  <Avatar src={f.picturePath ? `${API_BASE_URL}/assets/${f.picturePath}` : undefined}>{f.firstName?.[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography fontWeight="600" fontSize="0.95rem">{f.firstName} {f.lastName}</Typography>}
                  secondary={<Typography fontSize="0.75rem" color={palette.neutral.medium}>{f.occupation}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* ── Conversation Area ────────────────────────────── */}
        {selectedFriend ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Chat header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: "1rem", p: "0.75rem 1.5rem", borderBottom: `1px solid ${palette.divider}`, backgroundColor: palette.background.alt }}>
              <IconButton sx={{ display: { md: "none" } }} onClick={() => setSelectedFriend(null)}>
                <ArrowBack />
              </IconButton>
              <Avatar src={selectedFriend.picturePath ? `${API_BASE_URL}/assets/${selectedFriend.picturePath}` : undefined} sx={{ width: 40, height: 40 }} />
              <Box>
                <Typography fontWeight="700">{selectedFriend.firstName} {selectedFriend.lastName}</Typography>
                <Typography fontSize="0.75rem" color={palette.neutral.medium}>{selectedFriend.occupation}</Typography>
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: "auto", p: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user._id;
                return (
                  <Box key={msg._id || i} sx={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: "0.4rem" }}>
                    {!isMe && (
                      <Avatar src={selectedFriend.picturePath ? `${API_BASE_URL}/assets/${selectedFriend.picturePath}` : undefined} sx={{ width: 26, height: 26 }} />
                    )}
                    <MessageBubble msg={msg} isMe={isMe} palette={palette} API_BASE_URL={API_BASE_URL} />
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            {uploading && <LinearProgress sx={{ mx: "1.5rem" }} />}

            {/* Input bar */}
            <Box sx={{ p: "0.75rem 1.5rem", borderTop: `1px solid ${palette.divider}`, backgroundColor: palette.background.alt, display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt" style={{ display: "none" }} onChange={handleFilePick} />

              {/* Attach file */}
              <Tooltip title="Attach file or image">
                <IconButton onClick={() => fileInputRef.current.click()} size="small" color="default">
                  <AttachFile />
                </IconButton>
              </Tooltip>

              {/* Text input */}
              <TextField
                fullWidth
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(newMsg); } }}
                placeholder={recording ? "🔴 Recording... click stop to send" : `Message ${selectedFriend.firstName}...`}
                disabled={recording}
                variant="outlined"
                size="small"
                sx={{ "& fieldset": { borderRadius: "2rem" }, "& input": { px: "1rem" } }}
              />

              {/* Voice record */}
              {!newMsg.trim() && !recording && (
                <Tooltip title="Hold to record voice message">
                  <IconButton onClick={startRecording} color="default" size="small">
                    <Mic />
                  </IconButton>
                </Tooltip>
              )}
              {recording && (
                <Tooltip title="Stop & send voice message">
                  <IconButton onClick={stopRecording} color="error" size="small">
                    <Stop />
                  </IconButton>
                </Tooltip>
              )}

              {/* Send text */}
              {newMsg.trim() && !recording && (
                <Tooltip title="Send">
                  <IconButton onClick={() => sendMessage(newMsg)} color="primary" size="small">
                    <Send />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: { xs: "none", md: "flex" }, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", color: palette.neutral.medium }}>
            <Typography variant="h5" fontWeight="600">Select a conversation</Typography>
            <Typography fontSize="0.9rem">Choose a friend from the left to start chatting</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessagesPage;
