"use client";

import { useEffect, useRef } from "react";

interface MermaidProps {
  /** The raw mermaid diagram source (injected by remarkMdxMermaid). */
  chart: string;
}

/**
 * Client-side Mermaid diagram renderer.
 *
 * remarkMdxMermaid converts  ```mermaid … ```  code blocks into
 * <Mermaid chart="…" /> at build time. This component initialises the
 * mermaid library on the browser and renders the SVG into a container div.
 *
 * Lazy-imports mermaid so it never adds to the server bundle.
 */
export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    let cancelled = false;

    void (async () => {
      const { default: mermaid } = await import("mermaid");

      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        fontFamily:
          "var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif)",
        themeVariables: {
          fontSize: "14px",
        },
      });

      if (cancelled || !ref.current) return;

      // mermaid.render needs a unique id per diagram
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      const { svg } = await mermaid.render(id, chart);

      if (cancelled || !ref.current) return;
      ref.current.innerHTML = svg;
    })();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto rounded-lg border bg-fd-card p-4"
      aria-label="Mermaid diagram"
    />
  );
}
