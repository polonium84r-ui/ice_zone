"use client";

/**
 * Staff & Admin login — port of login.html. Served at /admin like the
 * original site. An already-signed-in staff/admin is bounced straight on to
 * their console (admin → /admin/dashboard, staff → /billing).
 */
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, getSession } from "@/lib/client/api";
import { showToast, validateEmail, validatePassword } from "@/lib/client/app";
import { BodyClass } from "@/components/body-class";

// Where each role lands after signing in.
const landingFor = (role?: string) => (role === "admin" ? "/admin/dashboard" : "/billing");

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [shake, setShake] = useState(false);

  // Already signed in? Go straight to the console.
  useEffect(() => {
    getSession().then((session) => {
      if (session && ["admin", "staff"].includes(session.user.role)) {
        router.replace(landingFor(session.user.role));
      }
    });
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    let valid = true;
    if (!email) {
      setEmailError("This field is required");
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    } else setEmailError("");
    if (!password) {
      setPasswordError("This field is required");
      valid = false;
    } else if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    } else setPasswordError("");
    if (!valid) return;

    try {
      const session = await login(email, password);
      // Only staff & admin accounts may sign in.
      if (!["admin", "staff"].includes(session.user.role)) {
        throw new Error("This account does not have access.");
      }
      showToast("Welcome, " + session.user.name.split(" ")[0] + "!", "success");
      setTimeout(() => router.push(landingFor(session.user.role)), 600);
    } catch (err) {
      setPasswordInvalid(true);
      showToast((err as Error).message, "error");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div className="auth-page">
      <BodyClass className="auth-page-body" />
      {/* Left Image Panel */}
      <div className="auth-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/hero.jpg" alt="Handcrafted hot chocolate and desserts" />
        <div className="auth-image-overlay">
          <div>
            <h2>Thirst. Console</h2>
            <p style={{ marginTop: 12, opacity: 0.9 }}>
              Sign in to manage the menu, run billing, and view your store.
            </p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/thirst-logo.png" alt="Thirst." className="auth-logo-img" />
          <h1>Staff &amp; Admin</h1>
          <p className="subtitle">Sign in to your Thirst. account</p>

          <form
            id="login-form"
            onSubmit={handleSubmit}
            style={shake ? { animation: "shake 0.4s ease" } : undefined}
          >
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                type="email"
                id="login-email"
                name="email"
                className={`form-control ${emailError ? "error" : ""}`}
                required
                placeholder="you@thirst.in"
                autoComplete="username"
              />
              <span className={`form-error ${emailError ? "visible" : ""}`}>{emailError}</span>
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  name="password"
                  className={`form-control ${passwordError || passwordInvalid ? "error" : ""}`}
                  required
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <span className={`form-error ${passwordError ? "visible" : ""}`}>
                {passwordError}
              </span>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Sign In
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24 }}>
            <Link href="/" style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
