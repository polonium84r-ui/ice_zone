/**
 * receipt.ts — receipt HTML, PDF generation (jsPDF + html2canvas via an
 * isolated receipt-width iframe) and 80mm thermal printing. Direct port of
 * the billing.html receipt pipeline.
 */
import type { Bill } from "@/lib/client/api";
import { STORE } from "@/lib/client/data";
import { formatCurrency } from "@/lib/client/app";

const money = (n: number) => formatCurrency(n);

function esc(v: unknown) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildReceiptHTML(b: Bill) {
  const date = new Date(b.createdAt);
  return `
    <div class="receipt" id="receipt-el">
      <div class="receipt-head">
        <img src="/assets/thirst-logo.png" alt="">
        <h3>${STORE.name}</h3>
        <p>${STORE.tagline}</p>
        <p>${STORE.address}</p>
        <p>${STORE.phone} · FSSAI: ${STORE.fssai}</p>
      </div>
      <div class="receipt-meta">
        <div><span>Bill No.</span><strong>${esc(b.billNumber)}</strong></div>
        <div><span>Date</span><span>${date.toLocaleString("en-IN")}</span></div>
        ${
          b.customerName && b.customerName !== "Walk-in Customer"
            ? `<div><span>Customer</span><span>${esc(b.customerName)}${b.customerPhone ? " · " + esc(b.customerPhone) : ""}</span></div>`
            : ""
        }
      </div>
      <div class="receipt-lines">
        ${b.items
          .map(
            (it) => `
          <div class="rl"><span>${esc(it.name)} <small>× ${Number(it.quantity)}</small></span><span>${money(it.price * it.quantity)}</span></div>
        `
          )
          .join("")}
      </div>
      <div class="receipt-totals">
        <div class="rt"><span>Subtotal</span><span>${money(b.subtotal)}</span></div>
        ${b.discount > 0 ? `<div class="rt"><span>Discount</span><span>-${money(b.discount)}</span></div>` : ""}
        ${b.tax > 0 ? `<div class="rt"><span>GST</span><span>${money(b.tax)}</span></div>` : ""}
        <div class="rt grand"><span>TOTAL</span><span>${money(b.total)}</span></div>
      </div>
      <div class="receipt-foot">
        Thank you for visiting Thirst.<br>One for Living — see you again soon.
      </div>
    </div>
  `;
}

// Compact, receipt-shaped CSS used for both the PDF capture and printing so
// the right-aligned values stay inside the narrow receipt width.
const RECEIPT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: #1a0e08; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  .receipt { width: 282px; padding: 14px; background: #fff; }
  .receipt-head { text-align: center; margin-bottom: 10px; }
  .receipt-head img { height: 96px; width: 96px; object-fit: contain; margin-bottom: 4px; }
  .receipt-head h3 { font-family: Arial, Helvetica, sans-serif; font-size: 20px; margin: 6px 0 2px; }
  .receipt-head p { font-size: 10px; line-height: 1.45; margin: 0; color: #333; }
  .receipt-meta { font-size: 11px; margin: 10px 0; border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 8px 0; }
  .receipt-meta div { display: flex; justify-content: space-between; gap: 12px; padding: 2px 0; }
  .receipt-lines { font-size: 11px; margin: 10px 0; }
  .receipt-lines .rl { display: flex; justify-content: space-between; gap: 12px; padding: 3px 0; }
  .receipt-lines small { color: #666; }
  .receipt-totals { font-size: 11px; border-top: 1px dashed #999; padding-top: 8px; }
  .receipt-totals .rt { display: flex; justify-content: space-between; padding: 2px 0; }
  .receipt-totals .rt.grand { font-size: 15px; font-weight: 700; border-top: 1px solid #333; margin-top: 6px; padding-top: 8px; }
  .receipt-foot { text-align: center; font-size: 10px; margin-top: 12px; border-top: 1px dashed #999; padding-top: 10px; color: #444; }
`;

// Renders the receipt into an isolated, receipt-width iframe and captures it
// to a crisp PDF (keeps the ₹ symbol and logo, values aligned correctly).
export async function makePdfBlob(b: Bill): Promise<Blob> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:310px;height:10px;border:0;";
  document.body.appendChild(iframe);
  try {
    const d = iframe.contentWindow!.document;
    d.open();
    d.write(
      `<!doctype html><html><head><meta charset="utf-8"><base href="${location.origin}/"><style>${RECEIPT_CSS}</style></head><body>${buildReceiptHTML(b)}</body></html>`
    );
    d.close();
    // wait for the logo image to load so it appears in the capture
    await new Promise<void>((res) => {
      const img = d.querySelector<HTMLImageElement>(".receipt-head img");
      if (!img || img.complete) return res();
      img.onload = img.onerror = () => res();
      setTimeout(res, 1500);
    });
    const target = d.querySelector<HTMLElement>(".receipt")!;
    const canvas = await html2canvas(target, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdfW = 80; // mm — standard thermal receipt width
    const pdfH = +((pdfW * canvas.height) / canvas.width).toFixed(2);
    const doc = new jsPDF({ unit: "mm", format: [pdfW, pdfH], compress: true });
    doc.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    return doc.output("blob");
  } finally {
    iframe.remove();
  }
}

export async function makePdfFile(b: Bill) {
  const blob = await makePdfBlob(b);
  return new File([blob], (b.billNumber || "receipt") + ".pdf", { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// Print via a dedicated, isolated document sized like an 80mm POS receipt.
// This avoids printing the whole app and keeps it to a single clean page.
export function printReceipt(b: Bill) {
  const old = document.getElementById("receipt-print-frame");
  if (old) old.remove();
  const iframe = document.createElement("iframe");
  iframe.id = "receipt-print-frame";
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow!.document;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8">
    <base href="${location.origin}/">
    <title>${b.billNumber}</title>
    <style>
      @page { size: 80mm auto; margin: 4mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #000; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
      .receipt { width: 72mm; }
      .receipt-head { text-align: center; margin-bottom: 8px; }
      .receipt-head img { height: 80px; width: 80px; object-fit: contain; }
      .receipt-head h3 { font-family: Arial, Helvetica, sans-serif; font-size: 16px; margin: 6px 0 2px; }
      .receipt-head p { font-size: 10px; line-height: 1.4; margin: 0; }
      .receipt-meta { font-size: 11px; margin: 8px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; }
      .receipt-meta div { display: flex; justify-content: space-between; padding: 1px 0; gap: 10px; }
      .receipt-lines { font-size: 11px; margin: 8px 0; }
      .receipt-lines .rl { display: flex; justify-content: space-between; padding: 2px 0; gap: 10px; }
      .receipt-lines small { color: #333; }
      .receipt-totals { font-size: 11px; border-top: 1px dashed #000; padding-top: 6px; }
      .receipt-totals .rt { display: flex; justify-content: space-between; padding: 1px 0; }
      .receipt-totals .rt.grand { font-size: 14px; font-weight: 700; border-top: 1px solid #000; margin-top: 4px; padding-top: 6px; }
      .receipt-foot { text-align: center; font-size: 10px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px; }
    </style></head><body>${buildReceiptHTML(b)}</body></html>`);
  doc.close();

  let printed = false;
  const go = () => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
    } finally {
      setTimeout(() => iframe.remove(), 800);
    }
  };
  const img = doc.querySelector<HTMLImageElement>(".receipt-head img");
  if (img && !img.complete) {
    img.onload = go;
    img.onerror = go;
    setTimeout(go, 1500);
  } else {
    setTimeout(go, 250);
  }
}
