import {
  EditOutlined,
  DeleteOutlined,
  ImageOutlined,
  VideoLibraryOutlined,
  MoreHorizOutlined,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  Typography,
  InputBase,
  useTheme,
  Button,
  IconButton,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import API_BASE_URL from "config";
import Dropzone from "react-dropzone";
import UserImage from "components/UserImage";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";

const MyPostWidget = ({ picturePath }) => {
  const dispatch = useDispatch();
  const [isImage, setIsImage] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [post, setPost] = useState("");
  const { palette } = useTheme();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;

  const handlePost = async () => {
    const formData = new FormData();
    formData.append("userId", _id);
    formData.append("description", post);
    if (image) {
      formData.append("picture", image);
      formData.append("picturePath", image.name);
    }
    if (video) {
      formData.append("picture", video);
      formData.append("picturePath", video.name);
    }

    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const posts = await response.json();
    dispatch(setPosts({ posts }));
    setImage(null);
    setVideo(null);
    setIsImage(false);
    setIsVideo(false);
    setPost("");
  };

  const handleImageToggle = () => {
    setIsImage(!isImage);
    setIsVideo(false);
    setVideo(null);
  };

  const handleVideoToggle = () => {
    setIsVideo(!isVideo);
    setIsImage(false);
    setImage(null);
  };

  return (
    <WidgetWrapper>
      <FlexBetween gap="1.5rem">
        <UserImage image={picturePath} />
        <InputBase
          placeholder="What's on your mind..."
          onChange={(e) => setPost(e.target.value)}
          value={post}
          sx={{
            width: "100%",
            backgroundColor: palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            borderRadius: "2rem",
            padding: "0.85rem 1.5rem",
            fontSize: "0.95rem",
            border: `1px solid ${palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(100,116,139,0.2)"}`,
            transition: "all 0.2s",
            "&:focus-within": { 
              borderColor: palette.mode === "dark" ? "#00D5FA" : "#00A0BC",
              boxShadow: `0 0 0 3px ${palette.mode === "dark" ? "rgba(0,213,250,0.2)" : "rgba(0,160,188,0.2)"}`
            },
          }}
        />
      </FlexBetween>

      {/* Image Dropzone */}
      {isImage && (
        <Box border={`1px solid ${medium}`} borderRadius="8px" mt="1rem" p="1rem">
          <Dropzone
            accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif"] }}
            multiple={false}
            onDrop={(acceptedFiles) => setImage(acceptedFiles[0])}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p="1rem"
                  width="100%"
                  borderRadius="8px"
                  sx={{ "&:hover": { cursor: "pointer", backgroundColor: palette.neutral.light } }}
                >
                  <input {...getInputProps()} />
                  {!image ? (
                    <Typography color={mediumMain} textAlign="center">
                      📷 Click or drag an image here
                    </Typography>
                  ) : (
                    <FlexBetween>
                      <Typography>{image.name}</Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {image && (
                  <Tooltip title="Remove">
                    <IconButton onClick={() => setImage(null)} sx={{ ml: 1 }}>
                      <DeleteOutlined />
                    </IconButton>
                  </Tooltip>
                )}
              </FlexBetween>
            )}
          </Dropzone>
        </Box>
      )}

      {/* Video Dropzone */}
      {isVideo && (
        <Box border={`1px solid ${medium}`} borderRadius="8px" mt="1rem" p="1rem">
          <Dropzone
            accept={{ "video/*": [".mp4", ".mov", ".webm", ".avi"] }}
            multiple={false}
            onDrop={(acceptedFiles) => setVideo(acceptedFiles[0])}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p="1rem"
                  width="100%"
                  borderRadius="8px"
                  sx={{ "&:hover": { cursor: "pointer", backgroundColor: palette.neutral.light } }}
                >
                  <input {...getInputProps()} />
                  {!video ? (
                    <Typography color={mediumMain} textAlign="center">
                      🎬 Click or drag a video here (.mp4, .mov, .webm)
                    </Typography>
                  ) : (
                    <FlexBetween>
                      <Typography>{video.name}</Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {video && (
                  <Tooltip title="Remove">
                    <IconButton onClick={() => setVideo(null)} sx={{ ml: 1 }}>
                      <DeleteOutlined />
                    </IconButton>
                  </Tooltip>
                )}
              </FlexBetween>
            )}
          </Dropzone>
        </Box>
      )}

      <Divider sx={{ margin: "1.25rem 0" }} />

      <FlexBetween>
        {/* Image button */}
        <Tooltip title="Add Photo">
          <FlexBetween
            gap="0.25rem"
            onClick={handleImageToggle}
            sx={{
              cursor: "pointer",
              px: "0.75rem",
              py: "0.4rem",
              borderRadius: "0.5rem",
              backgroundColor: isImage ? palette.primary.light + "22" : "transparent",
              "&:hover": { backgroundColor: palette.neutral.light },
              transition: "background-color 0.2s",
            }}
          >
            <ImageOutlined sx={{ color: isImage ? palette.primary.main : mediumMain }} />
            <Typography color={isImage ? palette.primary.main : mediumMain} fontWeight={isImage ? 600 : 400}>
              Photo
            </Typography>
          </FlexBetween>
        </Tooltip>

        {/* Video button */}
        {isNonMobileScreens && (
          <Tooltip title="Add Video">
            <FlexBetween
              gap="0.25rem"
              onClick={handleVideoToggle}
              sx={{
                cursor: "pointer",
                px: "0.75rem",
                py: "0.4rem",
                borderRadius: "0.5rem",
                backgroundColor: isVideo ? palette.primary.light + "22" : "transparent",
                "&:hover": { backgroundColor: palette.neutral.light },
                transition: "background-color 0.2s",
              }}
            >
              <VideoLibraryOutlined sx={{ color: isVideo ? palette.primary.main : mediumMain }} />
              <Typography color={isVideo ? palette.primary.main : mediumMain} fontWeight={isVideo ? 600 : 400}>
                Video
              </Typography>
            </FlexBetween>
          </Tooltip>
        )}

        {!isNonMobileScreens && (
          <FlexBetween gap="0.25rem">
            <MoreHorizOutlined sx={{ color: mediumMain }} />
          </FlexBetween>
        )}

        <Button
          disabled={!post && !image && !video}
          onClick={handlePost}
          sx={{
            color: "#ffffff",
            background: "linear-gradient(135deg,#00D5FA,#0077FF)",
            borderRadius: "3rem",
            px: "1.75rem",
            fontWeight: 600,
            transition: "all 0.2s",
            "&:hover": { opacity: 0.9, transform: "scale(1.02)", boxShadow: "0 4px 12px rgba(0,213,250,0.3)" },
            "&:disabled": { background: palette.neutral.light, color: palette.neutral.medium, opacity: 0.6, boxShadow: "none" },
          }}
        >
          POST
        </Button>
      </FlexBetween>
    </WidgetWrapper>
  );
};

export default MyPostWidget;
