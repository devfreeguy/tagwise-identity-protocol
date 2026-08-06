"use client";

import React from "react";
import {
  IconApps,
  IconPackage,
  IconServer,
  IconDatabaseImport,
  IconDatabase,
  IconBolt,
} from "@tabler/icons-react";

function FlowNode({ title, subtitle, time, icon: Icon, className = "" }: any) {
  return (
    <div className={`group flex flex-col bg-surface hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] p-4 sm:p-5 transition-all duration-300 border border-border/80 overflow-hidden w-full h-full shadow-sm z-10 relative ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-[#8B98C2] group-hover:text-white/80 transition-colors shrink-0" />
        <h3 className="font-semibold text-xs sm:text-[13px] uppercase tracking-wide text-foreground group-hover:text-white transition-colors line-clamp-1">{title}</h3>
      </div>
      <p className="text-[11px] sm:text-xs font-mono text-muted-foreground group-hover:text-white/90 transition-colors mt-auto">{subtitle}</p>
      {time && (
        <div className="mt-3 pt-3 border-t border-border/40 group-hover:border-white/20 transition-colors">
          <span className="text-[11px] sm:text-xs font-mono font-bold text-[#7928CA] group-hover:text-white transition-colors">
            {time}
          </span>
        </div>
      )}
    </div>
  );
}

export function ProtocolFlowAnimation() {
  return (
    <div className="w-full">
      {/* MOBILE LAYOUT (Stacked) */}
      <div className="flex md:hidden flex-col items-center w-full max-w-md mx-auto px-4 py-8 font-sans">
        <div className="w-full h-24">
          <FlowNode title="User App" subtitle="Consumer Application" icon={IconApps} />
        </div>
        
        <div className="w-px h-8 bg-border/80 relative my-1">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 border-b border-r border-border/80 rotate-45" />
        </div>
        
        <div className="w-full h-24">
          <FlowNode title="TIP Client" subtitle='TipClient.resolve("@alice")' icon={IconPackage} />
        </div>

        <div className="w-px h-8 bg-border/80 relative my-1">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 border-b border-r border-border/80 rotate-45" />
        </div>

        <div className="w-full h-24">
          <FlowNode title="Fast API Resolution" subtitle="HTTP GET /v1/resolve" icon={IconServer} />
        </div>

        <div className="w-px h-8 bg-border/80 relative my-1">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 border-b border-r border-border/80 rotate-45" />
        </div>

        {/* Side-by-side Cache for Mobile */}
        <div className="grid grid-cols-2 gap-3 w-full h-30">
          <FlowNode title="Redis" subtitle="(Memory)" icon={IconDatabase} time="0.5ms" />
          <FlowNode title="Postgres" subtitle="(Disk)" icon={IconDatabaseImport} time="15ms" />
        </div>

        {/* Fallback Separator */}
        <div className="w-full flex items-center gap-4 my-8">
          <div className="h-px bg-border/80 flex-1" />
          <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-widest">Fallback</span>
          <div className="h-px bg-border/80 flex-1" />
        </div>

        <div className="w-full h-24">
          <FlowNode title="Direct On-Chain" subtitle="RPC getAccountInfo" icon={IconBolt} time="120ms" />
        </div>
      </div>

      {/* DESKTOP LAYOUT (Horizontal Flowchart) */}
      <div className="hidden md:flex flex-col items-center w-full max-w-5xl mx-auto font-sans relative overflow-x-auto py-12 scrollbar-hide">
        <div className="min-w-200 w-full flex flex-col items-center">
          
          {/* LEVEL 1: User App -> TipClient */}
          <div className="flex items-center justify-center w-full relative h-26">
            <div className="flex items-center relative">
              <div className="absolute right-full mr-12 w-55 h-full flex items-center">
                <FlowNode title="User App" subtitle="Consumer Application" icon={IconApps} />
                {/* Arrow pointing right */}
                <div className="absolute left-full top-1/2 w-12 h-px bg-border/80 flex items-center justify-end -translate-y-1/2">
                  <div className="w-1.5 h-1.5 border-t border-r border-border/80 rotate-45 mr-px" />
                </div>
              </div>
              
              <div className="w-70 h-full">
                <FlowNode title="TIP Client" subtitle='TipClient.resolve("@alice")' icon={IconPackage} />
              </div>
            </div>
          </div>

          {/* Vertical connection TipClient -> Fork 1 */}
          <div className="w-px h-10 bg-border/80" />

          {/* LEVEL 2: Fork 1 (API vs On-Chain) */}
          <div className="flex w-full items-start">
            {/* Half for Fast API */}
            <div className="w-1/2 flex flex-col items-center relative">
              <div className="absolute top-0 right-0 w-1/2 h-px bg-border/80" />
              <div className="w-px h-6 bg-border/80 relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 border-b border-r border-border/80 rotate-45" />
              </div>
              <div className="w-70 h-30 mt-1.5">
                <FlowNode title="Fast API Resolution" subtitle="HTTP GET /v1/resolve" icon={IconServer} />
              </div>

              {/* Vertical connection API -> Fork 2 */}
              <div className="w-px h-10 bg-border/80" />
              
              {/* Fork 2 for Fast API (Redis vs Postgres) */}
              <div className="flex w-full items-start relative">
                {/* Redis */}
                <div className="w-1/2 flex flex-col items-center relative">
                  <div className="absolute top-0 right-0 w-1/2 h-px bg-border/80" />
                  <div className="w-px h-6 bg-border/80 relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 border-b border-r border-border/80 rotate-45" />
                  </div>
                  <div className="w-40 h-30 mt-1.5">
                    <FlowNode title="Redis Cache" subtitle="(Memory Store)" icon={IconDatabase} time="0.5ms" />
                  </div>
                </div>
                
                {/* Postgres */}
                <div className="w-1/2 flex flex-col items-center relative">
                  <div className="absolute top-0 left-0 w-1/2 h-px bg-border/80" />
                  <div className="w-px h-6 bg-border/80 relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 border-b border-r border-border/80 rotate-45" />
                  </div>
                  <div className="w-40 h-30 mt-1.5">
                    <FlowNode title="Postgres Mirror" subtitle="(Persistent)" icon={IconDatabaseImport} time="15ms" />
                  </div>
                </div>
              </div>
            </div>

            {/* Half for Direct On-Chain */}
            <div className="w-1/2 flex flex-col items-center relative">
              <div className="absolute top-0 left-0 w-1/2 h-px bg-border/80" />
              <div className="w-px h-6 bg-border/80 relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 border-b border-r border-border/80 rotate-45" />
              </div>
              <div className="w-70 h-30 mt-1.5">
                <FlowNode title="Direct On-Chain" subtitle="RPC getAccountInfo" icon={IconBolt} time="120ms" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
