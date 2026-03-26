import {
  Box,
  Button,
  Divider,
  InputBase,
  Typography,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import Friend from "components/Friend";
import { SocialCard } from "components/ui/social-card";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPost, setSavedPosts } from "state";
import API_BASE_URL from "config";
import { User as UserIcon } from "lucide-react";

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  videoPath,
  userPicturePath,
  likes,
  comments,
}) => {
  const [isComments, setIsComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const mode = useSelector((state) => state.mode);
  const isDark = mode === "dark";

  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;
  const { palette } = useTheme();

  const savedPosts = useSelector((state) => state.user.savedPosts || []);
  const isBookmarked = savedPosts.includes(postId);

  /* ── API actions ─────────────────────────────────────── */
  const patchLike = async () => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    setSnackOpen(true);
  };

  const patchSave = async () => {
    const response = await fetch(`${API_BASE_URL}/users/${loggedInUserId}/savePost/${postId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
        const updatedUser = await response.json();
        dispatch(setSavedPosts({ savedPosts: updatedUser.savedPosts }));
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: newComment }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
    setNewComment("");
  };

  const parseComment = (comment) => {
    const sep = comment.indexOf("::");
    if (sep === -1) return { author: "User", text: comment };
    return { author: comment.substring(0, sep), text: comment.substring(sep + 2) };
  };

  /* ── Media block ─────────────────────────────────────── */
  const mediaBlock = picturePath ? (
    <img
      width="100%"
      height="auto"
      alt="post"
      onDoubleClick={patchLike}
      style={{ cursor: "pointer", borderRadius: "0.75rem", display: "block" }}
      src={picturePath?.startsWith("http") ? picturePath : `${API_BASE_URL}/assets/${picturePath}`}
    />
  ) : videoPath ? (
    <Box borderRadius="0.75rem" overflow="hidden">
      <video
        controls
        width="100%"
        style={{ borderRadius: "0.75rem", display: "block" }}
        src={videoPath?.startsWith("http") ? videoPath : `${API_BASE_URL}/assets/${videoPath}`}
      />
    </Box>
  ) : null;

  /* ── Colour tokens for comments (matching ActivityDropdown) ── */
  const bg          = isDark ? "rgba(13,17,23,0.96)"       : "rgba(255,255,255,0.96)";
  const border      = isDark ? "rgba(255,255,255,0.09)"     : "rgba(100,116,139,0.18)";
  const textPrimary = isDark ? "#ffffff"                    : "#0f172a";
  const textMuted   = isDark ? "rgba(255,255,255,0.55)"     : "#64748b";
  const iconBg      = isDark ? "rgba(255,255,255,0.08)"     : "rgba(0,0,0,0.05)";
  const iconColor   = isDark ? "rgba(255,255,255,0.7)"      : "#334155";
  const hoverBg     = isDark ? "rgba(255,255,255,0.05)"     : "rgba(0,0,0,0.03)";

  /* ── Comments section (rendered as children of SocialCard) ── */
  const commentsNode = isComments && (
    <Box
      sx={{
        width: "100%",
        borderRadius: "14px",
        overflow: "hidden",
        background: bg,
        backdropFilter: "blur(20px)",
        border: `1px solid ${border}`,
        boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 24px rgba(0,0,0,0.1)",
        mt: "1rem",
        mb: "0.5rem"
      }}
    >
      <Box sx={{ p: "0.75rem", display: "flex", flexDirection: "column", gap: "2px" }}>
        {comments.map((comment, i) => {
          const { author, text } = parseComment(comment);
          return (
            <Box
              key={`${name}-${i}`}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                borderRadius: "12px",
                padding: "0.75rem",
                background: "transparent",
                transition: "all 0.3s ease",
                cursor: "default",
                "&:hover": { background: hoverBg }
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  background: iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: iconColor,
                }}
              >
                <UserIcon style={{ width: 18, height: 18 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ margin: 0, fontWeight: 600, fontSize: "0.82rem", color: textPrimary }}>
                  {author}
                </Typography>
                <Typography sx={{ margin: 0, fontSize: "0.78rem", color: textMuted, wordBreak: "break-word" }}>
                  {text}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Divider sx={{ borderColor: border }} />
      
      <Box sx={{ display: "flex", gap: "0.75rem", p: "0.75rem", alignItems: "center" }}>
        <InputBase
          placeholder="Add a comment…"
          onChange={(e) => setNewComment(e.target.value)}
          value={newComment}
          fullWidth
          sx={{
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            borderRadius: "1.5rem",
            padding: "0.4rem 1.2rem",
            fontSize: "0.85rem",
            color: isDark ? "#fff" : "#1a1a1a",
            transition: "border-color 0.2s, background-color 0.2s",
            "&:focus-within": {
              borderColor: isDark ? "#00D5FA" : "#00A0BC",
              backgroundColor: isDark ? "rgba(0,213,250,0.05)" : "rgba(0,160,188,0.05)"
            }
          }}
          onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
        />
        <Button
          onClick={submitComment}
          disabled={!newComment.trim()}
          sx={{
            color: palette.background.alt,
            backgroundColor: isDark ? "#00D5FA" : "#00A0BC",
            borderRadius: "2rem",
            px: "1.2rem",
            fontSize: "0.8rem",
            fontWeight: "600",
            minWidth: "unset",
            whiteSpace: "nowrap",
            boxShadow: `0 4px 12px ${isDark ? "rgba(0,213,250,0.3)" : "rgba(0,160,188,0.3)"}`,
            "&:hover": { 
              backgroundColor: isDark ? "#00b5d6" : "#00859c",
              boxShadow: `0 6px 16px ${isDark ? "rgba(0,213,250,0.4)" : "rgba(0,160,188,0.4)"}`,
            },
            "&:disabled": { 
              opacity: 0.5,
              backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
              color: textMuted,
              boxShadow: "none"
            },
          }}
        >
          Post
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <SocialCard
        isDark={isDark}
        author={{
          name,
          subtitle: location,
          avatar: userPicturePath
            ? (userPicturePath.startsWith("http") ? userPicturePath : `${API_BASE_URL}/assets/${userPicturePath}`)
            : undefined,
        }}
        content={{
          text: description,
          media: mediaBlock,
        }}
        engagement={{
          isLiked,
          isBookmarked,
          likes: likeCount,
          comments: comments.length,
        }}
        onLike={patchLike}
        onBookmark={patchSave}
        onComment={() => setIsComments((v) => !v)}
        onShare={handleShare}
        headerExtra={
          <Friend
            friendId={postUserId}
            name={name}
            subtitle={location}
            userPicturePath={userPicturePath}
          />
        }
        className="mb-4"
      >
        {commentsNode}
      </SocialCard>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default PostWidget;
