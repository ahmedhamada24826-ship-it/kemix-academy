"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function SiteIntro() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setVisible(true);

    const timeoutId = window.setTimeout(() => setVisible(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="site-intro" role="dialog" aria-label="مرحبًا بك في KEMIX Academy">
      <div className="site-intro-mark">
        <span className="site-intro-orbit site-intro-orbit-one" aria-hidden="true">
          <span className="site-intro-orbit-dot" />
          <span className="site-intro-orbit-dot" />
          <span className="site-intro-orbit-dot" />
          <span className="site-intro-orbit-dot" />
        </span>
        <span className="site-intro-orbit site-intro-orbit-two" aria-hidden="true">
          <span className="site-intro-orbit-dot" />
          <span className="site-intro-orbit-dot" />
          <span className="site-intro-orbit-dot" />
          <span className="site-intro-orbit-dot" />
        </span>
        <span className="site-intro-orbit site-intro-orbit-three" aria-hidden="true">
          <span className="site-intro-orbit-dot" />
          <span className="site-intro-orbit-dot" />
          <span className="site-intro-orbit-dot" />
          <span className="site-intro-orbit-dot" />
        </span>
        <div className="site-intro-logo">
          <Image
            src="/kemix-glossy-mark.png"
            alt="KEMIX Academy"
            width={1536}
            height={1024}
            priority
          />
        </div>
      </div>
      <p className="site-intro-caption">مرحبًا بك في KEMIX Academy</p>
      <button
        type="button"
        className="site-intro-skip"
        onClick={() => setVisible(false)}
      >
        تخطّي الحركة
      </button>
    </div>
  );
}
