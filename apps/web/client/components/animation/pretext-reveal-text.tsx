import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";
import { motion, useReducedMotion } from "framer-motion";
import { type ElementType, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

type PretextRevealTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  font?: string;
  lineHeight?: number;
  delay?: number;
  minWidthToAnimate?: number;
  stagger?: number;
  children?: never;
};

export function PretextRevealText({
  text,
  as: Tag = "span",
  className,
  font = "14px Inter, ui-sans-serif, system-ui, sans-serif",
  lineHeight = 20,
  delay = 0,
  minWidthToAnimate = 96,
  stagger = 0.025,
}: PretextRevealTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(0, entry.contentRect.width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const lines = useMemo(() => {
    if (!width || width < minWidthToAnimate || !text.trim()) return null;
    try {
      const prepared = prepareWithSegments(text, font);
      return layoutWithLines(prepared, width, lineHeight).lines.map((line) => line.text);
    } catch {
      return null;
    }
  }, [font, lineHeight, minWidthToAnimate, text, width]);

  if (reduceMotion || !lines?.length) {
    return (
      <Tag ref={ref} className={className}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag ref={ref} className={cn("block", className)} aria-label={text}>
      {lines.map((line, index) => (
        <motion.span
          // biome-ignore lint/suspicious/noArrayIndexKey: Line content can repeat in headings.
          key={`${line}-${index}`}
          className="block"
          aria-hidden="true"
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.18,
            delay: delay + index * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {line}
        </motion.span>
      ))}
    </Tag>
  );
}
