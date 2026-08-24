import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(v: number, currency = "$"): string {
  if (!Number.isFinite(v)) return `${currency}0`;
  if (v >= 1000)
    return `${currency}${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (v >= 1) return `${currency}${v.toFixed(2)}`;
  if (v > 0)
    // Micro-cap coins (e.g. PEPE): keep significant digits, no scientific notation.
    return `${currency}${v.toLocaleString("en-US", { maximumSignificantDigits: 4 })}`;
  return `${currency}0`;
}

export function formatCompact(v: number): string {
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}

export function formatPct(v: number, withSign = true): string {
  const s = withSign && v > 0 ? "+" : "";
  return `${s}${v.toFixed(2)}%`;
}

export function signalColor(v: number): string {
  if (v > 0.05) return "text-bull";
  if (v < -0.05) return "text-bear";
  return "text-neutral";
}
