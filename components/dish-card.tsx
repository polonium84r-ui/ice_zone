"use client";

/**
 * DishCard — port of App.renderDishCard (display-only showcase card).
 */
import { useState } from "react";
import Image from "next/image";
import type { MenuItem } from "@/lib/client/api";
import { formatCurrency } from "@/lib/client/app";
import { Reveal } from "@/components/reveal";

const FALLBACK_IMAGE = "/assets/hero.jpg";

export function DishCard({
  item,
  compact = false,
  onClick,
}: {
  item: MenuItem;
  compact?: boolean;
  onClick?: () => void;
}) {
  const [src, setSrc] = useState(item.image || FALLBACK_IMAGE);
  return (
    <Reveal className="dish-card" data-id={item.id} onClick={onClick}>
      <div className="dish-card-image">
        <Image
          src={src}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
          style={{ objectFit: "cover" }}
          onError={() => setSrc(FALLBACK_IMAGE)}
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
        <div className="dish-footer">
          <span className="dish-price">{formatCurrency(item.price)}</span>
        </div>
      </div>
    </Reveal>
  );
}
