/**
 * admin.js — Admin dashboard functionality
 */

const Admin = (() => {
  let menuItems = [];
  let users = [];
  let userRoleFilter = '';

  async function init() {
    if (!Auth.requireAdmin()) return;

    menuItems = await API.getAllMenuItems();

    initNavigation();
    await renderDashboard();
    renderMenuTable();
    await renderCoupons();
    await renderUsers();
    await renderAudit();
    bindEvents();
    bindUserEvents();
    bindAuditEvents();
  }

  function initNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav a[data-section]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        showSection(section);
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });

    const logoutBtn = document.querySelector('.admin-nav .admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await Auth.logout();
        window.location.href = '/admin';
      });
    }
  }

  function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById('section-' + sectionId);
    if (section) section.classList.add('active');
  }

  async function renderDashboard() {
    const stats = await API.getAdminStats();

    document.getElementById('stat-orders').textContent = stats.todayBills;
    document.getElementById('stat-revenue').textContent = App.formatCurrency(stats.todayRevenue);
    document.getElementById('stat-rating').textContent = stats.avgRating + '★';
    document.getElementById('stat-coupons').textContent = stats.activeCoupons;

    const chartBars = document.getElementById('chart-bars');
    if (chartBars) {
      const maxCount = Math.max(...stats.weeklyBills.map(d => d.count), 1);
      chartBars.innerHTML = stats.weeklyBills.map(d => `
        <div class="chart-bar-group">
          <div class="chart-bar" style="height: ${(d.count / maxCount) * 160}px" title="${d.count} bills"></div>
          <span class="label">${d.day}</span>
        </div>
      `).join('');
    }
  }

  function renderMenuTable() {
    const tbody = document.getElementById('menu-table-body');
    if (!tbody) return;

    tbody.innerHTML = menuItems.map(item => `
      <tr data-id="${item.id}">
        <td><img src="${item.image}" alt="${item.name}" style="width:48px;height:48px;border-radius:8px;object-fit:cover"></td>
        <td>
          <input type="text" class="form-control edit-name" value="${item.name}" style="padding:6px 10px;font-size:13px">
        </td>
        <td>${item.category}</td>
        <td>
          <input type="number" class="form-control edit-price" value="${item.price}" style="padding:6px 10px;font-size:13px;width:90px">
        </td>
        <td>★ ${item.rating}</td>
        <td>
          <div class="availability-toggle ${item.available !== false ? 'on' : ''}" data-id="${item.id}" title="Toggle availability"></div>
        </td>
        <td>
          <div class="actions">
            <button class="btn btn-primary btn-sm save-item-btn" data-id="${item.id}">Save</button>
            <button class="btn btn-secondary btn-sm delete-item-btn" data-id="${item.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.availability-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => toggle.classList.toggle('on'));
    });

    tbody.querySelectorAll('.save-item-btn').forEach(btn => {
      btn.addEventListener('click', () => saveMenuItem(parseInt(btn.dataset.id)));
    });

    tbody.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteMenuItem(parseInt(btn.dataset.id)));
    });
  }

  async function saveMenuItem(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;

    const name = row.querySelector('.edit-name').value.trim();
    const price = parseFloat(row.querySelector('.edit-price').value);
    const available = row.querySelector('.availability-toggle').classList.contains('on');

    if (!name || isNaN(price) || price <= 0) {
      App.showToast('Please enter valid name and price', 'error');
      return;
    }

    try {
      await API.updateMenuItem(id, { name, price, available });
      menuItems = await API.getAllMenuItems();
      App.showToast('Menu item updated', 'success');
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }

  async function deleteMenuItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await API.deleteMenuItem(id);
      menuItems = await API.getAllMenuItems();
      renderMenuTable();
      App.showToast('Item deleted', 'success');
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }

  async function renderCoupons() {
    const container = document.getElementById('coupons-list');
    if (!container) return;

    const coupons = await API.getCoupons();
    if (!coupons.length) {
      container.innerHTML = '<p style="text-align:center;padding:32px;color:var(--color-text-muted)">No active coupons</p>';
      return;
    }

    container.innerHTML = coupons.map(c => `
      <div style="background:var(--color-surface);padding:24px;border-radius:12px;box-shadow:var(--shadow-sm);border-left:4px solid var(--color-accent)">
        <h3 style="font-size:18px;color:var(--color-primary);margin-bottom:8px">${c.code}</h3>
        <p style="font-size:14px;color:var(--color-text-muted);margin-bottom:8px">${c.description}</p>
        <p style="font-size:13px">
          ${c.type === 'percentage' ? c.value + '% off' : '₹' + c.value + ' off'}
          ${c.maxDiscount ? ' (max ₹' + c.maxDiscount + ')' : ''}
          ${c.minOrder ? ' · Min ₹' + c.minOrder : ''}
          ${c.category ? ' · ' + c.category + ' only' : ''}
        </p>
        <span style="display:inline-block;margin-top:8px;padding:4px 12px;background:rgba(46,125,50,0.1);color:var(--color-success);border-radius:20px;font-size:12px;font-weight:600">Active</span>
      </div>
    `).join('');
  }

  function bindEvents() {
    const addBtn = document.getElementById('add-item-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => App.openModal('add-item-modal'));
    }

    const addForm = document.getElementById('add-item-form');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addForm);
        const item = {
          name: formData.get('name'),
          category: formData.get('category'),
          description: formData.get('description'),
          price: parseFloat(formData.get('price')),
          image: formData.get('image'),
          isVeg: formData.get('isVeg') === 'true',
          tags: formData.get('tags')?.split(',').map(t => t.trim()).filter(Boolean) || []
        };

        if (!item.name || !item.category || !item.price || !item.image) {
          App.showToast('Please fill all required fields', 'error');
          return;
        }

        try {
          await API.addMenuItem(item);
          menuItems = await API.getAllMenuItems();
          renderMenuTable();
          addForm.reset();
          App.closeModal('add-item-modal');
          App.showToast('New item added successfully', 'success');
        } catch (err) {
          App.showToast(err.message, 'error');
        }
      });
    }
  }

  /* ---------------- User Management ---------------- */
  async function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    try {
      users = await API.getUsers(userRoleFilter || undefined);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--color-error)">${err.message}</td></tr>`;
      return;
    }
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--color-text-muted)">No users found</td></tr>';
      return;
    }
    const me = Auth.getUser();
    tbody.innerHTML = users.map(u => `
      <tr data-id="${u.id}">
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone || '—'}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td>${u.active
          ? '<span class="status-pill status-active">Active</span>'
          : '<span class="status-pill status-inactive">Disabled</span>'}</td>
        <td>${new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
        <td>
          <div class="actions">
            <button class="btn btn-secondary btn-sm edit-user-btn" data-id="${u.id}">Edit</button>
            ${u.id === me.id ? '' : (u.active
              ? `<button class="btn btn-secondary btn-sm disable-user-btn" data-id="${u.id}">Disable</button>`
              : `<button class="btn btn-primary btn-sm enable-user-btn" data-id="${u.id}">Enable</button>`)}
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditUser(btn.dataset.id));
    });
    tbody.querySelectorAll('.disable-user-btn').forEach(btn => {
      btn.addEventListener('click', () => setUserActive(btn.dataset.id, false));
    });
    tbody.querySelectorAll('.enable-user-btn').forEach(btn => {
      btn.addEventListener('click', () => setUserActive(btn.dataset.id, true));
    });
  }

  function openEditUser(id) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    const form = document.getElementById('edit-user-form');
    form.elements['id'].value = u.id;
    form.elements['name'].value = u.name;
    form.elements['phone'].value = u.phone || '';
    form.elements['role'].value = u.role;
    form.elements['password'].value = '';
    App.openModal('edit-user-modal');
  }

  async function setUserActive(id, active) {
    const u = users.find(x => x.id === id);
    if (!active && !confirm(`Disable ${u ? u.name : 'this user'}? They will no longer be able to log in.`)) return;
    try {
      if (active) {
        await API.updateUser(id, { active: true });
      } else {
        await API.disableUser(id);
      }
      App.showToast(active ? 'User enabled' : 'User disabled', 'success');
      await renderUsers();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }

  function bindUserEvents() {
    const addBtn = document.getElementById('add-user-btn');
    if (addBtn) addBtn.addEventListener('click', () => App.openModal('add-user-modal'));

    const addForm = document.getElementById('add-user-form');
    if (addForm) {
      App.setupFieldValidation(addForm);
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(addForm);
        const user = {
          name: fd.get('name').trim(),
          email: fd.get('email').trim(),
          phone: (fd.get('phone') || '').trim(),
          role: fd.get('role'),
          password: fd.get('password')
        };
        if (!user.name || !user.email || user.password.length < 6) {
          App.showToast('Please fill all fields (password min 6 chars)', 'error');
          return;
        }
        try {
          await API.createUser(user);
          addForm.reset();
          App.closeModal('add-user-modal');
          App.showToast(`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} account created`, 'success');
          await renderUsers();
        } catch (err) {
          App.showToast(err.message, 'error');
        }
      });
    }

    const editForm = document.getElementById('edit-user-form');
    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(editForm);
        const id = fd.get('id');
        const updates = { name: fd.get('name').trim(), phone: (fd.get('phone') || '').trim(), role: fd.get('role') };
        const pw = fd.get('password');
        if (pw) updates.password = pw;
        try {
          await API.updateUser(id, updates);
          App.closeModal('edit-user-modal');
          App.showToast('User updated', 'success');
          await renderUsers();
        } catch (err) {
          App.showToast(err.message, 'error');
        }
      });
    }

    const filter = document.getElementById('user-role-filter');
    if (filter) {
      filter.querySelectorAll('[data-role]').forEach(chip => {
        chip.addEventListener('click', async () => {
          filter.querySelectorAll('[data-role]').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          userRoleFilter = chip.dataset.role;
          await renderUsers();
        });
      });
    }
  }

  /* ---------------- Audit Log ---------------- */
  async function renderAudit(actionFilter = '') {
    const tbody = document.getElementById('audit-table-body');
    if (!tbody) return;
    let logs;
    try {
      logs = await API.getAuditLogs({ limit: 250, action: actionFilter || undefined });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-error)">${err.message}</td></tr>`;
      return;
    }
    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-muted)">No activity yet</td></tr>';
      return;
    }
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${l.userName || '—'}</td>
        <td><span class="role-badge role-${l.userRole}">${l.userRole || '—'}</span></td>
        <td><code class="audit-action">${l.action}</code></td>
        <td>${l.entityType ? `${l.entityType} ${l.entityId ? '#' + l.entityId : ''}` : '—'}</td>
        <td style="color:var(--color-text-muted);font-size:13px">${l.details ? formatDetails(l.details) : '—'}</td>
        <td style="white-space:nowrap">${new Date(l.createdAt).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
  }

  function formatDetails(d) {
    if (typeof d === 'string') return d;
    return Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(', ');
  }

  function bindAuditEvents() {
    const filter = document.getElementById('audit-filter');
    if (filter) filter.addEventListener('change', () => renderAudit(filter.value));
  }

  return { init, renderCoupons, renderUsers, renderAudit };
})();
