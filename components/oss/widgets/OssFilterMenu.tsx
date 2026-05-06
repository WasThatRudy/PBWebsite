"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function OssFilterMenu({
  children,
  className,
  panelClassName,
}: {
  children: (controls: { close: () => void }) => ReactNode;
  className?: string;
  panelClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative w-full sm:w-auto", className)}>
      <Button
        type="button"
        size="pill"
        variant={isOpen ? "success" : "surface"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="w-full px-5 py-3 text-xs uppercase tracking-[0.18em] sm:w-auto"
      >
        Filter
      </Button>

      {isOpen && (
        <div
          className={cn(
            "mt-3 w-full rounded-[20px] border border-[#39FF14]/15 bg-[#111111] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.35)] sm:absolute sm:right-0 sm:top-full sm:z-30 sm:mt-3 sm:min-w-[300px]",
            panelClassName,
          )}
        >
          {children({ close: () => setIsOpen(false) })}
        </div>
      )}
    </div>
  );
}
