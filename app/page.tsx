import HomePage from "./home-client";

// Structured data (schema.org Restaurant) — same as the original index.html.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Thirst.",
  description: "Handcrafted hot chocolate, waffles, shakes & desserts",
  address: {
    "@type": "PostalAddress",
    streetAddress: "No. 01, Siva Vishnu Kovil Street, Kakkalur",
    addressLocality: "Thiruvallur",
    postalCode: "602 001",
    addressCountry: "IN",
  },
  telephone: "+91-85250-03546",
  priceRange: "₹₹",
  servesCuisine: "Desserts, Hot Chocolate, Waffles, Shakes",
  openingHours: "Mo-Su 17:00-22:00",
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePage />
    </>
  );
}
