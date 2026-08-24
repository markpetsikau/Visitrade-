import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  showText = true,
}: {
  className?: string;
  href?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="VISITRADE"
    >
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-bright to-brand-dim shadow-[0_0_20px_-4px_rgba(0,209,178,0.6)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 17.5L8.5 11l4 4L21 6.5"
            stroke="#04110F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="21" cy="6.5" r="2" fill="#04110F" />
        </svg>
      </span>
      {showText && (
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          VISI<span className="text-brand">TRADE</span>
        </span>
      )}
    </Link>
  );
}
