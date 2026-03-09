"use client";

import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "lib/utils";

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
  activeTab = null,
  isDarkMode = true,
}) {
  const [internalSelected, setInternalSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const outsideClickRef = useRef(null);

  const selected = activeTab !== null ? activeTab : internalSelected;

  useOnClickOutside(outsideClickRef, () => {
    setInternalSelected(null);
    onChange?.(null);
  });

  const handleSelect = (index, tab, e) => {
    if (tab.onClick) {
      tab.onClick(e);
    }
    
    if (internalSelected === index) {
      setInternalSelected(null);
      onChange?.(null);
    } else {
      setInternalSelected(index);
      onChange?.(index);
    }
  };

  const Separator = () => (
    <div className={cn("mx-1 h-[24px] w-[1.2px]", isDarkMode ? "bg-neutral-600/30" : "bg-neutral-300")} aria-hidden="true" />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border backdrop-blur-md p-1 shadow-sm",
        isDarkMode ? "border-white/10 bg-black/40" : "border-black/10 bg-white/70",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={selected === index || hovered === index}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onClick={(e) => handleSelect(index, tab, e)}
            transition={transition}
            className={cn(
              "relative flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
              selected === index
                ? cn(isDarkMode ? "bg-cyan-500/20" : "bg-cyan-100", activeColor)
                : isDarkMode 
                    ? "text-neutral-400 hover:bg-white/10 hover:text-white"
                    : "text-neutral-600 hover:bg-black/5 hover:text-black"
            )}
          >
            {/* If Icon is a React component, render it with size. Else just render it as is (useful for Badges) */}
            {typeof Icon === "function" || typeof Icon === "object" ? <Icon size={20} /> : Icon}
            <AnimatePresence initial={false}>
              {(selected === index || hovered === index) && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
