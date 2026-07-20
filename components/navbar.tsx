"use client";

/**
 * Navbar + mobile drawer — port of the original navbar (app.js initNavbar /
 * initHamburger). `transparent` pages (home) become solid after 50px scroll.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home", page: "index" },
  { href: "/menu", label: "Menu", page: "menu" },
  { href: "/about", label: "About", page: "about" },
];

export function Navbar({
  transparent = false,
  activePage = "",
  showMenuButton = false,
}: {
  transparent?: boolean;
  activePage?: string;
  showMenuButton?: boolean;
}) {
  const [scrolled, setScrolled] = useState(!transparent);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const navClass = transparent
    ? `navbar ${scrolled ? "solid scrolled" : "transparent"}`
    : "navbar solid scrolled";

  return (
    <>
      <nav className={navClass} role="navigation" aria-label="Main navigation">
        <div className="container">
          <Link href="/" className="navbar-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/thirst-logo.png" alt="Thirst." className="navbar-logo-img" />
          </Link>
          <div className="nav-links">
            {LINKS.map((l) => (
              <Link key={l.page} href={l.href} className={activePage === l.page ? "active" : ""}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="nav-actions">
            {showMenuButton && (
              <Link href="/menu" className="btn btn-primary btn-sm order-nav-btn">
                View Menu
              </Link>
            )}
            <div
              className={`hamburger ${drawerOpen ? "active" : ""}`}
              aria-label="Menu toggle"
              onClick={() => setDrawerOpen((o) => !o)}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`mobile-drawer-overlay ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      ></div>
      <div className={`mobile-drawer ${drawerOpen ? "open" : ""}`}>
        {LINKS.map((l) => (
          <Link
            key={l.page}
            href={l.href}
            className={activePage === l.page ? "active" : ""}
            onClick={() => setDrawerOpen(false)}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </>
  );
}
