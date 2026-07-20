/**
 * app.ts — Shared UI utilities: toasts, currency formatting, validation.
 * Direct port of the original app.js helpers (React handles HTML escaping).
 */

/* --- Toast System (same DOM/classes as the original design system) --- */
export function showToast(
  message: string,
  type: "success" | "error" | "info" | "warning" = "info",
  duration = 3000
) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const iconEl = document.createElement("span");
  iconEl.textContent = icons[type] || "";
  const msgEl = document.createElement("span");
  msgEl.textContent = message;
  toast.append(iconEl, msgEl);
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* --- Currency Formatting --- */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/* --- Form Validation --- */
export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""));
}

export function validatePassword(password: string) {
  return password.length >= 6;
}
