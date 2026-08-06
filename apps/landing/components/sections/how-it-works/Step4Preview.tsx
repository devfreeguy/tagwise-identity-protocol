import React from "react";
import { motion } from "framer-motion";
import { RecipientPill } from "./Shared";
import { Button } from "@heroui/react";

export function Step4Preview({ active }: { active: boolean }) {
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
        variants={{ 
          hidden: { opacity: 0, y: 10 }, 
          visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } } 
        }}
        className="w-full"
      >
        <RecipientPill />
      </motion.div>

      <motion.div
        variants={{ 
          hidden: { opacity: 0, scale: 0.98 }, 
          visible: { opacity: 1, scale: 1, transition: { delay: 0.6, duration: 0.4 } } 
        }}
        className="w-full bg-surface-secondary border border-border p-10 flex items-center justify-center rounded-2xl"
      >
        <div className="text-[56px] font-medium text-foreground leading-none tracking-tight flex items-baseline gap-3">
          2 <span className="text-muted-foreground/60 text-3xl font-medium tracking-normal">SOL</span>
        </div>
      </motion.div>

      <motion.div
        variants={{ 
          hidden: { opacity: 0, y: 10 }, 
          visible: { opacity: 1, y: 0, transition: { delay: 1.0, duration: 0.4 } } 
        }}
        className="w-full mt-2"
      >
        <Button className="w-full rounded-full" variant="outline">
          Send
        </Button>
      </motion.div>
    </motion.div>
  );
}
