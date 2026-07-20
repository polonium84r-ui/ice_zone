"use client";

/**
 * DishCard — port of App.renderDishCard (display-only showcase card).
 */
import type { MenuItem } from "@/lib/client/api";
import { formatCurrency } from "@/lib/client/app";
import { Reveal } from "@/components/reveal";

export function DishCard({
  item,
  compact = false,
  onClick,
}: {
  item: MenuItem;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <Reveal className="dish-card" data-id={item.id} onClick={onClick}>
      <div className="dish-card-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = "/assets/hero.jpg";
          }}
        />
      </div>
      <div className="dish-card-body">
        <div className="dish-card-header">
          <h3>{item.name}</h3>
          <span
            className={`veg-indicator ${item.isVeg ? "veg" : "non-veg"}`}
            title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
          ></span>
        </div>
        {!compact && <p className="dish-desc">{item.description}</p>}
        <div className="dish-rating">
          <span className="star">★</span> {item.rating}{" "}
          <span className="count">({item.reviewCount})</span>
        </div>
        <div className="dish-footer">
          <span className="dish-price">{formatCurrency(item.price)}</span>
        </div>
      </div>
    </Reveal>
  );
}
