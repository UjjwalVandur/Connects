import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputBase,
  Typography,
  useTheme,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
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
  const [likeAnim, setLikeAnim] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  const patchLike = async () => {
    // Trigger animation
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 300);

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

  // Parse comment "Name::text" format
  const parseComment = (comment) => {
    const sep = comment.indexOf("::");
    if (sep === -1) return { author: "User", text: comment };
    return { author: comment.substring(0, sep), text: comment.substring(sep + 2) };
  };

  return (
    <WidgetWrapper m="2rem 0">
      <Friend
        friendId={postUserId}
        name={name}
        subtitle={location}
        userPicturePath={userPicturePath}
      />
      <Typography color={main} sx={{ mt: "1rem" }}>
        {description}
      </Typography>

      {/* Post Image with double-click to like */}
      {picturePath && (
        <Box sx={{ position: "relative" }}>
          <img
            width="100%"
            height="auto"
            alt="post"
            onDoubleClick={patchLike}
            style={{
              cursor: "pointer",
              borderRadius: "0.75rem",
              marginTop: "0.75rem",
              display: "block",
            }}
            src={`${API_BASE_URL}/assets/${picturePath}`}
          />
        </Box>
      )}

      {/* Post Video */}
      {videoPath && (
        <Box mt="0.75rem" borderRadius="0.75rem" overflow="hidden">
          <video
            controls
            width="100%"
            style={{ borderRadius: "0.75rem", display: "block" }}
            src={`${API_BASE_URL}/assets/${videoPath}`}
          />
        </Box>
      )}

      {/* Actions Row */}
      <FlexBetween mt="0.5rem">
        <FlexBetween gap="1rem">
          {/* Like */}
          <FlexBetween gap="0.3rem">
            <Tooltip title={isLiked ? "Unlike" : "Like"}>
              <IconButton
                onClick={patchLike}
                sx={{
                  transition: "transform 0.15s ease",
                  transform: likeAnim ? "scale(1.35)" : "scale(1)",
                }}
              >
                {isLiked ? (
                  <FavoriteOutlined sx={{ color: primary }} />
                ) : (
                  <FavoriteBorderOutlined />
                )}
              </IconButton>
            </Tooltip>
            <Typography
              fontWeight="600"
              sx={{
                transition: "color 0.2s",
                color: isLiked ? primary : main,
              }}
            >
              {likeCount}
            </Typography>
          </FlexBetween>

          {/* Comment */}
          <FlexBetween gap="0.3rem">
            <Tooltip title="Comments">
              <IconButton onClick={() => setIsComments(!isComments)}>
                <ChatBubbleOutlineOutlined />
              </IconButton>
            </Tooltip>
            <Typography>{comments.length}</Typography>
          </FlexBetween>
        </FlexBetween>

        {/* Share */}
        <Tooltip title="Copy link">
          <IconButton onClick={handleShare}>
            <ShareOutlined />
          </IconButton>
        </Tooltip>
      </FlexBetween>

      {/* Comments section */}
      {isComments && (
        <Box mt="0.5rem">
          {comments.map((comment, i) => {
            const { author, text } = parseComment(comment);
            return (
              <Box key={`${name}-${i}`}>
                <Divider />
                <Box sx={{ display: "flex", gap: "0.5rem", m: "0.5rem 0", pl: "1rem", alignItems: "baseline" }}>
                  <Typography
                    fontWeight="700"
                    fontSize="0.85rem"
                    color={primary}
                  >
                    {author}
                  </Typography>
                  <Typography color={main} fontSize="0.9rem">
                    {text}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          <Divider />
          <FlexBetween mt="0.75rem" gap="0.5rem">
            <InputBase
              placeholder="Add a comment..."
              onChange={(e) => setNewComment(e.target.value)}
              value={newComment}
              fullWidth
              sx={{
                backgroundColor: palette.neutral.light,
                borderRadius: "1.5rem",
                padding: "0.5rem 1.5rem",
                fontSize: "0.9rem",
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
                px: "1.5rem",
                "&:hover": { backgroundColor: palette.primary.dark },
                "&:disabled": { opacity: 0.5 },
              }}
            >
              Post
            </Button>
          </FlexBetween>
        </Box>
      )}

      {/* Share snackbar */}
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
    </WidgetWrapper>
  );
};

export default PostWidget;
