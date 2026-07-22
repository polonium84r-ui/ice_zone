"use client";

/**
 * About — story, mission/vision, franchise CTA, and a combined visit/contact
 * panel (single flagship store today, but the info list scales cleanly if
 * more outlets are added later) plus the franchise enquiry modal.
 */
import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Modal } from "@/components/modal";
import { Reveal } from "@/components/reveal";
import { OUTLETS } from "@/lib/client/data";
import { showToast, validateEmail, validatePhone } from "@/lib/client/app";

const FLAGSHIP = OUTLETS[0];

export default function AboutPage() {
  const [franchiseOpen, setFranchiseOpen] = useState(false);
  const [contactEmailError, setContactEmailError] = useState("");

  function handleContactSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    if (email && !validateEmail(email)) {
      setContactEmailError("Please enter a valid email address");
      return;
    }
    setContactEmailError("");
    showToast("Message sent successfully! We'll get back to you soon.", "success");
    form.reset();
  }

  function handleFranchiseSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    if ((email && !validateEmail(email)) || (phone && !validatePhone(phone))) {
      showToast("Please enter a valid email and phone number", "error");
      return;
    }
    showToast("Franchise enquiry submitted! Our team will contact you within 48 hours.", "success");
    setFranchiseOpen(false);
    form.reset();
  }

  return (
    <>
      <Navbar activePage="about" />

      {/* Hero */}
      <section className="about-hero">
        <Image
          src="https://images.unsplash.com/photo-1754444217186-4cf13df89ad8?w=1920&q=80"
          alt="Loaded waffles with whipped cream, chocolate drizzle and strawberries"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center 32%" }}
        />
        <div className="about-hero-overlay">
          <span className="story-badge">🍫 One for Living</span>
          <h1>Our Story</h1>
          <p style={{ marginTop: 12, opacity: 0.9 }}>
            Handcrafted hot chocolate, waffles &amp; desserts — one for living.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="section">
        <div className="container">
          <Reveal className="story-section">
            <div>
              <span className="section-eyebrow">Our Journey</span>
              <h2 className="section-title" style={{ textAlign: "left", marginBottom: 20 }}>
                Made With Love
              </h2>
              <div className="story-copy">
                <p>
                  Thirst. began with a simple idea — that a dessert can be more than a
                  snack; it can be a little moment of joy. We opened our doors in
                  Thiruvallur to serve handcrafted hot chocolate, waffles, shakes and
                  desserts made with premium ingredients.
                </p>
                <p>
                  Everything is made fresh, to order — from our signature hot chocolates
                  to loaded waffles, thick shakes, brownies and pancakes. No shortcuts,
                  just flavours we would happily serve our own family.
                </p>
                <p>
                  What started as one counter has grown into a much-loved neighbourhood
                  spot, open daily from 5 PM to 10 PM — and this is only the beginning of
                  our sweet story.
                </p>
              </div>
              <div className="story-highlights">
                <span className="highlight-chip">
                  <span className="icon">🍫</span> Handcrafted Daily
                </span>
                <span className="highlight-chip">
                  <span className="icon">🌟</span> Premium Ingredients
                </span>
                <span className="highlight-chip">
                  <span className="icon">🕔</span> Fresh, 5–10 PM
                </span>
              </div>
            </div>
            <div className="story-image">
              <Image
                src="https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&q=80"
                alt="Hot chocolate being poured"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
              <div className="story-image-badge">
                <span className="story-image-badge-icon" aria-hidden="true">
                  🤝
                </span>
                <div>
                  <strong>Handmade, Always</strong>
                  <p>No shortcuts — just real flavour, poured fresh every day.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section" style={{ background: "var(--color-surface)" }}>
        <div className="container">
          <Reveal>
            <span className="section-eyebrow text-center">What Drives Us</span>
            <h2 className="section-title">Our Purpose</h2>
          </Reveal>
          <Reveal>
            <p className="section-subtitle">
              The principles guiding everything we make, cup by cup.
            </p>
          </Reveal>
          <Reveal className="mission-grid">
            <div className="mission-card">
              <div className="mission-card-icon" aria-hidden="true">
                🎯
              </div>
              <h3>Our Mission</h3>
              <p style={{ marginTop: 12, color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                To craft joyful desserts using premium ingredients — handmade fresh to
                order, with a relentless commitment to quality, hygiene, and a smile with
                every serve.
              </p>
            </div>
            <div className="mission-card" style={{ borderLeftColor: "var(--color-accent)" }}>
              <div className="mission-card-icon" aria-hidden="true">
                🌟
              </div>
              <h3>Our Vision</h3>
              <p style={{ marginTop: 12, color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                To become the most-loved dessert brand in the region — where every treat
                feels like a celebration, every customer feels like family, and every
                neighborhood has a Thirst. nearby.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Franchise CTA */}
      <section className="section">
        <div className="container">
          <Reveal className="franchise-cta">
            <div>
              <h2>Bring Thirst. to Your City</h2>
              <p>
                We&apos;re growing — join our family of dessert cafés and bring
                handcrafted hot chocolate, waffles &amp; shakes to your neighbourhood.
              </p>
            </div>
            <button
              className="btn btn-accent btn-lg"
              onClick={() => setFranchiseOpen(true)}
            >
              Franchise Enquiry
            </button>
          </Reveal>
        </div>
      </section>

      {/* Visit & Connect */}
      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-title">Visit Us</h2>
          </Reveal>
          <Reveal>
            <p className="section-subtitle">
              Drop by our flagship store, or send us a message — we&apos;d love to hear
              from you.
            </p>
          </Reveal>
          <Reveal className="visit-panel">
            <div className="visit-info">
              <h3>{FLAGSHIP.city}</h3>
              <p className="visit-subtitle">Come say hi in person.</p>

              <div className="visit-info-list">
                <div className="visit-info-row">
                  <span className="icon" aria-hidden="true">
                    📍
                  </span>
                  <span>{FLAGSHIP.address}</span>
                </div>
                <div className="visit-info-row">
                  <span className="icon" aria-hidden="true">
                    📞
                  </span>
                  <a href={`tel:${FLAGSHIP.phone.replace(/\s+/g, "")}`}>{FLAGSHIP.phone}</a>
                </div>
                <div className="visit-info-row">
                  <span className="icon" aria-hidden="true">
                    📷
                  </span>
                  <a
                    href="https://www.instagram.com/thirst_fresh"
                    target="_blank"
                    rel="noopener"
                  >
                    @thirst_fresh
                  </a>
                </div>
                <div className="visit-info-row">
                  <span className="icon" aria-hidden="true">
                    ✉️
                  </span>
                  <a href="mailto:thirst.freshchennai@gmail.com">
                    thirst.freshchennai@gmail.com
                  </a>
                </div>
              </div>

              <h4 style={{ marginBottom: 12, fontFamily: "var(--font-body)" }}>
                Store Hours
              </h4>
              <table className="hours-table">
                <tbody>
                  <tr>
                    <td>Open Daily</td>
                    <td>{FLAGSHIP.hours}</td>
                  </tr>
                  <tr>
                    <td>Fresh Batches</td>
                    <td>Made daily</td>
                  </tr>
                </tbody>
              </table>

              <a
                className="map-directions-card"
                href="https://maps.app.goo.gl/B3HB5LV4crU98EDYA"
                target="_blank"
                rel="noopener"
                aria-label="Open Thirst. flagship store location in Google Maps"
              >
                <span className="map-directions-card-icon" aria-hidden="true">
                  📍
                </span>
                <span>
                  <strong>Get Directions</strong>
                  <span className="address">{FLAGSHIP.address}</span>
                  <span className="cta">Open in Google Maps →</span>
                </span>
              </a>
            </div>

            <div className="visit-form">
              <h3>Send a Message</h3>
              <p className="visit-subtitle">We usually reply within a day.</p>
              <form id="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label htmlFor="contact-name">Your Name</label>
                  <input type="text" id="contact-name" name="name" className="form-control" required />
                  <span className="form-error"></span>
                </div>
                <div className="form-group">
                  <label htmlFor="contact-email">Email</label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    className={`form-control ${contactEmailError ? "error" : ""}`}
                    required
                  />
                  <span className={`form-error ${contactEmailError ? "visible" : ""}`}>
                    {contactEmailError}
                  </span>
                </div>
                <div className="form-group">
                  <label htmlFor="contact-subject">Subject</label>
                  <input type="text" id="contact-subject" name="subject" className="form-control" required />
                  <span className="form-error"></span>
                </div>
                <div className="form-group">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className="form-control"
                    rows={5}
                    required
                  ></textarea>
                  <span className="form-error"></span>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                  Send Message
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Franchise Modal */}
      <Modal
        open={franchiseOpen}
        onClose={() => setFranchiseOpen(false)}
        title="Franchise Enquiry"
      >
        <form id="franchise-form" onSubmit={handleFranchiseSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" className="form-control" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" className="form-control" required />
            <span className="form-error"></span>
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" className="form-control" required />
            <span className="form-error"></span>
          </div>
          <div className="form-group">
            <label>Preferred City</label>
            <input
              type="text"
              name="city"
              className="form-control"
              required
              placeholder="e.g., Pune, Chennai"
            />
          </div>
          <div className="form-group">
            <label>Investment Range</label>
            <select name="investment" className="form-control" required defaultValue="">
              <option value="">Select range</option>
              <option>₹25L – ₹50L</option>
              <option>₹50L – ₹1Cr</option>
              <option>₹1Cr+</option>
            </select>
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea
              name="message"
              className="form-control"
              rows={3}
              placeholder="Tell us about your interest..."
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Submit Enquiry
          </button>
        </form>
      </Modal>

      <Footer newsletter />
    </>
  );
}
