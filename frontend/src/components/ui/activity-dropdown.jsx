import { useState } from "react";
import { Bell, MessageCircle, Award, Calendar, Tag, CheckSquare, ChevronUp } from "lucide-react";
import { cn } from "lib/utils";

// Default static activities (real notifications list is passed as prop)
const defaultActivities = [
  { id: 1, icon: <MessageCircle className="h-4 w-4" />, title: "New Message!", description: "Someone sent you a message.", time: "Just Now" },
  { id: 2, icon: <Award className="h-4 w-4" />,         title: "Level Up!",    description: "You've unlocked a new achievement.", time: "2 min ago" },
  { id: 3, icon: <Calendar className="h-4 w-4" />,      title: "Reminder",     description: "You have an upcoming event.", time: "3 hours ago" },
  { id: 4, icon: <Tag className="h-4 w-4" />,           title: "Special Offer!", description: "Save 20% off on subscription.", time: "12 hours ago" },
  { id: 5, icon: <CheckSquare className="h-4 w-4" />,   title: "Task Assigned!", description: "A new task awaits your action.", time: "Yesterday" },
];

/**
 * Animated accordion notification panel.
 * Props:
 *  - activities: [{id, icon?, title, description, time}] (optional — falls back to defaults)
 *  - isDark: boolean — matches the app theme
 *  - unreadCount: number
 */
export function ActivityDropdown({ activities, isDark = true, unreadCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false);

  const items = (activities && activities.length > 0) ? activities : defaultActivities;
  const count = unreadCount > 0 ? unreadCount : items.length;

  // ── Colour tokens —————————————————————————
  const bg          = isDark ? "rgba(13,17,23,0.96)"       : "rgba(255,255,255,0.96)";
  const border      = isDark ? "rgba(255,255,255,0.09)"     : "rgba(100,116,139,0.18)";
  const textPrimary = isDark ? "#ffffff"                    : "#0f172a";
  const textMuted   = isDark ? "rgba(255,255,255,0.55)"     : "#64748b";
  const iconBg      = isDark ? "rgba(255,255,255,0.08)"     : "rgba(0,0,0,0.05)";
  const iconColor   = isDark ? "rgba(255,255,255,0.7)"      : "#334155";
  const hoverBg     = isDark ? "rgba(255,255,255,0.05)"     : "rgba(0,0,0,0.03)";
  const headerIconBg= isDark ? "rgba(0,213,250,0.12)"       : "rgba(0,160,188,0.1)";
  const accentColor = isDark ? "#00D5FA"                    : "#00A0BC";

  return (
    <div
      style={{
        width: "100%",
        borderRadius: isOpen ? "20px" : "14px",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
        background: bg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${border}`,
        boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 24px rgba(0,0,0,0.1)",
        transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
      }}
      onClick={() => setIsOpen((v) => !v)}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem" }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: "12px",
            background: headerIconBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Bell style={{ width: 20, height: 20, color: accentColor }} />
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem", color: textPrimary }}>
            {count} New {count === 1 ? "Activity" : "Activities"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              color: textMuted,
              overflow: "hidden",
              maxHeight: isOpen ? 0 : "1.5rem",
              opacity: isOpen ? 0 : 1,
              transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
              marginTop: isOpen ? 0 : "0.15rem",
            }}
          >
            What's happening around you
          </p>
        </div>
        <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronUp
            style={{
              width: 18, height: 18, color: textMuted,
              transform: isOpen ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
      </div>

      {/* Activity list — CSS grid accordion */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          opacity: isOpen ? 1 : 0,
          transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "0 0.5rem 1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {items.map((activity, index) => (
                <div
                  key={activity.id || index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    borderRadius: "12px",
                    padding: "0.75rem",
                    background: "transparent",
                    transform: isOpen ? "translateY(0)" : "translateY(16px)",
                    opacity: isOpen ? 1 : 0,
                    transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${isOpen ? index * 75 : 0}ms`,
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={(e) => e.stopPropagation()} // don't toggle on row click
                >
                  <div
                    style={{
                      width: 38, height: 38, borderRadius: "10px",
                      background: iconBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      color: iconColor,
                    }}
                  >
                    {activity.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem", color: textPrimary }}>
                      {activity.title}
                    </p>
                    <p style={{
                      margin: 0, fontSize: "0.78rem", color: textMuted,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}>
                      {activity.description}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: textMuted, flexShrink: 0, paddingTop: "2px" }}>
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityDropdown;
