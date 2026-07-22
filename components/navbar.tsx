"use client";

/**
 * Site header. Non-sticky — it sits at the top of the page and scrolls away
 * with the content. On `transparent` pages (home) it overlays the hero with
 * light text; elsewhere it renders solid. Navigation is a simple inline row of
 * links at every screen size (no mobile hamburger/drawer).
 */
import Link from "next/link";
import Image from "next/image";

const LINKS = [
  { href: "/", label: "Home", page: "index" },
  { href: "/menu", label: "Menu", page: "menu" },
  { href: "/about", label: "About", page: "about" },
];

export function Navbar({
  transparent = false,
  activePage = "",
}: {
  transparent?: boolean;
  activePage?: string;
}) {
  // Non-sticky header: the transparent (home) variant overlays the hero and
  // simply scrolls out of view, so there is no scroll-to-solid transition.
  const navClass = transparent ? "navbar transparent" : "navbar solid scrolled";

  return (
    <nav className={navClass} role="navigation" aria-label="Main navigation">
      <div className="container">
        <Link href="/" className="navbar-logo">
          <Image
            src="/assets/thirst-logo.png"
            alt="Thirst."
            width={120}
            height={120}
            className="navbar-logo-img"
            priority
          />
        </Link>
        <div className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.page} href={l.href} className={activePage === l.page ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
