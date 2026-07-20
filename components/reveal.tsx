"use client";

/**
 * Reveal — port of the .reveal scroll animation (App.initScrollReveal).
 * Elements fade in when they enter the viewport; reduced-motion or missing
 * IntersectionObserver shows everything immediately, and a fail-safe timer
 * reveals any stragglers so content never stays hidden.
 */
import { useEffect, useRef, type HTMLAttributes } from "react";

export function Reveal({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => el.classList.add("visible");

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);

    // Fail-safe: content must never stay hidden if the observer misses.
    const failSafe = setTimeout(reveal, 2000);
    return () => {
      observer.disconnect();
      clearTimeout(failSafe);
    };
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
