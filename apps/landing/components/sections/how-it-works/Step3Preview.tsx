import React from "react";
import { motion } from "framer-motion";
import { IconUser } from "@tabler/icons-react";
import { Button } from "@heroui/react";

export function Step3Preview({ active }: { active: boolean }) {
  return (
    <motion.div
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, pointerEvents: "none", zIndex: 0 },
        visible: { opacity: 1, pointerEvents: "auto", zIndex: 10, transition: { duration: 0.3 } }
      }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 w-full max-w-sm mx-auto"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.98, y: 15 },
          visible: { opacity: 1, scale: 1, y: 0, transition: { delay: 0.2, duration: 0.5 } }
        }}
        className="w-full max-w-70 bg-surface-secondary border border-border p-8 flex flex-col items-center gap-6 rounded-2xl"
      >
        <div className="w-24 h-24 bg-surface flex items-center justify-center text-muted-foreground/70 border border-border">
          <IconUser size={48} stroke={1.5} />
        </div>
        
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-medium text-foreground tracking-tight">John Doe</h3>
          <p className="text-muted-foreground">@yourname</p>
        </div>
        
        <Button size="sm" variant="outline" className="text-xs w-full mt-2 rounded-full">
          Send
        </Button>
      </motion.div>
    </motion.div>
  );
}
