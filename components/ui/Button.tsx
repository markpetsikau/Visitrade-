import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-[#04110F] font-semibold hover:bg-brand-bright shadow-[0_6px_24px_-8px_rgba(0,209,178,0.7)]",
  secondary:
    "bg-surface-raised text-ink border border-border-strong hover:bg-surface-hover",
  outline:
    "border border-border-strong text-ink hover:bg-surface-raised hover:border-brand/40",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-raised",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-[15px] rounded-xl",
};

interface Props {
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  /** Le style désactivé existait déjà (disabled:opacity-50) sans être pilotable. */
  disabled?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  type = "button",
  onClick,
  disabled,
}: Props) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
