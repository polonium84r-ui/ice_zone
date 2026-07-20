import type { Metadata } from "next";
import AboutPage from "./about-client";

export const metadata: Metadata = {
  title: "About Us — Thirst.",
  description:
    "About Thirst. — Our story, team, values, and outlets around Thiruvallur & Chennai.",
};

export default function Page() {
  return <AboutPage />;
}
