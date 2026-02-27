const page = document.body.dataset.page;

function initNav() {
  const current = document.body.dataset.page;
  document.querySelectorAll('.nav-menu a').forEach((a) => {
    if (a.dataset.page === current) a.classList.add('active');
  });
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
  }
}

function escapeHtml(input) {
  return input.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

function initResourcesSearch() {
  const search = document.getElementById('resource-search');
  if (!search) return;
  const cards = [...document.querySelectorAll('.resource-item')];
  search.addEventListener('input', () => {
    const term = search.value.toLowerCase();
    cards.forEach((card) => {
      card.style.display = card.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });
}

async function initNews() {
  const list = document.getElementById('news-list');
  if (!list) return;
  const parser = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://thegatorseye.com/feed/');
  try {
    const res = await fetch(parser);
    if (!res.ok) throw new Error('RSS unavailable');
    const data = await res.json();
    const items = (data.items || []).slice(0, 6);
    if (!items.length) throw new Error('No items');
    list.innerHTML = '';
    items.forEach((item) => {
      const image = item.thumbnail || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000';
      const card = document.createElement('article');
      card.className = 'card news-item';
      card.innerHTML = `
        <img src="${image}" alt="Preview image for ${escapeHtml(item.title)}" loading="lazy" />
        <h3>${escapeHtml(item.title)}</h3>
        <p class="meta">${new Date(item.pubDate).toLocaleDateString()}</p>
        <p>${escapeHtml((item.description || '').replace(/<[^>]*>/g, '').slice(0, 150))}...</p>
        <a class="btn" href="${item.link}" target="_blank" rel="noopener">Read Full Article</a>
      `;
      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = '<p class="warning">Official Green Level news is currently unavailable.</p>';
  }
}

function initGames() {
  const games = [
    { title: 'Math Flash', description: 'Quick arithmetic challenge for speed and accuracy.', url: 'https://www.coolmathgames.com/0-2048' },
    { title: 'Typing Sprint', description: 'Practice keyboard skills with short drills.', url: 'https://www.typing.com/student/game/typing-attack' },
    { title: 'Logic Grid', description: 'A puzzle game that builds reasoning skills.', url: 'https://www.brainzilla.com/logic/logic-grid/' }
  ];
  const wrap = document.getElementById('games-list');
  if (!wrap) return;
  wrap.innerHTML = '';
  games.forEach((g) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<h3>${g.title}</h3><p>${g.description}</p><a class="btn" href="${g.url}" target="_blank" rel="noopener">Play</a>`;
    wrap.appendChild(card);
  });
}

function initDirectory() {
  const tableBody = document.getElementById('staff-body');
  if (!tableBody) return;
  const staff = [];
  if (!staff.length) {
    document.getElementById('directory-status').textContent = 'Staff directory data is being updated.';
  }

  const search = document.getElementById('staff-search');
  const render = () => {
    const term = (search.value || '').toLowerCase();
    const filtered = [...staff].sort((a, b) => a.last.localeCompare(b.last)).filter((s) =>
      [s.name, s.department, s.room, s.email].join(' ').toLowerCase().includes(term)
    );
    tableBody.innerHTML = filtered.map((s) => `
      <tr>
        <td>${s.name}</td><td>${s.department}</td><td>${s.room}</td><td><a href="mailto:${s.email}">${s.email}</a></td>
      </tr>`).join('');
  };
  if (search) search.addEventListener('input', render);
  render();

  const form = document.getElementById('teacher-contact-form');
  if (form) {
    const startedAt = Date.now();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const honeypot = document.getElementById('website-field').value;
      const safety = document.getElementById('contact-response');
      if (honeypot) return;
      if (Date.now() - startedAt < 4000) {
        safety.textContent = 'Please wait a few seconds before sending.';
        safety.className = 'warning';
        return;
      }
      const email = document.getElementById('teacher-email').value.trim();
      if (!/@(wcpss\.net|gmail\.com)$/i.test(email)) {
        safety.textContent = 'Please use an official teacher email address.';
        safety.className = 'warning';
        return;
      }
      const studentName = document.getElementById('student-name').value.trim();
      const studentEmail = document.getElementById('student-email').value.trim();
      const subject = document.getElementById('subject').value.trim();
      const message = document.getElementById('message').value.trim();
      const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${studentName} (${studentEmail})\n\n${message}`)}`;
      window.location.href = mailto;
      safety.textContent = 'Your message was prepared for sending to the official teacher email.';
      safety.className = 'notice';
      form.reset();
    });
  }
}

function initMessaging() {
  const root = document.getElementById('messages-app');
  if (!root) return;

  const defaultUsers = [
    { username: 'admin1', password: 'Admin!123', role: 'admin' },
    { username: 'student1', password: 'Student!123', role: 'student' },
    { username: 'teacher1', password: 'Teacher!123', role: 'teacher' }
  ];

  const users = JSON.parse(localStorage.getItem('portalUsers') || 'null') || defaultUsers;
  let messages = JSON.parse(localStorage.getItem('portalMessages') || '[]');
  const reports = JSON.parse(localStorage.getItem('portalReports') || '[]');
  let session = JSON.parse(localStorage.getItem('portalSession') || 'null');

  const persist = () => {
    localStorage.setItem('portalUsers', JSON.stringify(users));
    localStorage.setItem('portalMessages', JSON.stringify(messages));
    localStorage.setItem('portalSession', JSON.stringify(session));
    localStorage.setItem('portalReports', JSON.stringify(reports));
  };

  const ui = {
    auth: root.querySelector('#auth-card'),
    portal: root.querySelector('#portal-card'),
    loginForm: root.querySelector('#login-form'),
    loginMsg: root.querySelector('#login-msg'),
    roleNote: root.querySelector('#role-note'),
    compose: root.querySelector('#compose-form'),
    recipient: root.querySelector('#recipient'),
    thread: root.querySelector('#thread'),
    adminPanel: root.querySelector('#admin-panel'),
    accountForm: root.querySelector('#account-form'),
    accountStatus: root.querySelector('#account-status'),
    logs: root.querySelector('#message-logs')
  };

  const allowedRecipients = (user) => {
    if (!user) return [];
    if (user.role === 'student') return users.filter((u) => u.role === 'teacher');
    if (user.role === 'teacher') return users.filter((u) => u.role === 'student');
    return users.filter((u) => u.username !== user.username);
  };

  const renderRecipients = () => {
    ui.recipient.innerHTML = '';
    allowedRecipients(session).forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.username;
      opt.textContent = `${u.username} (${u.role})`;
      ui.recipient.appendChild(opt);
    });
  };

  const renderMessages = () => {
    if (!session) return;
    const visible = messages.filter((m) => m.from === session.username || m.to === session.username || session.role === 'admin');
    ui.thread.innerHTML = visible.map((m, i) => `
      <div class="message">
        <div><strong>${m.from}</strong> → <strong>${m.to}</strong></div>
        <div>${escapeHtml(m.text)}</div>
        <div class="small">${new Date(m.timestamp).toLocaleString()}</div>
        <button class="btn secondary" data-report="${i}">Report</button>
      </div>
    `).join('');
    ui.thread.querySelectorAll('[data-report]').forEach((b) => {
      b.addEventListener('click', () => {
        reports.push({ index: Number(b.dataset.report), reportedBy: session.username, at: new Date().toISOString() });
        persist();
        alert('Message reported to admins.');
      });
    });
    ui.logs.textContent = JSON.stringify({ messages, reports }, null, 2);
  };

  const renderState = () => {
    const loggedIn = !!session;
    ui.auth.style.display = loggedIn ? 'none' : 'block';
    ui.portal.style.display = loggedIn ? 'block' : 'none';
    if (!loggedIn) return;
    ui.roleNote.textContent = `Logged in as ${session.username} (${session.role}). Messages may be monitored for safety.`;
    ui.adminPanel.style.display = session.role === 'admin' ? 'block' : 'none';
    renderRecipients();
    renderMessages();
  };

  ui.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(ui.loginForm);
    const found = users.find((u) => u.username === fd.get('username') && u.password === fd.get('password'));
    if (!found) {
      ui.loginMsg.textContent = 'Login failed. Contact an admin for account support.';
      return;
    }
    session = { username: found.username, role: found.role, lastSent: 0 };
    persist();
    renderState();
  });

  root.querySelector('#logout').addEventListener('click', () => {
    session = null;
    persist();
    renderState();
  });

  ui.compose.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!session) return;
    const now = Date.now();
    if (now - (session.lastSent || 0) < 20000) {
      alert('Rate limit active: wait at least 20 seconds between messages.');
      return;
    }
    const text = root.querySelector('#message-text').value.trim();
    if (!text || /[<>]/.test(text)) {
      alert('Only plain text messages are allowed.');
      return;
    }
    const to = ui.recipient.value;
    const target = users.find((u) => u.username === to);
    if (!target) return;
    if ((session.role === 'student' && target.role !== 'teacher') || (session.role === 'teacher' && target.role !== 'student')) {
      alert('This message route is not allowed.');
      return;
    }
    messages.push({ from: session.username, to, text, timestamp: new Date().toISOString() });
    session.lastSent = now;
    persist();
    ui.compose.reset();
    renderMessages();
  });

  ui.accountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!session || session.role !== 'admin') return;
    const fd = new FormData(ui.accountForm);
    const username = fd.get('new_username').toString().trim();
    if (users.some((u) => u.username === username)) {
      ui.accountStatus.textContent = 'Username already exists.';
      return;
    }
    users.push({ username, password: fd.get('new_password').toString(), role: fd.get('new_role').toString() });
    ui.accountStatus.textContent = `Account created for ${username}.`;
    persist();
    ui.accountForm.reset();
    renderRecipients();
  });

  renderState();
}

initNav();
initResourcesSearch();
initNews();
initGames();
initDirectory();
initMessaging();
