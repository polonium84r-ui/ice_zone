"use client";

/**
 * Site footer — identical markup to the original pages. The newsletter form
 * appears on the pages that had it (menu, about).
 */
import Link from "next/link";
import { showToast } from "@/lib/client/app";

export function Footer({ newsletter = false }: { newsletter?: boolean }) {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/thirst-logo.png" alt="" className="footer-logo-img" />
              Thirst.
            </h4>
            <p>
              Handcrafted hot chocolate, waffles, shakes &amp; desserts — made fresh in
              Thiruvallur. One for living.
            </p>
            <div className="footer-social">
              <a
                href="https://www.instagram.com/thirst_fresh"
                target="_blank"
                rel="noopener"
                aria-label="Instagram"
              >
                📷
              </a>
              <a
                href="https://youtube.com/@thirstfreshzz"
                target="_blank"
                rel="noopener"
                aria-label="YouTube"
              >
                ▶️
              </a>
            </div>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/menu">Menu</Link>
              </li>
              <li>
                <Link href="/about">About Us</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Opening Hours</h4>
            <ul>
              <li>Open Daily: 5:00 PM – 10:00 PM</li>
              <li>Fresh batches made daily</li>
            </ul>
          </div>
          <div>
            <h4>Contact Us</h4>
            <p>
              No. 01, Siva Vishnu Kovil Street,
              <br />
              Kakkalur, Thiruvallur – 602 001
            </p>
            <p>📞 +91 85250 03546</p>
            <p>✉️ thirst.freshchennai@gmail.com</p>
            {newsletter && (
              <form
                className="newsletter-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  showToast("Thank you for subscribing!", "success");
                  e.currentTarget.reset();
                }}
              >
                <input type="email" placeholder="Your email" required aria-label="Newsletter email" />
                <button type="submit" className="btn btn-primary btn-sm">
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Thirst. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
