import React from "react";
import { IconUser, IconCheck } from "@tabler/icons-react";

export function RecipientPill() {
  return (
    <div className="w-full bg-surface-secondary border border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-surface flex items-center justify-center text-muted-foreground/70 border border-border/80">
          <IconUser size={24} stroke={1.5} />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-foreground font-medium text-lg leading-tight">John Doe</span>
          <span className="text-muted-foreground text-sm">@yourname</span>
        </div>
      </div>
      <div className="w-6 h-6 flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10">
        <IconCheck size={14} className="text-emerald-500" stroke={2} />
      </div>
    </div>
  );
}
