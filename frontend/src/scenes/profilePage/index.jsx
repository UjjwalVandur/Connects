import { Box, useMediaQuery, Tabs, Tab } from "@mui/material";
import API_BASE_URL from "config";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Navbar from "scenes/navbar";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import FreelancerProfileCardWidget from "scenes/widgets/FreelancerProfileCardWidget";
import CanvasRevealEffect from "components/ui/CanvasRevealEffect";
const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState("myPosts");
  const { userId } = useParams();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const mode = useSelector((state) => state.mode);
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");

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

  // is the viewer looking at their own profile?
  const isOwnProfile = loggedInUserId === userId;

  const getUser = async () => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setUser(data);
  };

  // Increment profile view count when someone else visits
  const incrementView = async () => {
    if (loggedInUserId === userId) return; // don't count own visits
    try {
      await fetch(`${API_BASE_URL}/users/${userId}/view`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
  };

  useEffect(() => {
    getUser();
    incrementView();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

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
        gap="2rem"
        justifyContent="center"
      >
        <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
          <FreelancerProfileCardWidget
            userId={userId}
            picturePath={user.picturePath}
          />
          <Box m="2rem 0" />
          <FriendListWidget userId={userId} />
        </Box>

        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          {/* Only the profile owner can create posts and see tabs */}
          {isOwnProfile && (
            <>
              <MyPostWidget picturePath={user.picturePath} />
              <Box m="2rem 0" />
              <Box sx={{ width: '100%', mb: '2rem' }}>
                <Tabs
                  value={currentTab}
                  onChange={(e, newValue) => setCurrentTab(newValue)}
                  textColor="primary"
                  indicatorColor="primary"
                  centered
                  sx={{
                    "& .MuiTabs-indicator": {
                      backgroundColor: isDark ? "#00D5FA" : "#00A0BC",
                    },
                    "& .MuiTab-root": {
                      color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
                      fontWeight: "bold",
                    },
                    "& .Mui-selected": {
                      color: isDark ? "#00D5FA !important" : "#00A0BC !important",
                    }
                  }}
                >
                  <Tab label="My Posts" value="myPosts" />
                  <Tab label="Saved Posts" value="savedPosts" />
                </Tabs>
              </Box>
            </>
          )}
          
          {currentTab === "myPosts" || !isOwnProfile ? (
            <PostsWidget userId={userId} isProfile />
          ) : (
            <PostsWidget userId={userId} isSaved />
          )}
        </Box>
      </Box>
      </div>
    </Box>
  );
};

export default ProfilePage;