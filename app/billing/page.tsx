import type { Metadata } from "next";
import BillingPage from "./billing-client";

export const metadata: Metadata = {
  title: "Billing / POS — Thirst.",
  description: "Thirst. Staff Billing / POS — generate and share customer receipts.",
  robots: "noindex, nofollow",
};

export default function Page() {
  return <BillingPage />;
}
