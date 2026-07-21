"use client";

/**
 * Billing / POS — port of billing.html: build a walk-in bill from the live
 * menu or custom line items, discounts, auto-numbered invoices, and a
 * shareable receipt (WhatsApp / PDF / 80mm print). Staff & admin only.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BodyClass } from "@/components/body-class";
import { Modal } from "@/components/modal";
import { STORE } from "@/lib/client/data";
import { formatCurrency, showToast } from "@/lib/client/app";
import * as API from "@/lib/client/api";
import type { Bill, MenuItem, SessionUser } from "@/lib/client/api";
import { buildReceiptHTML, downloadBlob, makePdfBlob, makePdfFile, printReceipt } from "./receipt";

type BillLine = { key: string; id?: number; name: string; price: number; quantity: number };

const money = (n: number) => formatCurrency(n);

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [bill, setBill] = useState<BillLine[]>([]);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [discount, setDiscount] = useState("0");
  const [payment, setPayment] = useState("cash");
  const [recent, setRecent] = useState<Bill[] | null>(null);
  const [recentError, setRecentError] = useState("");
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [whatsappBusy, setWhatsappBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const loadRecent = useCallback(async () => {
    try {
      setRecent(await API.getBills());
      setRecentError("");
    } catch (err) {
      setRecentError((err as Error).message);
    }
  }, []);

  // Init — staff OR admin (POS billing). Everyone else goes to the login.
  useEffect(() => {
    (async () => {
      const session = await API.getSession();
      if (!session || !["admin", "staff"].includes(session.user.role)) {
        router.replace("/admin");
        return;
      }
      setUser(session.user);
      try {
        setMenu(await API.getMenu());
      } catch (err) {
        showToast("Could not load menu: " + (err as Error).message, "error");
      }
      await loadRecent();
    })();
  }, [router, loadRecent]);

  // Render the receipt preview into the modal (same markup as PDF/print).
  useEffect(() => {
    if (receiptOpen && lastBill && receiptRef.current) {
      receiptRef.current.innerHTML = buildReceiptHTML(lastBill);
    }
  }, [receiptOpen, lastBill]);

  function computeTotals(lines: BillLine[], discountStr: string) {
    const subtotal = lines.reduce((s, it) => s + it.price * it.quantity, 0);
    const disc = Math.min(parseFloat(discountStr) || 0, subtotal);
    const taxable = Math.max(0, subtotal - disc);
    const tax = Math.round(taxable * STORE.gstRate * 100) / 100;
    const total = Math.round((taxable + tax) * 100) / 100;
    return { subtotal, discount: disc, tax, total };
  }

  function addToBill({ id, name, price }: { id?: number; name: string; price: number }) {
    const key = id != null ? "m" + id : "c" + name.toLowerCase();
    setBill((prev) => {
      const existing = prev.find((b) => b.key === key);
      if (existing) {
        return prev.map((b) => (b.key === key ? { ...b, quantity: b.quantity + 1 } : b));
      }
      return [...prev, { key, id, name, price: Number(price), quantity: 1 }];
    });
  }

  function changeQty(key: string, delta: number) {
    setBill((prev) =>
      prev
        .map((b) => (b.key === key ? { ...b, quantity: b.quantity + delta } : b))
        .filter((b) => b.quantity > 0)
    );
  }

  function removeLine(key: string) {
    setBill((prev) => prev.filter((b) => b.key !== key));
  }

  function handleCustomItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const price = parseFloat((form.elements.namedItem("price") as HTMLInputElement).value);
    const qty =
      parseInt((form.elements.namedItem("quantity") as HTMLInputElement).value) || 1;
    if (!name || !(price > 0)) {
      showToast("Enter a name and price", "warning");
      return;
    }
    for (let i = 0; i < qty; i++) addToBill({ name, price });
    form.reset();
    (form.elements.namedItem("quantity") as HTMLInputElement).value = "1";
  }

  async function generateReceipt() {
    if (!bill.length) return;
    setGenerating(true);
    try {
      const created = await API.createBill({
        customerName: custName.trim() || "Walk-in Customer",
        customerPhone: custPhone.trim(),
        items: bill.map((b) => ({ name: b.name, price: b.price, quantity: b.quantity })),
        discount: parseFloat(discount) || 0,
        taxRate: STORE.gstRate,
        paymentMethod: payment,
      });
      setLastBill(created);
      setReceiptOpen(true);
      await loadRecent();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setGenerating(false);
    }
  }

  // Share actions — all produce a PDF of the bill
  async function shareWhatsApp() {
    if (!lastBill || whatsappBusy) return;
    setWhatsappBusy(true);
    try {
      const file = await makePdfFile(lastBill);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // Mobile/tablet: native share sheet → pick WhatsApp → PDF attached
        await navigator.share({
          files: [file],
          title: "Bill " + lastBill.billNumber,
          text: "Your Thirst. bill",
        });
      } else {
        // Desktop: wa.me can't attach files, so download the PDF and open the chat to attach it
        downloadBlob(file, file.name);
        const phone = (lastBill.customerPhone || "").replace(/\D/g, "");
        const wa = phone ? `https://wa.me/91${phone}` : "https://wa.me/";
        window.open(wa, "_blank", "noopener");
        showToast(
          "Bill saved as PDF — attach it in the WhatsApp chat that just opened",
          "info",
          5000
        );
      }
    } catch (err) {
      if (!(err && (err as Error).name === "AbortError"))
        showToast((err as Error).message, "error");
    } finally {
      setWhatsappBusy(false);
    }
  }

  async function downloadPdf() {
    if (!lastBill || pdfBusy) return;
    setPdfBusy(true);
    try {
      const blob = await makePdfBlob(lastBill);
      downloadBlob(blob, (lastBill.billNumber || "receipt") + ".pdf");
      showToast("PDF downloaded", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setPdfBusy(false);
    }
  }

  function newBill() {
    setBill([]);
    setLastBill(null);
    setCustName("");
    setCustPhone("");
    setDiscount("0");
    setReceiptOpen(false);
  }

  const q = search.trim().toLowerCase();
  const filteredMenu = q
    ? menu.filter(
        (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
      )
    : menu;
  const totals = computeTotals(bill, discount);

  return (
    <>
      <BodyClass className="pos-body" />

      {/* Top bar */}
      <header className="pos-topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/thirst-logo.png" alt="Thirst." />
          <div>
            <h1>Billing / POS</h1>
            <span>Thirst. — Counter Terminal</span>
          </div>
        </div>
        <div className="actions">
          <span className="staff-chip">{user ? `${user.name} · ${user.role}` : ""}</span>
          {user?.role === "admin" && (
            <Link href="/admin/dashboard" className="btn btn-secondary btn-sm">
              Admin
            </Link>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              await API.logout();
              router.push("/admin");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="pos-layout">
        {/* Item picker */}
        <div className="pos-panel">
          <h2>Add Items</h2>
          <input
            type="search"
            className="pos-search"
            placeholder="Search menu items…"
            aria-label="Search items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="pos-menu-grid">
            {filteredMenu.length === 0 && <p className="bill-empty">No matching items.</p>}
            {filteredMenu.map((m) => (
              <button
                key={m.id}
                type="button"
                className="pos-menu-card"
                onClick={() => addToBill({ id: m.id, name: m.name, price: m.price })}
              >
                <h4>{m.name}</h4>
                <div className="cat">{m.category}</div>
                <div className="price">{money(m.price)}</div>
              </button>
            ))}
          </div>

          <form className="custom-item-row" onSubmit={handleCustomItem}>
            <div className="form-group">
              <label>Custom item</label>
              <input type="text" className="form-control" name="name" placeholder="Item name" />
            </div>
            <div className="form-group">
              <label>Price ₹</label>
              <input
                type="number"
                className="form-control"
                name="price"
                min={1}
                step="0.01"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Qty</label>
              <input
                type="number"
                className="form-control"
                name="quantity"
                min={1}
                defaultValue={1}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Add
            </button>
          </form>
        </div>

        {/* Bill */}
        <div className="pos-panel">
          <h2>Current Bill</h2>
          <div
            className="form-row"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-group">
              <label>Customer Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Walk-in Customer"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone (for sharing)</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Optional"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="bill-items">
            {bill.length === 0 ? (
              <div className="bill-empty">No items yet — tap a menu item to start.</div>
            ) : (
              bill.map((it) => (
                <div key={it.key} className="bill-line">
                  <div>
                    <div className="name">{it.name}</div>
                    <div className="unit">{money(it.price)} each</div>
                  </div>
                  <div className="bill-qty">
                    <button type="button" onClick={() => changeQty(it.key, -1)}>
                      −
                    </button>
                    <span>{it.quantity}</span>
                    <button type="button" onClick={() => changeQty(it.key, 1)}>
                      +
                    </button>
                  </div>
                  <div>
                    <div className="line-total">{money(it.price * it.quantity)}</div>
                    <button className="bill-remove" onClick={() => removeLine(it.key)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            className="form-row"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-group">
              <label>Discount ₹</label>
              <input
                type="number"
                className="form-control"
                min={0}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select
                className="form-control"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>

          <div className="bill-totals">
            <div className="row">
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div className="row">
              <span>Discount</span>
              <span>-{money(totals.discount)}</span>
            </div>
            {totals.tax > 0 && (
              <div className="row">
                <span>GST</span>
                <span>{money(totals.tax)}</span>
              </div>
            )}
            <div className="row grand">
              <span>Total</span>
              <span>{money(totals.total)}</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 16 }}
            disabled={bill.length === 0 || generating}
            onClick={generateReceipt}
          >
            {generating ? "Generating…" : "Generate Receipt"}
          </button>
        </div>
      </div>

      {/* Recent bills */}
      <div className="pos-layout" style={{ paddingTop: 0 }}>
        <div className="pos-panel" style={{ gridColumn: "1 / -1" }}>
          <h2>Recent Bills</h2>
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentError && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", padding: 24, color: "var(--color-error)" }}
                    >
                      {recentError}
                    </td>
                  </tr>
                )}
                {!recentError && recent && recent.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: 24,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      No bills yet
                    </td>
                  </tr>
                )}
                {recent?.slice(0, 20).map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.billNumber}</strong>
                    </td>
                    <td>{b.customerName}</td>
                    <td>{b.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td>{money(b.total)}</td>
                    <td>{(b.paymentMethod || "").toUpperCase()}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(b.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                          try {
                            setLastBill(await API.getBill(b.id));
                            setReceiptOpen(true);
                          } catch (err) {
                            showToast((err as Error).message, "error");
                          }
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        title="Receipt"
        className="receipt-modal"
      >
        <div ref={receiptRef} className="receipt-preview"></div>
        <div className="share-actions">
          <button className="btn btn-whatsapp" onClick={shareWhatsApp} disabled={whatsappBusy}>
            {whatsappBusy ? "Preparing PDF…" : "Send on WhatsApp"}
          </button>
          <button className="btn btn-secondary" onClick={downloadPdf} disabled={pdfBusy}>
            {pdfBusy ? "Preparing…" : "Download PDF"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => lastBill && printReceipt(lastBill)}
          >
            Print
          </button>
          <button className="btn btn-primary new-bill" onClick={newBill}>
            ＋ New Bill
          </button>
        </div>
      </Modal>

      {/* Page-scoped POS styles (ported verbatim from billing.html) */}
      <style>{`
        .pos-body { background: var(--color-background); min-height: 100vh; }
        .pos-topbar {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 12px 24px; background: var(--color-surface);
          border-bottom: 1px solid var(--color-border); box-shadow: var(--shadow-sm);
        }
        .pos-topbar .brand { display: flex; align-items: center; gap: 12px; }
        .pos-topbar .brand img { height: 44px; width: 44px; object-fit: contain; }
        .pos-topbar .brand h1 { font-size: 18px; font-family: var(--font-body); margin: 0; }
        .pos-topbar .brand span { font-size: 12px; color: var(--color-text-muted); }
        .pos-topbar .actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .pos-topbar .staff-chip { font-size: 13px; color: var(--color-text-muted); }

        .pos-layout {
          display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px;
          max-width: 1400px; margin: 0 auto; padding: 24px;
        }
        @media (max-width: 900px) { .pos-layout { grid-template-columns: 1fr; } }

        .pos-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 20px; min-width: 0; }
        .pos-panel h2 { font-size: 16px; font-family: var(--font-body); margin-bottom: 16px; }

        .pos-search { width: 100%; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 15px; margin-bottom: 16px; }

        .pos-menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; max-height: 460px; overflow-y: auto; }
        .pos-menu-card {
          border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px;
          cursor: pointer; transition: all var(--transition-fast); text-align: left; background: var(--color-surface);
        }
        .pos-menu-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
        .pos-menu-card h4 { font-size: 13px; font-family: var(--font-body); margin: 0 0 4px; line-height: 1.3; }
        .pos-menu-card .cat { font-size: 11px; color: var(--color-text-light); }
        .pos-menu-card .price { font-size: 14px; font-weight: 700; color: var(--color-primary); margin-top: 6px; }

        .custom-item-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-top: 16px; }
        .custom-item-row .form-group { margin: 0; }
        .custom-item-row label { font-size: 12px; }

        .bill-items { margin-bottom: 16px; }
        .bill-empty { text-align: center; color: var(--color-text-muted); padding: 28px 0; font-size: 14px; }
        .bill-line { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--color-border-light); }
        .bill-line .name { font-size: 14px; font-weight: 600; }
        .bill-line .unit { font-size: 12px; color: var(--color-text-muted); }
        .bill-line .line-total { font-weight: 700; min-width: 74px; text-align: right; }
        .bill-qty { display: inline-flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-pill); overflow: hidden; }
        .bill-qty button { width: 28px; height: 28px; border: none; background: var(--color-background); cursor: pointer; font-size: 16px; color: var(--color-primary); }
        .bill-qty span { min-width: 26px; text-align: center; font-size: 14px; font-weight: 600; }
        .bill-remove { background: none; border: none; color: var(--color-error); cursor: pointer; font-size: 12px; margin-left: 4px; }

        .bill-totals { border-top: 2px solid var(--color-border); margin-top: 8px; padding-top: 12px; }
        .bill-totals .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
        .bill-totals .row.grand { font-size: 20px; font-weight: 700; color: var(--color-primary); border-top: 1px dashed var(--color-border); margin-top: 8px; padding-top: 12px; }

        /* Receipt */
        .receipt { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; background: #fff; color: #1a0e08; border-radius: var(--radius-md); padding: 22px; border: 1px dashed #bbb; }
        .receipt-head { text-align: center; margin-bottom: 12px; }
        .receipt-head img { height: 88px; width: 88px; object-fit: contain; margin: 0 auto 4px; }
        .receipt-head h3 { font-family: var(--font-body); font-size: 18px; margin: 6px 0 2px; }
        .receipt-head p { font-size: 11px; color: #555; line-height: 1.4; margin: 0; }
        .receipt-meta { font-size: 12px; margin: 12px 0; border-top: 1px dashed #bbb; border-bottom: 1px dashed #bbb; padding: 8px 0; }
        .receipt-meta div { display: flex; justify-content: space-between; padding: 2px 0; }
        .receipt-lines { font-size: 12px; margin: 10px 0; }
        .receipt-lines .rl { display: flex; justify-content: space-between; padding: 3px 0; }
        .receipt-lines .rl small { color: #666; }
        .receipt-totals { font-size: 12px; border-top: 1px dashed #bbb; padding-top: 8px; }
        .receipt-totals .rt { display: flex; justify-content: space-between; padding: 2px 0; }
        .receipt-totals .rt.grand { font-size: 16px; font-weight: 700; border-top: 1px solid #333; margin-top: 6px; padding-top: 8px; }
        .receipt-foot { text-align: center; font-size: 11px; color: #555; margin-top: 14px; border-top: 1px dashed #bbb; padding-top: 10px; }
        /* Receipt popup — clean, receipt-shaped, fits without scrolling */
        .receipt-modal { max-width: 400px; max-height: 96vh; }
        .receipt-modal .modal-header { padding: 14px 20px; }
        .receipt-modal .modal-body { padding: 12px 18px 14px; }
        .receipt-preview { display: flex; justify-content: center; }
        .receipt-preview .receipt { width: 100%; max-width: 320px; padding: 14px; border: 1px solid #e6ddd6; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        /* Compact on-screen preview (the PDF/print receipt keeps its larger logo). */
        .receipt-preview .receipt-head { margin-bottom: 4px; }
        /* Global reset sets img{display:block}; centre it to match the PDF. */
        .receipt-preview .receipt-head img { height: 52px; width: 52px; margin: 0 auto 2px; }
        .receipt-preview .receipt-head h3 { font-size: 16px; margin: 3px 0 2px; }
        .receipt-preview .receipt-head p { font-size: 10px; line-height: 1.35; }
        .receipt-preview .receipt-meta { margin: 6px 0; padding: 6px 0; }
        .receipt-preview .receipt-lines { margin: 6px 0; }
        .receipt-preview .receipt-foot { margin-top: 6px; padding-top: 6px; }

        .share-actions { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; margin-top: 12px; }
        .share-actions .btn { width: 100%; min-width: 0; padding: 9px 12px; font-size: 14px; }
        .share-actions .new-bill { grid-column: 1 / -1; }
        .btn-whatsapp { background: #25D366; color: #fff; border: 1px solid #25D366; }
        .btn-whatsapp:hover:not(:disabled) { background: #1ebe5a; border-color: #1ebe5a; }
        @media (max-width: 480px) { .share-actions { grid-template-columns: 1fr; } .custom-item-row { grid-template-columns: 1fr 1fr; } }

        /* Receipts print via a dedicated hidden iframe (see printReceipt()), so the
           on-screen app never goes to the printer. This guards accidental Ctrl+P. */
        @media print { body { display: none !important; } }
      `}</style>
    </>
  );
}
