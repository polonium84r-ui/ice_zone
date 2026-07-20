import type { Metadata } from "next";
import MenuPage from "./menu-client";

export const metadata: Metadata = {
  title: "Menu — Thirst.",
  description:
    "Browse the Thirst. menu — hot chocolate, waffles, thick shakes, brownies, pancakes & more.",
};

export default function Page() {
  return <MenuPage />;
}
