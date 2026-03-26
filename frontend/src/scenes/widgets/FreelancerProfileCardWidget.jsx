import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { FreelancerProfileCard } from "components/ui/freelancer-profile-card";
import API_BASE_URL from "config";
import { Box } from "@mui/material";

const DEFAULT_GRADIENT = "linear-gradient(135deg,#00D5FA,#0077FF)";
const DEFAULT_LINKS = [{ label: "Link 1", url: "" }, { label: "Link 2", url: "" }];

const FreelancerProfileCardWidget = ({ userId, picturePath }) => {
  const [user, setUser]         = useState(null);
  const [postCount, setPostCount] = useState(0);
  const token = useSelector((state) => state.token);
  const mode  = useSelector((state) => state.mode);
  const isDark = mode === "dark";

  // ── Persisted preferences (gradient + tool links) ────────────
  const gradientKey = `card_gradient_${userId}`;
  const linksKey    = `card_links_${userId}`;

  const [bannerGradient, setBannerGradient] = useState(
    () => localStorage.getItem(gradientKey) || DEFAULT_GRADIENT
  );
  const [toolLinks, setToolLinks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(linksKey)) || DEFAULT_LINKS; }
    catch { return DEFAULT_LINKS; }
  });

  const handleBannerChange = useCallback((g) => {
    setBannerGradient(g);
    localStorage.setItem(gradientKey, g);
  }, [gradientKey]);

  const handleToolLinksChange = useCallback((links) => {
    setToolLinks(links);
    localStorage.setItem(linksKey, JSON.stringify(links));
  }, [linksKey]);

  // ── Fetch user data ────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userRes, countRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/users/${userId}/post-count`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const userData  = await userRes.json();
        const countData = await countRes.json();
        setUser(userData);
        setPostCount(countData.count ?? 0);
      } catch (err) {
        console.error("FreelancerProfileCardWidget fetch error", err);
      }
    };
    fetchAll();
  }, [userId, token]);

  if (!user) return null;

  const { firstName, lastName, occupation, viewedProfile, friends } = user;
  const fullName    = `${firstName} ${lastName}`;
  const avatarSrc   = picturePath ? (picturePath.startsWith("http") ? picturePath : `${API_BASE_URL}/assets/${picturePath}`) : undefined;
  const friendCount = friends?.length ?? 0;
  const viewCount   = viewedProfile ?? 0;

  return (
    <Box mb={{ xs: "1.5rem", md: 0 }}>
      <FreelancerProfileCard
        name={fullName}
        title={occupation || "Member"}
        avatarSrc={avatarSrc}
        bannerGradient={bannerGradient}
        onBannerChange={handleBannerChange}
        posts={postCount}
        friends={friendCount}
        views={viewCount}
        toolLinks={toolLinks}
        onToolLinksChange={handleToolLinksChange}
        isDark={isDark}
      />
    </Box>
  );
};

export default FreelancerProfileCardWidget;
