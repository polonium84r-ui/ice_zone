"use client";

/**
 * Admin console — port of admin.html + admin.js: dashboard stats & weekly
 * chart, menu management (inline edit, availability toggle, add/delete),
 * user management (add/edit/enable/disable, role filter), active coupons,
 * and the audit log. Admin only — everyone else is bounced to /admin.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { CATEGORIES } from "@/lib/client/data";
import { formatCurrency, showToast } from "@/lib/client/app";
import * as API from "@/lib/client/api";
import type {
  AdminStats,
  AuditEntry,
  Coupon,
  MenuItem,
  SessionUser,
} from "@/lib/client/api";

type Section = "dashboard" | "menu" | "users" | "audit" | "coupons";

const NAV: { section: Section; label: string }[] = [
  { section: "dashboard", label: "📊 Dashboard" },
  { section: "menu", label: "🍽️ Menu Management" },
  { section: "users", label: "👥 User Management" },
];

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<SessionUser | null>(null);
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuEdits, setMenuEdits] = useState<
    Record<number, { name: string; price: string; available: boolean }>
  >({});
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [usersError, setUsersError] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditError, setAuditError] = useState("");
  const [auditFilter, setAuditFilter] = useState("");

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<SessionUser | null>(null);

  const loadMenu = useCallback(async () => {
    const items = await API.getAllMenuItems();
    setMenuItems(items);
    setMenuEdits(
      Object.fromEntries(
        items.map((i) => [
          i.id,
          { name: i.name, price: String(i.price), available: i.available !== false },
        ])
      )
    );
  }, []);

  const loadUsers = useCallback(
    async (roleFilter: string) => {
      try {
        setUsers(await API.getUsers(roleFilter || undefined));
        setUsersError("");
      } catch (err) {
        setUsersError((err as Error).message);
      }
    },
    []
  );

  const loadAudit = useCallback(async (actionFilter: string) => {
    try {
      setAudit(await API.getAuditLogs({ limit: 250, action: actionFilter || undefined }));
      setAuditError("");
    } catch (err) {
      setAuditError((err as Error).message);
    }
  }, []);

  // Init — require an admin session, then load everything.
  useEffect(() => {
    (async () => {
      const session = await API.getSession();
      if (!session || session.user.role !== "admin") {
        router.replace("/admin");
        return;
      }
      setMe(session.user);
      try {
        await loadMenu();
        setStats(await API.getAdminStats());
        setCoupons(await API.getCoupons());
        await loadUsers("");
        await loadAudit("");
      } catch (err) {
        showToast((err as Error).message, "error");
      }
    })();
  }, [router, loadMenu, loadUsers, loadAudit]);

  async function handleLogout() {
    await API.logout();
    router.push("/admin");
  }

  async function saveMenuItem(id: number) {
    const edit = menuEdits[id];
    if (!edit) return;
    const name = edit.name.trim();
    const price = parseFloat(edit.price);
    if (!name || isNaN(price) || price <= 0) {
      showToast("Please enter valid name and price", "error");
      return;
    }
    try {
      await API.updateMenuItem(id, { name, price, available: edit.available });
      await loadMenu();
      showToast("Menu item updated", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function deleteMenuItem(id: number) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await API.deleteMenuItem(id);
      await loadMenu();
      showToast("Item deleted", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function handleAddItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const item = {
      name: String(fd.get("name") || ""),
      category: String(fd.get("category") || ""),
      description: String(fd.get("description") || ""),
      price: parseFloat(String(fd.get("price"))),
      image: String(fd.get("image") || ""),
      isVeg: fd.get("isVeg") === "true",
      tags: String(fd.get("tags") || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (!item.name || !item.category || !item.price || !item.image) {
      showToast("Please fill all required fields", "error");
      return;
    }
    try {
      await API.addMenuItem(item);
      await loadMenu();
      form.reset();
      setAddItemOpen(false);
      showToast("New item added successfully", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function setUserActive(u: SessionUser, active: boolean) {
    if (!active && !confirm(`Disable ${u.name}? They will no longer be able to log in.`))
      return;
    try {
      if (active) await API.updateUser(u.id, { active: true });
      else await API.disableUser(u.id);
      showToast(active ? "User enabled" : "User disabled", "success");
      await loadUsers(userRoleFilter);
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function handleAddUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const user = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      role: String(fd.get("role") || "staff"),
      password: String(fd.get("password") || ""),
    };
    if (!user.name || !user.email || user.password.length < 6) {
      showToast("Please fill all fields (password min 6 chars)", "error");
      return;
    }
    try {
      await API.createUser(user);
      form.reset();
      setAddUserOpen(false);
      showToast(
        `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} account created`,
        "success"
      );
      await loadUsers(userRoleFilter);
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function handleEditUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editUser) return;
    const fd = new FormData(e.currentTarget);
    const updates: Record<string, unknown> = {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      role: String(fd.get("role") || editUser.role),
    };
    const pw = String(fd.get("password") || "");
    if (pw) updates.password = pw;
    try {
      await API.updateUser(editUser.id, updates);
      setEditUser(null);
      showToast("User updated", "success");
      await loadUsers(userRoleFilter);
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  const maxWeekly = stats ? Math.max(...stats.weeklyBills.map((d) => d.count), 1) : 1;

  const formatDetails = (d: unknown) => {
    if (typeof d === "string") return d;
    return Object.entries(d as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  };

  function selectSection(s: Section) {
    setSection(s);
    setSidebarOpen(false);
  }

  return (
    <>
      <button
        className="admin-menu-toggle"
        aria-label="Toggle menu"
        onClick={() => setSidebarOpen((o) => !o)}
      >
        ☰
      </button>
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/thirst-logo.png" alt="" className="admin-logo-img" />
            Thirst.
          </div>
          <nav className="admin-nav">
            {NAV.map((n) => (
              <a
                key={n.section}
                href="#"
                className={section === n.section ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  selectSection(n.section);
                }}
              >
                {n.label}
              </a>
            ))}
            <Link href="/billing">🧾 Billing (POS)</Link>
            <a
              href="#"
              className={section === "audit" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                selectSection("audit");
              }}
            >
              📜 Audit Log
            </a>
            <a
              href="#"
              className={section === "coupons" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                selectSection("coupons");
              }}
            >
              🏷️ Coupons
            </a>
            <button className="admin-logout" onClick={handleLogout}>
              🚪 Logout
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {/* Dashboard */}
          <section className={`admin-section ${section === "dashboard" ? "active" : ""}`}>
            <div className="admin-header">
              <h1>Dashboard</h1>
              <span style={{ color: "var(--color-text-muted)" }}>
                {me ? `Welcome, ${me.name}` : ""}
              </span>
            </div>
            <div className="stat-cards">
              <div className="stat-card">
                <div className="label">Today&apos;s Bills</div>
                <div className="value">{stats?.todayBills ?? 0}</div>
              </div>
              <div className="stat-card">
                <div className="label">Today&apos;s Revenue</div>
                <div className="value">{formatCurrency(stats?.todayRevenue ?? 0)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Avg Rating</div>
                <div className="value">{stats?.avgRating ?? 0}★</div>
              </div>
              <div className="stat-card">
                <div className="label">Active Coupons</div>
                <div className="value">{stats?.activeCoupons ?? 0}</div>
              </div>
            </div>
            <div className="chart-container">
              <h3 style={{ marginBottom: 20, fontSize: 18 }}>Weekly Orders</h3>
              <div className="chart-bars">
                {stats?.weeklyBills.map((d) => (
                  <div key={d.day} className="chart-bar-group">
                    <div
                      className="chart-bar"
                      style={{ height: (d.count / maxWeekly) * 160 }}
                      title={`${d.count} bills`}
                    ></div>
                    <span className="label">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Menu Management */}
          <section className={`admin-section ${section === "menu" ? "active" : ""}`}>
            <div className="admin-header">
              <h1>Menu Management</h1>
              <button className="btn btn-primary btn-sm" onClick={() => setAddItemOpen(true)}>
                + Add New Item
              </button>
            </div>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price (₹)</th>
                    <th>Rating</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item) => {
                    const edit = menuEdits[item.id] ?? {
                      name: item.name,
                      price: String(item.price),
                      available: item.available !== false,
                    };
                    return (
                      <tr key={item.id}>
                        <td>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 8,
                              objectFit: "cover",
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={edit.name}
                            style={{ padding: "6px 10px", fontSize: 13 }}
                            onChange={(e) =>
                              setMenuEdits((m) => ({
                                ...m,
                                [item.id]: { ...edit, name: e.target.value },
                              }))
                            }
                          />
                        </td>
                        <td>{item.category}</td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={edit.price}
                            style={{ padding: "6px 10px", fontSize: 13, width: 90 }}
                            onChange={(e) =>
                              setMenuEdits((m) => ({
                                ...m,
                                [item.id]: { ...edit, price: e.target.value },
                              }))
                            }
                          />
                        </td>
                        <td>★ {item.rating}</td>
                        <td>
                          <div
                            className={`availability-toggle ${edit.available ? "on" : ""}`}
                            title="Toggle availability"
                            onClick={() =>
                              setMenuEdits((m) => ({
                                ...m,
                                [item.id]: { ...edit, available: !edit.available },
                              }))
                            }
                          ></div>
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => saveMenuItem(item.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => deleteMenuItem(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Coupons */}
          <section className={`admin-section ${section === "coupons" ? "active" : ""}`}>
            <div className="admin-header">
              <h1>Active Coupons</h1>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
                gap: 16,
              }}
            >
              {coupons.length === 0 && (
                <p
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "var(--color-text-muted)",
                  }}
                >
                  No active coupons
                </p>
              )}
              {coupons.map((c) => (
                <div
                  key={c.code}
                  style={{
                    background: "var(--color-surface)",
                    padding: 24,
                    borderRadius: 12,
                    boxShadow: "var(--shadow-sm)",
                    borderLeft: "4px solid var(--color-accent)",
                  }}
                >
                  <h3 style={{ fontSize: 18, color: "var(--color-primary)", marginBottom: 8 }}>
                    {c.code}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    {c.description}
                  </p>
                  <p style={{ fontSize: 13 }}>
                    {c.type === "percentage" ? `${c.value}% off` : `₹${c.value} off`}
                    {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
                    {c.minOrder ? ` · Min ₹${c.minOrder}` : ""}
                    {c.category ? ` · ${c.category} only` : ""}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 8,
                      padding: "4px 12px",
                      background: "rgba(46,125,50,0.1)",
                      color: "var(--color-success)",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Active
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* User Management */}
          <section className={`admin-section ${section === "users" ? "active" : ""}`}>
            <div className="admin-header">
              <h1>User Management</h1>
              <button className="btn btn-primary btn-sm" onClick={() => setAddUserOpen(true)}>
                + Add Staff / User
              </button>
            </div>
            <div className="user-role-filter">
              {[
                { role: "", label: "All" },
                { role: "admin", label: "Admins" },
                { role: "staff", label: "Staff" },
              ].map((f) => (
                <button
                  key={f.role}
                  className={`category-chip ${userRoleFilter === f.role ? "active" : ""}`}
                  onClick={async () => {
                    setUserRoleFilter(f.role);
                    await loadUsers(f.role);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersError && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ textAlign: "center", padding: 32, color: "var(--color-error)" }}
                      >
                        {usersError}
                      </td>
                    </tr>
                  )}
                  {!usersError && users.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: 32,
                          color: "var(--color-text-muted)",
                        }}
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name}</strong>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || "—"}</td>
                      <td>
                        <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      </td>
                      <td>
                        {u.active ? (
                          <span className="status-pill status-active">Active</span>
                        ) : (
                          <span className="status-pill status-inactive">Disabled</span>
                        )}
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditUser(u)}
                          >
                            Edit
                          </button>
                          {u.id !== me?.id &&
                            (u.active ? (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setUserActive(u, false)}
                              >
                                Disable
                              </button>
                            ) : (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setUserActive(u, true)}
                              >
                                Enable
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Audit Log */}
          <section className={`admin-section ${section === "audit" ? "active" : ""}`}>
            <div className="admin-header">
              <h1>Audit Log</h1>
              <select
                className="sort-select"
                aria-label="Filter audit log"
                value={auditFilter}
                onChange={async (e) => {
                  setAuditFilter(e.target.value);
                  await loadAudit(e.target.value);
                }}
              >
                <option value="">All actions</option>
                <option value="auth">Authentication</option>
                <option value="user">User management</option>
                <option value="menu">Menu changes</option>
                <option value="bill">Billing</option>
                <option value="coupon">Coupons</option>
              </select>
            </div>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditError && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ textAlign: "center", padding: 32, color: "var(--color-error)" }}
                      >
                        {auditError}
                      </td>
                    </tr>
                  )}
                  {!auditError && audit.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          padding: 32,
                          color: "var(--color-text-muted)",
                        }}
                      >
                        No activity yet
                      </td>
                    </tr>
                  )}
                  {audit.map((l) => (
                    <tr key={l.id}>
                      <td>{l.userName || "—"}</td>
                      <td>
                        <span className={`role-badge role-${l.userRole || ""}`}>
                          {l.userRole || "—"}
                        </span>
                      </td>
                      <td>
                        <code className="audit-action">{l.action}</code>
                      </td>
                      <td>
                        {l.entityType
                          ? `${l.entityType} ${l.entityId ? "#" + l.entityId : ""}`
                          : "—"}
                      </td>
                      <td style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                        {l.details ? formatDetails(l.details) : "—"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(l.createdAt).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Add User Modal */}
      <Modal open={addUserOpen} onClose={() => setAddUserOpen(false)} title="Add Staff / User">
        <form onSubmit={handleAddUser}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" className="form-control" required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" className="form-control" required />
            <span className="form-error"></span>
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" className="form-control" />
            <span className="form-error"></span>
          </div>
          <div
            className="form-row"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-group">
              <label>Role</label>
              <select name="role" className="form-control" required defaultValue="staff">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Temporary Password</label>
              <input
                type="text"
                name="password"
                className="form-control"
                required
                minLength={6}
                placeholder="Min 6 characters"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Create User
          </button>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <form onSubmit={handleEditUser} key={editUser.id}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                required
                defaultValue={editUser.name}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                defaultValue={editUser.phone || ""}
              />
            </div>
            <div
              className="form-row"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
            >
              <div className="form-group">
                <label>Role</label>
                <select name="role" className="form-control" defaultValue={editUser.role}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  New Password{" "}
                  <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  name="password"
                  className="form-control"
                  placeholder="Leave blank to keep"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Save Changes
            </button>
          </form>
        )}
      </Modal>

      {/* Add Item Modal */}
      <Modal open={addItemOpen} onClose={() => setAddItemOpen(false)} title="Add New Menu Item">
        <form onSubmit={handleAddItem}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" className="form-control" required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" className="form-control" required defaultValue="">
              <option value="">Select category</option>
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-control" rows={3} required></textarea>
          </div>
          <div
            className="form-row"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" name="price" className="form-control" required min={1} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select name="isVeg" className="form-control" defaultValue="true">
                <option value="true">Vegetarian</option>
                <option value="false">Non-Vegetarian</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Image URL</label>
            <input
              type="url"
              name="image"
              className="form-control"
              required
              placeholder="https://… (link to the item photo)"
            />
          </div>
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              className="form-control"
              placeholder="popular, spicy, bestseller"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Add Item
          </button>
        </form>
      </Modal>
    </>
  );
}
