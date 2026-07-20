import type { Metadata } from "next";
import AdminPage from "./admin-client";

export const metadata: Metadata = {
  title: "Admin Dashboard — Thirst.",
  description:
    "Thirst. Admin Dashboard — manage the menu, users, coupons, billing, and audit log.",
  robots: "noindex, nofollow",
};

export default function Page() {
  return <AdminPage />;
}
