import { Box, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import FreelancerProfileCardWidget from "scenes/widgets/FreelancerProfileCardWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import AdvertWidget from "scenes/widgets/AdvertWidget";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import CanvasRevealEffect from "components/ui/CanvasRevealEffect";

const HomePage = () => {
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const { _id, picturePath } = useSelector((state) => state.user);
  const mode = useSelector((state) => state.mode);
  const isDark = mode === "dark";

  const canvasColors = isDark
    ? [[0, 229, 255], [0, 119, 255], [120, 80, 240]]
    : [[99, 102, 241], [139, 92, 246], [59, 130, 246]];

  const bgColor = isDark ? "#000" : "#f8faff";
  const radialOverlay = isDark
    ? "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)"
    : "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(248,250,255,0.88) 0%, rgba(248,250,255,0.5) 60%, transparent 100%)";
  const topFade = isDark
    ? "linear-gradient(to bottom, #000 0%, transparent 100%)"
    : "linear-gradient(to bottom, #f8faff 0%, transparent 100%)";
  const bottomFade = isDark
    ? "linear-gradient(to top, #000 0%, transparent 100%)"
    : "linear-gradient(to top, #f8faff 0%, transparent 100%)";

  return (
    <Box style={{ position: "relative", minHeight: "100vh", backgroundColor: bgColor }}>
      {/* Theme-aware canvas background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <CanvasRevealEffect
          colors={canvasColors}
          dotSize={2}
          spacing={20}
          speed={0.9}
        />
        <div style={{ position: "absolute", inset: 0, background: radialOverlay }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "120px", background: topFade }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "120px", background: bottomFade }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <Box
          width="100%"
          padding="2rem 6%"
          display={isNonMobileScreens ? "flex" : "block"}
          gap="0.5rem"
          justifyContent="space-between"
        >
          {/* Left column — Freelancer Profile Card */}
          <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
            <FreelancerProfileCardWidget userId={_id} picturePath={picturePath} />
          </Box>

          {/* Center column — post composer + feed */}
          <Box
            flexBasis={isNonMobileScreens ? "42%" : undefined}
            mt={isNonMobileScreens ? undefined : "2rem"}
          >
            <MyPostWidget picturePath={picturePath} />
            <Box mt="1.5rem">
              <PostsWidget userId={_id} />
            </Box>
          </Box>

          {/* Right column — ads + friend list */}
          {isNonMobileScreens && (
            <Box flexBasis="26%">
              <AdvertWidget />
              <Box m="2rem 0" />
              <FriendListWidget userId={_id} />
            </Box>
          )}
        </Box>
      </div>
    </Box>
  );
};

export default HomePage;