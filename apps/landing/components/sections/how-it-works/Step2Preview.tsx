import React from "react";
import { motion } from "framer-motion";
import { RecipientPill } from "./Shared";

export function Step2Preview({ active }: { active: boolean }) {
  return (
    <motion.div
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, pointerEvents: "none", zIndex: 0 },
        visible: { opacity: 1, pointerEvents: "auto", zIndex: 10, transition: { duration: 0.3 } }
      }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 w-full max-w-sm mx-auto gap-4"
    >
      <motion.div 
        className="w-full bg-surface-secondary border border-border p-5 flex items-center gap-3"
        variants={{
          hidden: { opacity: 0, scale: 0.98 },
          visible: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.2 } }
        }}
      >
        <div className="text-[#7928CA] font-medium text-2xl">@</div>
        <div className="text-foreground text-2xl flex items-center h-8 overflow-hidden font-medium">
          {"yourname".split("").map((char, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
              transition={{ delay: 0.6 + i * 0.08 }}
            >
              {char}
            </motion.span>
          ))}
          <motion.div
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-0.5 h-7 bg-[#7928CA] ml-1.5"
          />
        </div>
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 15 },
          visible: { opacity: 1, y: 0, transition: { delay: 1.8, duration: 0.5 } }
        }}
        className="w-full"
      >
        <RecipientPill />
      </motion.div>
    </motion.div>
  );
}
