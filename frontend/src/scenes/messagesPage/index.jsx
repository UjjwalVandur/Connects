import { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Avatar, TextField, IconButton,
  List, ListItem, ListItemAvatar, ListItemText,
  useTheme, InputAdornment
} from "@mui/material";
import { Send, ArrowBack } from "@mui/icons-material";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import API_BASE_URL from "config";
import { useSocket } from "context/SocketContext";

const MessagesPage = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);
  const { palette } = useTheme();
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const socketRef = useSocket();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Load friends list
  useEffect(() => {
    fetch(`${API_BASE_URL}/users/${user._id}/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setFriends);
  }, [user._id, token]);

  // Load messages when a friend is selected
  useEffect(() => {
    if (!selectedFriend) return;
    fetch(`${API_BASE_URL}/messages/${selectedFriend._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      });
  }, [selectedFriend, token]);

  // Listen for incoming messages via socket
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const handler = (msg) => {
      if (
        selectedFriend &&
        (msg.senderId === selectedFriend._id || msg.receiverId === selectedFriend._id)
      ) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      }
    };
    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, [socketRef, selectedFriend]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedFriend) return;
    const text = newMsg.trim();
    setNewMsg("");

    const res = await fetch(`${API_BASE_URL}/messages/${selectedFriend._id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    const saved = await res.json();
    setMessages((prev) => [...prev, saved]);
    setTimeout(scrollToBottom, 50);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Friends Sidebar */}
        <Box
          sx={{
            width: { xs: selectedFriend ? 0 : "100%", md: "300px" },
            overflow: "hidden",
            borderRight: `1px solid ${palette.divider}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" fontWeight="700" p="1rem 1.5rem" borderBottom={`1px solid ${palette.divider}`}>
            Messages
          </Typography>
          <List sx={{ overflow: "auto", flex: 1 }}>
            {friends.length === 0 && (
              <Typography color={palette.neutral.medium} p="1rem" fontSize="0.85rem">
                No friends yet. Add friends to start chatting!
              </Typography>
            )}
            {friends.map((f) => (
              <ListItem
                key={f._id}
                button
                selected={selectedFriend?._id === f._id}
                onClick={() => setSelectedFriend(f)}
                sx={{
                  "&.Mui-selected": { backgroundColor: palette.primary.light + "22" },
                  "&:hover": { backgroundColor: palette.neutral.light },
                  cursor: "pointer",
                  px: "1.5rem",
                  py: "0.75rem",
                }}
              >
                <ListItemAvatar>
                  <Avatar src={f.picturePath ? `${API_BASE_URL}/assets/${f.picturePath}` : undefined}>
                    {f.firstName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography fontWeight="600">{f.firstName} {f.lastName}</Typography>}
                  secondary={<Typography fontSize="0.75rem" color={palette.neutral.medium}>{f.occupation}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Conversation Area */}
        {selectedFriend ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Chat Header */}
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
                  <Box
                    key={msg._id || i}
                    sx={{
                      display: "flex",
                      flexDirection: isMe ? "row-reverse" : "row",
                      alignItems: "flex-end",
                      gap: "0.4rem",
                    }}
                  >
                    {!isMe && (
                      <Avatar src={selectedFriend.picturePath ? `${API_BASE_URL}/assets/${selectedFriend.picturePath}` : undefined} sx={{ width: 28, height: 28 }} />
                    )}
                    <Box
                      sx={{
                        maxWidth: "65%",
                        backgroundColor: isMe ? palette.primary.main : palette.neutral.light,
                        color: isMe ? "#fff" : palette.neutral.dark,
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        px: "1rem",
                        py: "0.5rem",
                      }}
                    >
                      <Typography fontSize="0.9rem">{msg.text}</Typography>
                      <Typography fontSize="0.65rem" opacity={0.7} textAlign={isMe ? "right" : "left"} mt="2px">
                        {formatTime(msg.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: "0.75rem 1.5rem", borderTop: `1px solid ${palette.divider}`, backgroundColor: palette.background.alt, display: "flex", gap: "0.5rem" }}>
              <TextField
                fullWidth
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message ${selectedFriend.firstName}...`}
                variant="outlined"
                size="small"
                sx={{ "& fieldset": { borderRadius: "2rem" }, "& input": { px: "1.2rem" } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={sendMessage} disabled={!newMsg.trim()} color="primary">
                        <Send />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
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
