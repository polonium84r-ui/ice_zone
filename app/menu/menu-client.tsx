"use client";

/**
 * Menu — port of menu.html: category filters, live search, veg-only toggle,
 * sort, and the read-only dish detail modal with reviews.
 */
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DishCard } from "@/components/dish-card";
import { Modal } from "@/components/modal";
import { CATEGORIES } from "@/lib/client/data";
import { formatCurrency } from "@/lib/client/app";
import { getMenu, getReviews, type MenuItem, type Review } from "@/lib/client/api";

type SortBy = "popularity" | "rating" | "price-asc" | "price-desc";

export default function MenuPage() {
  const [allMenu, setAllMenu] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("popularity");
  const [detail, setDetail] = useState<MenuItem | null>(null);
  const [detailReviews, setDetailReviews] = useState<Review[]>([]);

  useEffect(() => {
    getMenu().then(setAllMenu).catch(() => setAllMenu([]));
  }, []);

  const filtered = useMemo(() => {
    let list = [...allMenu];
    if (category !== "All") list = list.filter((item) => item.category === category);
    if (vegOnly) list = list.filter((item) => item.isVeg);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    switch (sortBy) {
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      default:
        list.sort((a, b) => b.reviewCount - a.reviewCount);
    }
    return list;
  }, [allMenu, category, vegOnly, search, sortBy]);

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
    setVegOnly(false);
    setSearch("");
    setSortBy("popularity");
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
          <div className="menu-toolbar">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                id="menu-search"
                placeholder="Search treats..."
                aria-label="Search menu"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="veg-toggle">
              <span>🥬 Veg Only</span>
              <div
                className={`toggle-switch ${vegOnly ? "active" : ""}`}
                role="switch"
                aria-checked={vegOnly}
                tabIndex={0}
                onClick={() => setVegOnly((v) => !v)}
              ></div>
            </div>
            <select
              className="sort-select"
              aria-label="Sort menu"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="popularity">Popularity</option>
              <option value="rating">Rating</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
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
              <p>Try adjusting your filters or search term.</p>
              <button className="btn btn-primary" onClick={clearFilters}>
                Clear Filters
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
                <div className="dish-rating" style={{ marginBottom: 16 }}>
                  <span className="star">★</span> {detail.rating}{" "}
                  <span className="count">({detail.reviewCount} reviews)</span>
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
