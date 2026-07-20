"use client";

/**
 * About — port of about.html: story, mission/vision, values, outlets,
 * contact form, and the franchise enquiry modal.
 */
import { useState, type FormEvent } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Modal } from "@/components/modal";
import { Reveal } from "@/components/reveal";
import { OUTLETS } from "@/lib/client/data";
import { showToast, validateEmail, validatePhone } from "@/lib/client/app";

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1504387432042-8aca549e4729?w=1920&q=80"
          alt="Handcrafted waffles and desserts"
        />
        <div className="about-hero-overlay">
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
              <h2 className="section-title" style={{ textAlign: "left" }}>
                Made With Love
              </h2>
              <p
                style={{
                  marginBottom: 16,
                  lineHeight: 1.8,
                  color: "var(--color-text-muted)",
                }}
              >
                Thirst. began with a simple idea — that a dessert can be more than a snack;
                it can be a little moment of joy. We opened our doors in Thiruvallur to
                serve handcrafted hot chocolate, waffles, shakes and desserts made with
                premium ingredients.
              </p>
              <p
                style={{
                  marginBottom: 16,
                  lineHeight: 1.8,
                  color: "var(--color-text-muted)",
                }}
              >
                Everything is made fresh, to order — from our signature hot chocolates to
                loaded waffles, thick shakes, brownies and pancakes. No shortcuts, just
                flavours we would happily serve our own family.
              </p>
              <p style={{ lineHeight: 1.8, color: "var(--color-text-muted)" }}>
                What started as one counter has grown into a much-loved neighbourhood spot,
                open daily from 5 PM to 10 PM — and this is only the beginning of our sweet
                story.
              </p>
            </div>
            <div className="story-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&q=80"
                alt="Hot chocolate being poured"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section" style={{ background: "var(--color-surface)" }}>
        <div className="container">
          <Reveal className="mission-grid">
            <div className="mission-card">
              <h3>Our Mission</h3>
              <p style={{ marginTop: 12, color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                To craft joyful desserts using premium ingredients — handmade fresh to
                order, with a relentless commitment to quality, hygiene, and a smile with
                every serve.
              </p>
            </div>
            <div className="mission-card" style={{ borderLeftColor: "var(--color-accent)" }}>
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

      {/* Values */}
      <section className="section">
        <div className="container">
          <Reveal className="values-strip">
            <div className="value-item">
              <div className="icon">🏆</div>
              <h3>Quality</h3>
              <p>Premium ingredients, zero shortcuts, every single time.</p>
            </div>
            <div className="value-item">
              <div className="icon">🧼</div>
              <h3>Hygiene</h3>
              <p>FSSAI certified kitchens with 5-star cleanliness standards.</p>
            </div>
            <div className="value-item">
              <div className="icon">🤝</div>
              <h3>Community</h3>
              <p>Supporting local farmers and giving back to our neighborhoods.</p>
            </div>
            <div className="value-item">
              <div className="icon">💡</div>
              <h3>Innovation</h3>
              <p>Blending tradition with technology for a seamless experience.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Outlets */}
      <section className="section" style={{ background: "var(--color-surface)" }}>
        <div className="container">
          <Reveal>
            <h2 className="section-title">Our Outlets</h2>
          </Reveal>
          <Reveal>
            <p className="section-subtitle">
              Visit us at any of our stores around Thiruvallur & Chennai.
            </p>
          </Reveal>
          <div className="outlet-grid" id="outlet-grid">
            {OUTLETS.map((o) => (
              <Reveal key={o.city} className="outlet-card">
                <h3>{o.city}</h3>
                <p>📍 {o.address}</p>
                <p>📞 {o.phone}</p>
                <p>🕐 {o.hours}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="text-center mt-3">
            <button className="btn btn-accent" onClick={() => setFranchiseOpen(true)}>
              Franchise Enquiry
            </button>
          </Reveal>
        </div>
      </section>

      {/* Contact */}
      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-title">Contact Us</h2>
          </Reveal>
          <Reveal>
            <p className="section-subtitle">We&apos;d love to hear from you.</p>
          </Reveal>
          <Reveal className="contact-grid">
            <div>
              <h3 style={{ marginBottom: 16 }}>Get in Touch</h3>
              <p style={{ marginBottom: 8 }}>
                <strong>Flagship Store</strong>
              </p>
              <p style={{ color: "var(--color-text-muted)", marginBottom: 16 }}>
                No. 01, Siva Vishnu Kovil Street, Kakkalur, Thiruvallur – 602 001
              </p>
              <p style={{ marginBottom: 8 }}>📞 +91 85250 03546</p>
              <p style={{ marginBottom: 8 }}>
                📷{" "}
                <a
                  href="https://www.instagram.com/thirst_fresh"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "inherit" }}
                >
                  @thirst_fresh
                </a>
              </p>
              <p style={{ marginBottom: 24 }}>✉️ thirst.freshchennai@gmail.com</p>

              <h4 style={{ marginBottom: 12, fontFamily: "var(--font-body)" }}>
                Store Hours
              </h4>
              <table className="hours-table">
                <tbody>
                  <tr>
                    <td>Open Daily</td>
                    <td>5:00 PM – 10:00 PM</td>
                  </tr>
                  <tr>
                    <td>Fresh Batches</td>
                    <td>Made daily</td>
                  </tr>
                </tbody>
              </table>

              <a
                className="map-directions-card mt-3"
                href="https://maps.app.goo.gl/B3HB5LV4crU98EDYA"
                target="_blank"
                rel="noopener"
                aria-label="Open Thirst. flagship store location in Google Maps"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: 20,
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-surface)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span style={{ fontSize: 40, lineHeight: 1 }} aria-hidden="true">
                  📍
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <strong style={{ fontFamily: "var(--font-body)", fontSize: 16 }}>
                    Thirst. — Flagship Store
                  </strong>
                  <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    No. 01, Siva Vishnu Kovil Street, Kakkalur, Thiruvallur – 602 001
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-primary)",
                      marginTop: 4,
                    }}
                  >
                    Get Directions on Google Maps →
                  </span>
                </span>
              </a>
            </div>
            <div>
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
                <button type="submit" className="btn btn-primary">
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
