/**
 * RoadSense Technologies — Global App JS v4.0
 * Auth state, API helpers, scroll animations, utilities
 */

// ── CONFIG ──────────────────────────────────────────────────────
const API_BASE = 'https://roadsense-api-s1cj.onrender.com';

// ── AUTH STATE ──────────────────────────────────────────────────
const Auth = {
  user: null,
  token: null,

  load() {
    try {
      const u = localStorage.getItem('rs_user');
      const t = localStorage.getItem('rs_token');
      if (u && t) { this.user = JSON.parse(u); this.token = t; }
    } catch(e) {}
  },

  save(user, token) {
    this.user  = user;
    this.token = token;
    localStorage.setItem('rs_user',  JSON.stringify(user));
    localStorage.setItem('rs_token', token);
  },

  logout() {
    this.user = null; this.token = null;
    localStorage.removeItem('rs_user');
    localStorage.removeItem('rs_token');
    window.location.href = 'profile.html';
  },

  loggedIn()   { return !!this.user && !!this.token; },
  isFleet()    { return this.user?.category === 'fleet'; },
  isTaxi()     { return this.user?.category === 'taxi'; },
  isPersonal() { return this.user?.category === 'personal'; },
  canSeeFleet(){ return this.isFleet() || this.isTaxi(); },
};

// ── API HELPERS ─────────────────────────────────────────────────
const api = {
  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (Auth.token) h['Authorization'] = `Bearer ${Auth.token}`;
    return h;
  },
  async get(path) {
    const r = await fetch(`${API_BASE}${path}`, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  async post(path, data) {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(data)
    });
    if (!r.ok) {
      const e = await r.json().catch(()=>({}));
      throw new Error(e.detail || `HTTP ${r.status}`);
    }
    return r.json();
  }
};

// ── TOAST NOTIFICATIONS ─────────────────────────────────────────
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(msg, type='success', ms=3500) {
    this.init();
    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" stroke-width="2.5" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>`,
      error:   `<svg viewBox="0 0 24 24" fill="none" stroke="#C0392B" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      warn:    `<svg viewBox="0 0 24 24" fill="none" stroke="#B7660A" stroke-width="2.5" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `${icons[type]||''}${msg}`;
    this.container.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transition='0.3s'; setTimeout(()=>t.remove(),300); }, ms);
  },
  success(m){ this.show(m,'success'); },
  error(m)  { this.show(m,'error'); },
  warn(m)   { this.show(m,'warn'); }
};

// ── SCROLL REVEAL ANIMATIONS ────────────────────────────────────
const ScrollReveal = {
  init() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach(el => obs.observe(el));
  }
};

// ── SCORE UTILITIES ─────────────────────────────────────────────
const Score = {
  color(s) {
    if (s >= 85) return '#1B6B3A';
    if (s >= 70) return '#B7660A';
    if (s >= 50) return '#BF360C';
    return '#C0392B';
  },
  label(s) {
    if (s >= 90) return 'Excellent';
    if (s >= 75) return 'Good';
    if (s >= 60) return 'Fair';
    if (s >= 40) return 'Poor';
    return 'Critical';
  },
  ring(score, size=64) {
    const r=(size/2)-5;
    const circ=2*Math.PI*r;
    const dash=(score/100)*circ;
    const c=this.color(score);
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#F1F3F5" stroke-width="5"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${c}" stroke-width="5"
          stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ-dash}"/>
      </svg>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;
        align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:700">
        <span style="font-size:${size===64?'1rem':'1.4rem'};color:${c}">${Math.round(score)}</span>
        ${size>64?`<span style="font-size:0.7rem;color:#868E96">${this.label(score)}</span>`:''}
      </div>`;
  }
};

// ── FORMAT HELPERS ──────────────────────────────────────────────
const Fmt = {
  date(s) {
    if (!s) return '—';
    return new Date(s).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'});
  },
  coords(lat,lng) {
    if (!lat||!lng) return 'No GPS fix';
    return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
  },
  eventType(t) {
    const m={
      pothole:'Pothole', minor_bump:'Minor Bump', speed_bump:'Speed Bump',
      rough_road:'Rough Road', impassable:'Impassable Road',
      harsh_brake:'Harsh Braking', harsh_accel:'Harsh Acceleration',
      sharp_corner:'Sharp Corner', speeding:'Speeding'
    };
    return m[t]||t;
  },
  severity(s) {
    const cls={low:'badge-low',medium:'badge-medium',high:'badge-high',critical:'badge-critical'};
    return `<span class="badge ${cls[s]||'badge-info'}">${s}</span>`;
  }
};

// ── SIDEBAR ─────────────────────────────────────────────────────
function initSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const toggle    = document.getElementById('sidebarToggle');
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('sidebarOverlay');
  if (!sidebar) return;

  hamburger?.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
  });

  // Set active nav item
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.includes(page) || (page === 'index.html' && href.includes('index'))) {
      a.classList.add('active');
    }
  });

  // Update user name/avatar in sidebar
  updateSidebarUser();
  updateTopbarProfile();
}

function updateSidebarUser() {
  const nameEl   = document.getElementById('navUserName');
  const roleEl   = document.getElementById('navUserRole');
  const avatarEl = document.getElementById('navUserAvatar');
  if (!nameEl) return;
  if (Auth.loggedIn()) {
    nameEl.textContent   = Auth.user.name || 'User';
    if (roleEl) roleEl.textContent = Auth.user.category || '';
    if (avatarEl) avatarEl.textContent = (Auth.user.name||'U')[0].toUpperCase();
  } else {
    nameEl.textContent = 'Guest';
    if (roleEl) roleEl.textContent = 'Not logged in';
  }
}

function updateTopbarProfile() {
  const btn = document.getElementById('topbarProfileBtn');
  if (!btn) return;
  if (Auth.loggedIn()) {
    btn.textContent = (Auth.user.name||'U')[0].toUpperCase();
    btn.title = Auth.user.name;
    btn.style.display = 'flex';
  } else {
    btn.style.display = 'none';
  }
}

// ── MOCK DATA (fallback when backend not connected) ─────────────
const MOCK = {
  drivers: [
    {id:'DRV001',name:'James Mwangi',plate:'KDA 123A',category:'taxi',
     score:88,harsh_brakes:2,sharp_corners:1,speed_violations:0,potholes_hit:5,
     lat:-1.286389,lng:36.817223,speed_kmh:34},
    {id:'DRV002',name:'Aisha Omar',plate:'KBB 456B',category:'fleet',
     score:72,harsh_brakes:5,sharp_corners:3,speed_violations:2,potholes_hit:12,
     lat:-1.292,lng:36.822,speed_kmh:0},
    {id:'DRV003',name:'Peter Kamau',plate:'KCC 789C',category:'fleet',
     score:55,harsh_brakes:10,sharp_corners:7,speed_violations:4,potholes_hit:20,
     lat:-1.310,lng:36.800,speed_kmh:60},
    {id:'DRV004',name:'Grace Otieno',plate:'KDD 321D',category:'personal',
     score:95,harsh_brakes:0,sharp_corners:0,speed_violations:0,potholes_hit:2,
     lat:-1.278,lng:36.830,speed_kmh:48},
  ],
  roadEvents: [
    {type:'pothole',severity:'critical',subtype:'severe_pothole',magnitude:1.8,lat:-1.286,lng:36.817},
    {type:'pothole',severity:'high',subtype:'pothole',magnitude:1.1,lat:-1.292,lng:36.822},
    {type:'rough_road',severity:'medium',subtype:'rough_road',magnitude:0.6,lat:-1.300,lng:36.810},
    {type:'impassable',severity:'critical',magnitude:12,lat:-1.310,lng:36.800},
    {type:'speed_bump',severity:'low',magnitude:0.55,lat:-1.278,lng:36.830},
    {type:'pothole',severity:'high',magnitude:0.95,lat:-1.295,lng:36.825},
    {type:'rough_road',severity:'medium',magnitude:0.5,lat:-1.305,lng:36.815},
  ]
};

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Auth.load();
  initSidebar();
  ScrollReveal.init();
});
