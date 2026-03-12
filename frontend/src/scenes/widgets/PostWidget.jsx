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
import { setPost } from "state";
import API_BASE_URL from "config";

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
      src={`${API_BASE_URL}/assets/${picturePath}`}
    />
  ) : videoPath ? (
    <Box borderRadius="0.75rem" overflow="hidden">
      <video
        controls
        width="100%"
        style={{ borderRadius: "0.75rem", display: "block" }}
        src={`${API_BASE_URL}/assets/${videoPath}`}
      />
    </Box>
  ) : null;

  /* ── Comments section (rendered as children of SocialCard) ── */
  const commentsNode = isComments && (
    <Box sx={{ px: "1.25rem", pb: "1rem", pt: "0.25rem" }}>
      {comments.map((comment, i) => {
        const { author, text } = parseComment(comment);
        return (
          <Box key={`${name}-${i}`}>
            <Divider
              sx={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(0,0,0,0.07)",
              }}
            />
            <Box sx={{ display: "flex", gap: "0.5rem", m: "0.5rem 0", alignItems: "baseline" }}>
              <Typography fontWeight="700" fontSize="0.8rem" color={palette.primary.main}>
                {author}
              </Typography>
              <Typography
                fontSize="0.85rem"
                sx={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)" }}
              >
                {text}
              </Typography>
            </Box>
          </Box>
        );
      })}
      <Divider
        sx={{
          borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
          mb: "0.75rem",
        }}
      />
      <Box sx={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <InputBase
          placeholder="Add a comment…"
          onChange={(e) => setNewComment(e.target.value)}
          value={newComment}
          fullWidth
          sx={{
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            borderRadius: "1.5rem",
            padding: "0.4rem 1.2rem",
            fontSize: "0.85rem",
            color: isDark ? "#fff" : "#1a1a1a",
          }}
          onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
        />
        <Button
          onClick={submitComment}
          disabled={!newComment.trim()}
          sx={{
            color: palette.background.alt,
            backgroundColor: palette.primary.main,
            borderRadius: "2rem",
            px: "1.2rem",
            fontSize: "0.8rem",
            minWidth: "unset",
            whiteSpace: "nowrap",
            "&:hover": { backgroundColor: palette.primary.dark },
            "&:disabled": { opacity: 0.5 },
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
            ? `${API_BASE_URL}/assets/${userPicturePath}`
            : undefined,
        }}
        content={{
          text: description,
          media: mediaBlock,
        }}
        engagement={{
          isLiked,
          isBookmarked: false,
          likes: likeCount,
          comments: comments.length,
        }}
        onLike={patchLike}
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
