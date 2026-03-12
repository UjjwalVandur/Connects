import { cn } from "lib/utils";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";

export function SocialCard({
  author,
  content,
  engagement,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onMore,
  headerExtra, // optional node rendered in place of the more-button (e.g. Friend add/remove)
  className,
  isDark = true,
  children, // slot for extra content (comments section, media, etc.)
}) {
  const [isLiked, setIsLiked] = useState(engagement?.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(engagement?.isBookmarked ?? false);
  const [likes, setLikes] = useState(engagement?.likes ?? 0);

  const handleLike = () => {
    setIsLiked((prev) => !prev);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.();
  };

  const handleBookmark = () => {
    setIsBookmarked((prev) => !prev);
    onBookmark?.();
  };

  /* ── colour tokens ─────────────────────────────────────── */
  const card    = isDark ? "bg-[#0d1117]/80 border-white/10"           : "bg-white/80 border-slate-200";
  const textPri = isDark ? "text-white"                                  : "text-slate-900";
  const textSec = isDark ? "text-white/55"                               : "text-slate-500";
  const divider = isDark ? "divide-white/8"                             : "divide-slate-100";
  const hoverBg = isDark ? "hover:bg-white/8"                           : "hover:bg-slate-100";
  const linkBg  = isDark ? "bg-white/5 border-white/10"                 : "bg-slate-50 border-slate-200";
  const iconBg  = isDark ? "bg-white/10"                                 : "bg-white border border-slate-200";

  return (
    <div
      className={cn(
        "w-full mx-auto backdrop-blur-xl",
        "border rounded-2xl shadow-xl",
        "transition-all duration-300",
        card,
        className
      )}
    >
      <div className={cn("divide-y", divider)}>
        <div className="p-5">
          {/* ── Author header ────────────────────────────── */}
          <div className="flex items-center justify-between mb-4">
            {headerExtra ? (
              /* When a custom header row is provided (e.g. Friend component), render it
                 as the full author row — avoids duplicate avatar/name display */
              <div className="flex-1">{headerExtra}</div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {author?.avatar && (
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                    />
                  )}
                  <div>
                    <h3 className={cn("text-sm font-semibold", textPri)}>
                      {author?.name}
                    </h3>
                    <p className={cn("text-xs", textSec)}>
                      {author?.subtitle && <>{author.subtitle}</>}
                      {author?.timeAgo && <span> · {author.timeAgo}</span>}
                    </p>
                  </div>
                </div>
                {onMore && (
                  <button
                    type="button"
                    onClick={onMore}
                    className={cn("p-2 rounded-full transition-colors", hoverBg)}
                  >
                    <MoreHorizontal className={cn("w-4 h-4", textSec)} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── Post text ────────────────────────────────── */}
          {content?.text && (
            <p className={cn("text-sm leading-relaxed mb-4", isDark ? "text-white/90" : "text-slate-800")}>
              {content.text}
            </p>
          )}

          {/* ── Link preview ─────────────────────────────── */}
          {content?.link && (
            <div className={cn("mb-4 rounded-xl border overflow-hidden", linkBg)}>
              <div className="p-3 flex items-center gap-3">
                {content.link.icon && (
                  <div className={cn("p-2 rounded-lg", iconBg)}>
                    {content.link.icon}
                  </div>
                )}
                <div>
                  <p className={cn("text-xs font-semibold", textPri)}>
                    {content.link.title}
                  </p>
                  <p className={cn("text-xs", textSec)}>
                    {content.link.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Media slot (image / video passed from PostWidget) ── */}
          {content?.media && <div className="mb-4">{content.media}</div>}

          {/* ── Engagement row ───────────────────────────── */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-5">
              {/* Like */}
              <button
                type="button"
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium transition-colors",
                  isLiked ? "text-rose-500" : cn(textSec, "hover:text-rose-500")
                )}
              >
                <Heart
                  className={cn(
                    "w-[18px] h-[18px] transition-transform",
                    isLiked && "fill-current scale-110"
                  )}
                />
                <span>{likes}</span>
              </button>

              {/* Comment */}
              <button
                type="button"
                onClick={onComment}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium transition-colors",
                  textSec, "hover:text-sky-500"
                )}
              >
                <MessageCircle className="w-[18px] h-[18px]" />
                <span>{engagement?.comments ?? 0}</span>
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={onShare}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium transition-colors",
                  textSec, "hover:text-emerald-500"
                )}
              >
                <Share2 className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* Bookmark */}
            <button
              type="button"
              onClick={handleBookmark}
              className={cn(
                "p-1.5 rounded-full transition-all",
                isBookmarked
                  ? "text-amber-400 bg-amber-400/10"
                  : cn(textSec, hoverBg)
              )}
            >
              <Bookmark
                className={cn(
                  "w-[18px] h-[18px] transition-transform",
                  isBookmarked && "fill-current scale-110"
                )}
              />
            </button>
          </div>
        </div>

        {/* ── Extra slot (comments section, etc.) ──────── */}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
