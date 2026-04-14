/**
 * RoadSense — Global Application JavaScript
 * Handles: Sidebar, Auth state, API, Utilities, Toast
 */

// ── CONFIG ──────────────────────────────────────────────────
const API_BASE = 'https://roadsense-api-s1cj.onrender.com'; // Update to your deployed backend

// ── STATE ───────────────────────────────────────────────────
const App = {
  user: null,
  token: null,

  init() {
    this.loadUser();
    this.initSidebar();
    this.updateNavUser();
    this.setActiveNav();
  },

  loadUser() {
    const saved = localStorage.getItem('rs_user');
    if (saved) {
      this.user = JSON.parse(saved);
      this.token = localStorage.getItem('rs_token');
    }
  },

  saveUser(user, token) {
    this.user = user;
    this.token = token;
    localStorage.setItem('rs_user', JSON.stringify(user));
    localStorage.setItem('rs_token', token);
  },

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('rs_user');
    localStorage.removeItem('rs_token');
    window.location.href = 'profile.html';
  },

  isLoggedIn() { return !!this.user; },

  // ── SIDEBAR ───────────────────────────────────────────────
  initSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const toggle   = document.getElementById('sidebarToggle');
    const hamburger = document.getElementById('hamburger');
    const overlay  = document.getElementById('sidebarOverlay');
    if (!sidebar) return;

    const collapsed = localStorage.getItem('rs_sidebar') === 'collapsed';
    if (collapsed) sidebar.classList.add('collapsed');

    toggle?.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('rs_sidebar', sidebar.classList.contains('collapsed') ? 'collapsed' : '');
    });

    hamburger?.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });

    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
    });
  },

  updateNavUser() {
    const el = document.getElementById('navUserName');
    const roleEl = document.getElementById('navUserRole');
    const avatarEl = document.getElementById('navUserAvatar');
    if (!el) return;

    if (this.user) {
      el.textContent = this.user.name || 'User';
      if (roleEl) roleEl.textContent = this.user.category || 'Driver';
      if (avatarEl) avatarEl.textContent = (this.user.name || 'U')[0].toUpperCase();
    } else {
      el.textContent = 'Guest';
      if (roleEl) roleEl.textContent = 'Not logged in';
    }
  },

  setActiveNav() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href') || '';
      if (href.includes(page) || (page === 'index.html' && href.includes('index'))) {
        item.classList.add('active');
      }
    });
  }
};

// ── API HELPERS ─────────────────────────────────────────────
const api = {
  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Authorization': `Bearer ${App.token || ''}` }
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },

  async post(path, data) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${App.token || ''}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `API ${res.status}`);
    }
    return res.json();
  }
};

// ── TOAST NOTIFICATIONS ──────────────────────────────────────
const Toast = {
  show(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:#0EE6B7"><polyline points="20 6 9 17 4 12"/></svg>`,
      error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:#FF4757"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      warn:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:#F5A623"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${icons[type] || ''}${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(30px)'; toast.style.transition='0.3s'; setTimeout(()=>toast.remove(),300); }, duration);
  },
  success(m) { this.show(m, 'success'); },
  error(m)   { this.show(m, 'error'); },
  warn(m)    { this.show(m, 'warn'); }
};

// ── SCORE UTILITIES ──────────────────────────────────────────
const ScoreUtils = {
  color(score) {
    if (score >= 80) return '#0EE6B7';
    if (score >= 60) return '#F5A623';
    if (score >= 40) return '#FF8C00';
    return '#FF4757';
  },
  label(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  },
  // Render SVG ring
  ring(score, size = 64) {
    const r = (size / 2) - 5;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    const color = this.color(score);
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
        <circle class="track" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#162032" stroke-width="5"/>
        <circle class="fill" cx="${size/2}" cy="${size/2}" r="${r}" fill="none"
          stroke="${color}" stroke-width="5" stroke-linecap="round"
          stroke-dasharray="${circ}" stroke-dashoffset="${circ - dash}"/>
      </svg>
      <div class="score-text" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
        font-family:'Rajdhani',sans-serif;font-weight:700;font-size:${size===64?'1rem':'0.85rem'};color:${color}">
        ${Math.round(score)}
      </div>`;
  }
};

// ── FORMAT HELPERS ───────────────────────────────────────────
const Fmt = {
  date(str) {
    if (!str) return '—';
    return new Date(str).toLocaleString('en-KE', { dateStyle:'medium', timeStyle:'short' });
  },
  coords(lat, lng) {
    if (!lat || !lng) return '—';
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  },
  eventType(type) {
    const map = {
      pothole:'🕳 Pothole', rough_road:'⚠ Rough Road',
      speed_bump:'🛑 Speed Bump', impassable:'🚧 Impassable',
      harsh_brake:'🚨 Harsh Brake', harsh_accel:'⚡ Harsh Accel',
      sharp_corner:'↩ Sharp Corner', speeding:'💨 Speeding'
    };
    return map[type] || type;
  }
};

// ── SIDEBAR SVG ICONS ────────────────────────────────────────
// Used inline in HTML via template; exported here for reference
const ICONS = {
  home:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  map:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  driver:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
  profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  about:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  logout:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
};

// ── DEMO / MOCK DATA (used when backend not connected) ───────
const MOCK = {
  drivers: [
    { id:'DRV001', name:'James Mwangi', plate:'KDA 123A', category:'taxi', score:88, harsh_brakes:2, sharp_corners:1, speed_violations:0, potholes_hit:5, lat:-1.286389, lng:36.817223, speed_kmh:34 },
    { id:'DRV002', name:'Aisha Omar',   plate:'KBB 456B', category:'fleet', score:72, harsh_brakes:5, sharp_corners:3, speed_violations:2, potholes_hit:12, lat:-1.292, lng:36.822, speed_kmh:0 },
    { id:'DRV003', name:'Peter Kamau',  plate:'KCC 789C', category:'personal', score:55, harsh_brakes:10, sharp_corners:7, speed_violations:4, potholes_hit:20, lat:-1.310, lng:36.800, speed_kmh:60 },
    { id:'DRV004', name:'Grace Otieno', plate:'KDD 321D', category:'fleet', score:95, harsh_brakes:0, sharp_corners:0, speed_violations:0, potholes_hit:2, lat:-1.278, lng:36.830, speed_kmh:48 },
  ],
  roadEvents: [
    { type:'pothole', severity:'critical', magnitude:1.8, lat:-1.286, lng:36.817, timestamp:'2026-04-07 07:10:00' },
    { type:'pothole', severity:'high',     magnitude:1.1, lat:-1.292, lng:36.822, timestamp:'2026-04-07 07:05:00' },
    { type:'rough_road', severity:'medium', magnitude:0.6, lat:-1.300, lng:36.810, timestamp:'2026-04-07 06:55:00' },
    { type:'impassable', severity:'critical', magnitude:12, lat:-1.310, lng:36.800, timestamp:'2026-04-07 06:40:00' },
    { type:'speed_bump', severity:'medium', magnitude:0.7, lat:-1.278, lng:36.830, timestamp:'2026-04-07 06:30:00' },
  ]
};

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
