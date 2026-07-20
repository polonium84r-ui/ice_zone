"use client";

/**
 * BodyClass — applies a page-specific class to <body> (e.g. auth-page-body,
 * pos-body) since the original pages set it directly in their HTML.
 */
import { useEffect } from "react";

export function BodyClass({ className }: { className: string }) {
  useEffect(() => {
    const classes = className.split(/\s+/).filter(Boolean);
    document.body.classList.add(...classes);
    return () => document.body.classList.remove(...classes);
  }, [className]);
  return null;
}
