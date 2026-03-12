import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FreelancerProfileCard } from "components/ui/freelancer-profile-card";
import API_BASE_URL from "config";

const DEFAULT_GRADIENT = "linear-gradient(135deg,#00D5FA,#0077FF)";

const popoverVariants = {
  initial: { opacity: 0, scale: 0.9, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit:    { opacity: 0, scale: 0.9, y: 8, transition: { duration: 0.15 } },
};

/**
 * Wraps any trigger element (e.g. an author name span) and shows a
 * FreelancerProfileCard popover on hover.
 *
 * Props:
 *  - userId        – profile to fetch and render
 *  - children      – the trigger (author name / element to hover)
 *  - triggerClass  – extra className for the wrapper span
 */
const ProfileCardPopover = ({ userId, children, triggerClass = "" }) => {
  const [visible, setVisible]   = useState(false);
  const [userData, setUserData] = useState(null);
  const [postCount, setPostCount] = useState(0);
  const [pos, setPos]           = useState({ top: 0, left: 0 });

  const token    = useSelector((s) => s.token);
  const mode     = useSelector((s) => s.mode);
  const isDark   = mode === "dark";
  const navigate = useNavigate();

  const triggerRef  = useRef(null);
  const popoverRef  = useRef(null);
  const showTimer   = useRef(null);
  const hideTimer   = useRef(null);

  // ── Fetch user data (lazy, first hover only) ────────────────
  const fetchUser = useCallback(async () => {
    if (userData) return; // cached
    try {
      const [uRes, cRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/users/${userId}/post-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const u = await uRes.json();
      const c = await cRes.json();
      setUserData(u);
      setPostCount(c.count ?? 0);
    } catch (err) {
      console.error("ProfileCardPopover fetch error", err);
    }
  }, [userId, token, userData]);

  // ── Position popover relative to trigger ───────────────────
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Try to show below the trigger; if not enough space, show above
    const CARD_WIDTH  = 310;
    const CARD_HEIGHT = 380; // approximate
    const OFFSET      = 12;

    let left = rect.left + scrollX;
    // clamp to viewport
    if (left + CARD_WIDTH > window.innerWidth + scrollX - 16)
      left = window.innerWidth + scrollX - CARD_WIDTH - 16;
    if (left < scrollX + 16) left = scrollX + 16;

    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow >= CARD_HEIGHT + OFFSET
        ? rect.bottom + scrollY + OFFSET
        : rect.top + scrollY - CARD_HEIGHT - OFFSET;

    setPos({ top, left });
  };

  const handleMouseEnter = () => {
    clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => {
      fetchUser();
      updatePosition();
      setVisible(true);
    }, 350); // slight delay to avoid accidental triggers
  };

  const handleMouseLeave = () => {
    clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 200);
  };

  // Keep popover interactive (don't close when mouse moves onto it)
  const handlePopoverEnter = () => clearTimeout(hideTimer.current);
  const handlePopoverLeave = () => {
    hideTimer.current = setTimeout(() => setVisible(false), 200);
  };

  useEffect(() => () => {
    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
  }, []);

  const bannerGradient = (() => {
    try { return localStorage.getItem(`card_gradient_${userId}`) || DEFAULT_GRADIENT; }
    catch { return DEFAULT_GRADIENT; }
  })();

  const toolLinks = (() => {
    try { return JSON.parse(localStorage.getItem(`card_links_${userId}`)) || []; }
    catch { return []; }
  })();

  const popover = visible && userData && createPortal(
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        key="profile-popover"
        variants={popoverVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onMouseEnter={handlePopoverEnter}
        onMouseLeave={handlePopoverLeave}
        style={{
          position: "absolute",
          top: pos.top,
          left: pos.left,
          width: 310,
          zIndex: 9999,
        }}
      >
        <FreelancerProfileCard
          name={`${userData.firstName} ${userData.lastName}`}
          title={userData.occupation || "Member"}
          avatarSrc={userData.picturePath ? `${API_BASE_URL}/assets/${userData.picturePath}` : undefined}
          bannerGradient={bannerGradient}
          posts={postCount}
          friends={userData.friends?.length ?? 0}
          views={userData.viewedProfile ?? 0}
          toolLinks={toolLinks}
          isOwner={false}
          isDark={isDark}
          onVisitProfile={() => {
            setVisible(false);
            navigate(`/profile/${userId}`);
          }}
          // Disable the hover-scale animation inside a popover (can feel jittery)
          whileHover={undefined}
        />
      </motion.div>
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      <span
        ref={triggerRef}
        className={triggerClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: "pointer", display: "inline-block" }}
      >
        {children}
      </span>
      {popover}
    </>
  );
};

export default ProfileCardPopover;
