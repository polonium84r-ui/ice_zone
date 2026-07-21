"use client";

/**
 * Menu — category filters and the read-only dish detail modal with reviews.
 */
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DishCard } from "@/components/dish-card";
import { Modal } from "@/components/modal";
import { CATEGORIES } from "@/lib/client/data";
import { formatCurrency } from "@/lib/client/app";
import { getMenu, getReviews, type MenuItem, type Review } from "@/lib/client/api";

export default function MenuPage() {
  const [allMenu, setAllMenu] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState("All");
  const [detail, setDetail] = useState<MenuItem | null>(null);
  const [detailReviews, setDetailReviews] = useState<Review[]>([]);

  useEffect(() => {
    getMenu().then(setAllMenu).catch(() => setAllMenu([]));
  }, []);

  const filtered = useMemo(() => {
    if (category === "All") return allMenu;
    return allMenu.filter((item) => item.category === category);
  }, [allMenu, category]);

  async function openDishDetail(item: MenuItem) {
    setDetail(item);
    setDetailReviews([]);
    try {
      setDetailReviews(await getReviews(item.id));
    } catch {
      /* reviews are optional */
    }
  }

  function clearFilters() {
    setCategory("All");
  }

  return (
    <>
      <Navbar activePage="menu" />

      {/* Filters */}
      <div className="menu-filters">
        <div className="container">
          <div className="category-bar" id="category-bar" role="tablist">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-chip ${cat === category ? "active" : ""}`}
                role="tab"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="card-grid" id="menu-grid">
            {filtered.map((item) => (
              <DishCard key={item.id} item={item} onClick={() => openDishDetail(item)} />
            ))}
          </div>
          {filtered.length === 0 && allMenu.length > 0 && (
            <div className="empty-state" id="no-results">
              <div className="empty-state-icon">🔍</div>
              <h3>No treats found</h3>
              <p>Try a different category.</p>
              <button className="btn btn-primary" onClick={clearFilters}>
                Show All
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Dish Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? "Dish Name"}
        large
      >
        {detail && (
          <>
            <div className="dish-detail">
              <div className="dish-detail-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={detail.image} alt={detail.name} />
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span
                    className={`veg-indicator ${detail.isVeg ? "veg" : "non-veg"}`}
                  ></span>
                  <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                    {detail.isVeg ? "Vegetarian" : "Non-Vegetarian"} · {detail.category}
                  </span>
                </div>
                <p style={{ marginBottom: 16, lineHeight: 1.7 }}>{detail.description}</p>
                <p className="dish-price" style={{ fontSize: 24 }}>
                  {formatCurrency(detail.price)}
                </p>
                {detail.tags.length > 0 && (
                  <div
                    style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}
                  >
                    {detail.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          background: "var(--color-background)",
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {detailReviews.length ? (
              <div className="reviews-list">
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Customer Reviews</h3>
                {detailReviews.map((r) => (
                  <div key={r.id} className="review-item">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: 14 }}>{r.customerName || "Customer"}</strong>
                      <span style={{ color: "var(--color-accent)" }}>
                        {"★".repeat(r.rating)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-muted)",
                        marginTop: 4,
                      }}
                    >
                      {r.comment || ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ marginTop: 20, color: "var(--color-text-muted)", fontSize: 14 }}>
                No reviews yet. Be the first!
              </p>
            )}
          </>
        )}
      </Modal>

      <Footer newsletter />

      {/* No page-header banner here, so offset content below the fixed navbar. */}
      <style>{`body { padding-top: var(--navbar-height); }`}</style>
    </>
  );
}
