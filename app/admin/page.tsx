import type { Metadata } from "next";
import LoginPage from "./login-client";

export const metadata: Metadata = {
  title: "Staff & Admin Login — Thirst.",
  description: "Thirst. staff & admin sign in",
  robots: "noindex, nofollow",
};

export default function Page() {
  return <LoginPage />;
}
