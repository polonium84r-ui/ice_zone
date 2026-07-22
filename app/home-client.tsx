"use client";

/**
 * Home — port of index.html: transparent navbar over the hero, promo strip
 * carousel, "Why Thirst." features, popular treats pulled live from the menu.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DishCard } from "@/components/dish-card";
import { Reveal } from "@/components/reveal";
import { PROMO_OFFERS, WHY_CHOOSE_US } from "@/lib/client/data";
import { getMenu, type MenuItem } from "@/lib/client/api";

export default function HomePage() {
  const router = useRouter();
  const [popular, setPopular] = useState<MenuItem[] | null>(null);
  const [menuError, setMenuError] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    getMenu()
      .then((menu) => {
        const top = [...menu]
          .sort((a, b) => {
            if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
            const aWeight = a.tags?.includes("bestseller") || a.tags?.includes("signature") ? 2 : a.tags?.includes("popular") ? 1 : 0;
            const bWeight = b.tags?.includes("bestseller") || b.tags?.includes("signature") ? 2 : b.tags?.includes("popular") ? 1 : 0;
            return bWeight - aWeight;
          })
          .slice(0, 4);
        setPopular(top);
      })
      .catch(() => setMenuError(true));
  }, []);

  // Promo strip rotates every 4 seconds.
  useEffect(() => {
    const timer = setInterval(
      () => setPromoIndex((i) => (i + 1) % PROMO_OFFERS.length),
      4000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Navbar transparent activePage="index" />

      {/* Hero */}
      <header className="hero" id="main-content">
        <div className="hero-bg">
          <Image
            src="/assets/hero.jpg"
            alt="Handcrafted hot chocolate being poured"
            fill
            priority
            sizes="100vw"
            quality={82}
            style={{ objectFit: "cover", objectPosition: "center 70%" }}
          />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="story-badge">🍫 One for Living</span>
          <h1>Hot Chocolate &amp; Loaded Waffles</h1>
          <p>
            Thick shakes, brownies, pancakes, crushers &amp; more — handcrafted, freshly
            made, and served daily from 5 PM to 10 PM.
          </p>
          <div className="hero-ctas">
            <Link href="/menu" className="btn btn-primary btn-lg">
              View Menu
            </Link>
            <Link href="/about" className="btn btn-ghost btn-lg">
              Our Story
            </Link>
          </div>
        </div>
      </header>

      {/* Promo strip */}
      <div className="promo-strip">
        <div className="container">
          <div className="promo-carousel" id="promo-carousel">
            {PROMO_OFFERS.map((p, i) => (
              <div key={p.text} className={`promo-item ${i === promoIndex ? "active" : ""}`}>
                <span>{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Thirst */}
      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-title">Why Thirst.</h2>
          </Reveal>
          <Reveal>
            <p className="section-subtitle">
              Every treat is a little moment of joy — made with care, served with a smile.
            </p>
          </Reveal>
          <div className="card-grid" id="features">
            {WHY_CHOOSE_US.map((f) => (
              <Reveal key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Treats */}
      <section className="section" style={{ background: "var(--color-surface)" }}>
        <div className="container">
          <Reveal>
            <h2 className="section-title">Popular Treats</h2>
          </Reveal>
          <Reveal>
            <p className="section-subtitle">A few favourites from our handcrafted menu.</p>
          </Reveal>
          <div className="card-grid" id="popular">
            {menuError && (
              <p
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                }}
              >
                Menu is loading — <Link href="/menu">view it here</Link>.
              </p>
            )}
            {popular?.map((item) => (
              // Whole cards lead to the menu (browse-only site).
              <DishCard
                key={item.id}
                item={item}
                compact
                onClick={() => router.push("/menu")}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
