import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LogoProps {
  variant?: "light" | "dark" | "monochrome" | "icon-only" | "app-icon";
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  href?: string;
  className?: string;
}

export function KemixLogoIcon({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark" | "monochrome" | "white";
}) {
  const isDarkBg = variant === "dark" || variant === "white";
  const isMonochrome = variant === "monochrome";

  const stemFill = isMonochrome
    ? "currentColor"
    : isDarkBg
    ? "#FFFFFF"
    : "#0B2D5B";

  const lowerLegFill = isMonochrome
    ? "currentColor"
    : isDarkBg
    ? "#E2E8F0"
    : "#0B2D5B";

  const swoopFill = isMonochrome
    ? "currentColor"
    : "url(#kemixIconGrad)";

  const p1Fill = isMonochrome ? "currentColor" : "#2563EB";
  const p2Fill = isMonochrome ? "currentColor" : "#38BDF8";
  const p3Fill = isMonochrome ? "currentColor" : "#60A5FA";
  const p4Fill = isMonochrome ? "currentColor" : "#2563EB";

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
      aria-label="KEMIX Academy Mark"
    >
      <defs>
        <linearGradient id="kemixIconGrad" x1="15%" y1="90%" x2="95%" y2="10%">
          <stop offset="0%" stopColor="#0B2D5B" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* 1. Left Vertical Stem */}
      <path
        d="M20 18 C20 14.5 22.5 12 26 12 L33 12 C36.5 12 39 14.5 39 18 L39 82 C39 85.5 36.5 88 33 88 L26 88 C22.5 88 20 85.5 20 82 Z"
        fill={stemFill}
      />

      {/* 2. Lower Diagonal Leg */}
      <path
        d="M38 52 L67 82.5 C69 84.5 72 85 74.5 83.5 L81 79 C83 77.5 83.5 74.5 82 72.5 L53 42 Z"
        fill={lowerLegFill}
      />

      {/* 3. Upper Dynamic Swoop */}
      <path
        d="M22 75 L62 33 C65 30 68 27 72 23.5 L78 18.5 C80.5 16.5 84 17 86 19.5 L88 22 C90 24.5 89.5 28 87 30.5 L52 64 L27 88 C24.5 90 21 89.5 19 87 L18 85.5 C16 83 16.5 79.5 19 77.5 Z"
        fill={swoopFill}
      />

      {/* 4. Digital Pixel / Tech Data Blocks */}
      <rect x="74" y="8" width="8" height="8" rx="1.5" fill={p1Fill} />
      <rect x="85" y="1" width="8.5" height="8.5" rx="1.5" fill={p2Fill} />
      <rect x="64" y="16" width="7.5" height="7.5" rx="1.5" fill={p3Fill} />
      <rect x="56" y="22" width="6.5" height="6.5" rx="1" fill={p4Fill} />
    </svg>
  );
}

export function KemixAppIcon({
  className,
  size = 64,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#0F172A] to-[#0B2D5B] shadow-xl p-2.5 overflow-hidden border border-slate-700/50",
        className
      )}
    >
      {/* Subtle glowing backdrop highlight */}
      <div className="absolute -top-6 -right-6 w-16 h-16 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
      <KemixLogoIcon variant="white" className="w-full h-full" />
    </div>
  );
}

export function Logo({
  variant = "light",
  size = "md",
  showTagline = false,
  href,
  className,
}: LogoProps) {
  const isDarkBg = variant === "dark";
  const isMonochrome = variant === "monochrome";
  const isAppIcon = variant === "app-icon";

  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-11 w-11",
    xl: "h-14 w-14",
  };

  if (isAppIcon) {
    const iconDim = size === "sm" ? 32 : size === "md" ? 40 : size === "lg" ? 48 : 64;
    return href ? (
      <Link href={href} className="inline-block rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500">
        <KemixAppIcon size={iconDim} className={className} />
      </Link>
    ) : (
      <KemixAppIcon size={iconDim} className={className} />
    );
  }

  const content =
    variant === "icon-only" ? (
      <div className={cn("inline-flex select-none", className)}>
        <KemixLogoIcon
          variant={isMonochrome ? "monochrome" : isDarkBg ? "dark" : "light"}
          className={iconSizes[size]}
        />
      </div>
    ) : (
      <span
        className={cn(
          "brand-logo-image-frame",
          `brand-logo-image-frame-${size}`,
          isDarkBg && "brand-logo-image-frame-dark",
          className
        )}
      >
        <img
          src="/kemix-academy-logo.png"
          alt="KEMIX Academy — Learn • Build • Grow"
          className="brand-logo-image"
        />
      </span>
    );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-0.5 transition-opacity hover:opacity-95"
      >
        {content}
      </Link>
    );
  }

  return content;
}
