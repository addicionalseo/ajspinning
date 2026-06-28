/* ════════════════════════════════════════════════════════════════
   AJSpinning · Foro comunitario
   Supabase v2 + Vanilla JS puro
   ════════════════════════════════════════════════════════════════

   CONFIGURACIÓN — reemplaza estos valores con los de tu proyecto:
   1. Ve a https://supabase.com → tu proyecto → Settings → API
   2. Copia "Project URL" y "anon/public key"
   ════════════════════════════════════════════════════════════════ */

var FORO_URL = 'https://ssmcqqtnbuyuxqsyozdn.supabase.co';
var FORO_KEY = 'sb_publishable_F87ry8e0jaWxLalUJ-w1Qw_BhadB5gO';

/* ── Estado global ───────────────────────────────────────────── */
var sb = null;
var F = {
  user: null,
  profile: null,
  categories: [],
  votes: new Set(),   // IDs de targets que el usuario ya ha votado
  catFilter: null,
  sort: 'new'
};

/* ── Utilidades ──────────────────────────────────────────────── */
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function nl2br(s) {
  return esc(s).replace(/\n\n+/g,'</p><p>').replace(/\n/g,'<br>');
}
function timeAgo(iso) {
  var s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'ahora';
  if (s < 3600) return Math.floor(s / 60) + ' min';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 2592000) return Math.floor(s / 86400) + 'd';
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
function avatarChar(name) { return (name || '?')[0].toUpperCase(); }
function avatarColor(name) {
  var cols = ['#4ab8f7', '#22c55e', '#f97316', '#fbbf24', '#a78bfa', '#f87171', '#38bdf8', '#4ade80'];
  return cols[(name || '?').charCodeAt(0) % cols.length];
}
function userName(profile) {
  if (profile && profile.username) return profile.username;
  if (F.user) return F.user.email.split('@')[0];
  return 'anónimo';
}

/* ── Verificar config ────────────────────────────────────────── */
function configOk() {
  return !FORO_URL.includes('XXXXXXXX') && !FORO_KEY.includes('ANON_KEY');
}

/* ── Inyectar modales ────────────────────────────────────────── */
function injectModals() {
  document.body.insertAdjacentHTML('beforeend',
    '<div id="foro-modal" class="foro-overlay" style="display:none" onclick="if(event.target===this)hideAuthModal()">' +
    '<div class="foro-modal">' +
    '<div class="foro-modal-tabs">' +
    '<button class="foro-modal-tab active" data-tab="login" onclick="switchTab(\'login\')">Entrar</button>' +
    '<button class="foro-modal-tab" data-tab="register" onclick="switchTab(\'register\')">Registrarse</button>' +
    '</div>' +
    '<p id="modal-msg" class="foro-error" style="min-height:18px"></p>' +
    '<form id="form-login" onsubmit="handleLogin(event)">' +
    '<div class="foro-field"><label>Email</label><input id="login-email" type="email" required autocomplete="email" placeholder="tu@email.com"></div>' +
    '<div class="foro-field"><label>Contraseña</label><input id="login-pw" type="password" required autocomplete="current-password" placeholder="Tu contraseña"></div>' +
    '<button class="foro-btn foro-btn-block" type="submit">Entrar</button>' +
    '</form>' +
    '<form id="form-register" style="display:none" onsubmit="handleRegister(event)">' +
    '<div class="foro-field"><label>Email</label><input id="reg-email" type="email" required autocomplete="email" placeholder="tu@email.com"></div>' +
    '<div class="foro-field"><label>Contraseña</label><input id="reg-pw" type="password" required autocomplete="new-password" placeholder="Mínimo 6 caracteres"></div>' +
    '<div class="foro-field"><label>Repite contraseña</label><input id="reg-pw2" type="password" required autocomplete="new-password"></div>' +
    '<button class="foro-btn foro-btn-block" type="submit">Crear cuenta</button>' +
    '</form>' +
    '</div></div>' +
    '<div id="foro-username-modal" class="foro-overlay" style="display:none">' +
    '<div class="foro-modal">' +
    '<h3 class="foro-modal-title">Elige tu nombre de usuario</h3>' +
    '<p class="foro-modal-sub">Solo letras, números y guión bajo. Mínimo 3 caracteres. Este nombre verán los demás.</p>' +
    '<form onsubmit="handleUsernameSubmit(event)">' +
    '<div class="foro-field"><label>Nombre de usuario</label><input id="username-input" type="text" required minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+" placeholder="ej: pescador_42"></div>' +
    '<p id="username-error" class="foro-error" style="min-height:16px"></p>' +
    '<button class="foro-btn foro-btn-block" type="submit">Guardar y continuar</button>' +
    '</form>' +
    '</div></div>'
  );
}

/* ── Auth ────────────────────────────────────────────────────── */
async function initAuth() {
  var res = await sb.auth.getSession();
  if (res.data && res.data.session) {
    F.user = res.data.session.user;
    await loadProfile();
    await loadUserVotes();
  }
  renderAuthBar();

  sb.auth.onAuthStateChange(async function(event, session) {
    F.user = session ? session.user : null;
    if (F.user) {
      await loadProfile();
      await loadUserVotes();
    } else {
      F.profile = null;
      F.votes.clear();
    }
    renderAuthBar();
    if (event === 'SIGNED_IN') {
      hideAuthModal();
      if (!F.profile || !F.profile.username) showUsernameModal();
    }
  });
}

async function loadProfile() {
  if (!F.user) return;
  var res = await sb.from('profiles').select('*').eq('id', F.user.id).single();
  F.profile = res.data || null;
}

async function loadUserVotes() {
  if (!F.user) return;
  var res = await sb.from('votes').select('target_id').eq('user_id', F.user.id);
  F.votes.clear();
  if (res.data) res.data.forEach(function(v) { F.votes.add(v.target_id); });
}

function renderAuthBar() {
  var el = document.getElementById('foro-auth-bar');
  if (!el) return;
  if (F.user) {
    var name = userName(F.profile);
    var col = avatarColor(name);
    el.innerHTML =
      '<div class="foro-user-pill">' +
      '<span class="foro-avatar" style="background:' + col + '" title="' + esc(name) + '">' + esc(avatarChar(name)) + '</span>' +
      '<span class="foro-uname">@' + esc(name) + '</span>' +
      '<button class="foro-btn-ghost" onclick="doLogout()">Salir</button>' +
      '</div>';
  } else {
    el.innerHTML =
      '<button class="foro-btn foro-btn-sm" onclick="showAuthModal(\'login\')">Entrar</button>' +
      '<button class="foro-btn-outline foro-btn-sm" onclick="showAuthModal(\'register\')">Registrarse</button>';
  }
}

async function doLogin(email, pw) {
  var res = await sb.auth.signInWithPassword({ email: email, password: pw });
  return res.error ? res.error.message : null;
}
async function doRegister(email, pw) {
  var res = await sb.auth.signUp({ email: email, password: pw });
  return res.error ? res.error.message : null;
}
async function doLogout() {
  await sb.auth.signOut();
  window.location.reload();
}
async function saveUsername(u) {
  u = u.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (u.length < 3) return 'Mínimo 3 caracteres (letras, números, _)';
  if (u.length > 20) return 'Máximo 20 caracteres';
  var res = await sb.from('profiles').update({ username: u }).eq('id', F.user.id);
  if (res.error) return res.error.code === '23505' ? 'Ese nombre ya está en uso, prueba otro' : res.error.message;
  F.profile = Object.assign({}, F.profile || {}, { id: F.user.id, username: u });
  return null;
}

/* Auth modal helpers */
function showAuthModal(tab) {
  var m = document.getElementById('foro-modal');
  if (m) { m.style.display = 'flex'; switchTab(tab || 'login'); }
}
function hideAuthModal() {
  var m = document.getElementById('foro-modal');
  if (m) m.style.display = 'none';
}
function switchTab(tab) {
  document.querySelectorAll('.foro-modal-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  var lf = document.getElementById('form-login');
  var rf = document.getElementById('form-register');
  if (lf) lf.style.display = tab === 'login' ? '' : 'none';
  if (rf) rf.style.display = tab === 'register' ? '' : 'none';
  var msg = document.getElementById('modal-msg');
  if (msg) { msg.textContent = ''; msg.className = 'foro-error'; }
}
function showUsernameModal() {
  var m = document.getElementById('foro-username-modal');
  if (m) m.style.display = 'flex';
}
function hideUsernameModal() {
  var m = document.getElementById('foro-username-modal');
  if (m) m.style.display = 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  var msg = document.getElementById('modal-msg');
  msg.className = 'foro-meta-text'; msg.textContent = 'Entrando…';
  var err = await doLogin(
    document.getElementById('login-email').value,
    document.getElementById('login-pw').value
  );
  if (err) { msg.className = 'foro-error'; msg.textContent = err; }
}
async function handleRegister(e) {
  e.preventDefault();
  var pw = document.getElementById('reg-pw').value;
  var pw2 = document.getElementById('reg-pw2').value;
  var msg = document.getElementById('modal-msg');
  if (pw !== pw2) { msg.className = 'foro-error'; msg.textContent = 'Las contraseñas no coinciden'; return; }
  msg.className = 'foro-meta-text'; msg.textContent = 'Creando cuenta…';
  var err = await doRegister(document.getElementById('reg-email').value, pw);
  if (err) { msg.className = 'foro-error'; msg.textContent = err; }
  else { msg.className = 'foro-success'; msg.textContent = '¡Cuenta creada! Revisa tu email para confirmarla y luego entra.'; }
}
async function handleUsernameSubmit(e) {
  e.preventDefault();
  var errEl = document.getElementById('username-error');
  var err = await saveUsername(document.getElementById('username-input').value);
  if (err) { errEl.textContent = err; return; }
  hideUsernameModal();
  renderAuthBar();
  if (window._foroAfterUsername) { window._foroAfterUsername(); window._foroAfterUsername = null; }
}

/* ── API: Categorías ─────────────────────────────────────────── */
async function loadCategories() {
  var res = await sb.from('categories').select('*').order('id');
  F.categories = res.data || [];
  return F.categories;
}

/* ── API: Posts ──────────────────────────────────────────────── */
async function loadPosts(opts) {
  opts = opts || {};
  var q = sb.from('posts').select(
    'id,created_at,title,body,upvotes,comment_count,user_id,category_id,profiles(username),categories(slug,name,icon)'
  );
  if (opts.category) q = q.eq('category_id', opts.category);
  if (opts.sort === 'top') q = q.order('upvotes', { ascending: false });
  else q = q.order('created_at', { ascending: false });
  var res = await q.limit(opts.limit || 40);
  return res.data || [];
}

async function loadPost(id) {
  var res = await sb.from('posts')
    .select('*,profiles(username),categories(slug,name,icon)')
    .eq('id', id).single();
  return res.data || null;
}

async function createPost(catId, title, body) {
  if (!F.user) { showAuthModal('login'); return { error: 'login' }; }
  if (!F.profile || !F.profile.username) {
    window._foroAfterUsername = function() { document.getElementById('foro-submit-btn').click(); };
    showUsernameModal(); return { error: 'username' };
  }
  var res = await sb.from('posts').insert({
    user_id: F.user.id,
    category_id: parseInt(catId),
    title: title.trim(),
    body: body.trim()
  }).select().single();
  return { data: res.data, error: res.error ? res.error.message : null };
}

/* ── API: Comentarios ────────────────────────────────────────── */
async function loadComments(postId) {
  var res = await sb.from('comments')
    .select('*,profiles(username)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return res.data || [];
}

async function createComment(postId, body, parentId) {
  if (!F.user) { showAuthModal('login'); return { error: 'login' }; }
  var obj = { user_id: F.user.id, post_id: postId, body: body.trim() };
  if (parentId) obj.parent_id = parentId;
  var res = await sb.from('comments').insert(obj).select('*,profiles(username)').single();
  // comment_count s'actualitza via trigger trg_comment_count (no cal RPC)
  return { data: res.data, error: res.error ? res.error.message : null };
}

/* ── Votos (via toggle_vote RPC atòmic) ─────────────────────── */
async function toggleVote(targetId, targetType, countEl, btnEl) {
  if (!F.user) { showAuthModal('login'); return; }
  var had = F.votes.has(targetId);
  // Optimistic UI
  countEl.textContent = Math.max(0, (parseInt(countEl.textContent) || 0) + (had ? -1 : 1));
  btnEl.classList.toggle('voted', !had);

  var res = await sb.rpc('toggle_vote', { p_target_id: targetId, p_target_type: targetType });

  if (res.error) {
    // Revertir si falla (xarxa, sessió expirada…)
    countEl.textContent = Math.max(0, (parseInt(countEl.textContent) || 0) + (had ? 1 : -1));
    btnEl.classList.toggle('voted', had);
    return;
  }
  // Sincronitza amb l'estat real retornat pel servidor
  if (res.data) {
    countEl.textContent = res.data.upvotes;
    btnEl.classList.toggle('voted', res.data.voted);
    if (res.data.voted) F.votes.add(targetId); else F.votes.delete(targetId);
  }
}

function bindVoteBtn(btn, targetType) {
  btn.addEventListener('click', function() {
    var id = btn.dataset.id || btn.dataset.commentVote;
    var wrap = btn.closest('[data-vote-wrap]');
    var countEl = wrap ? wrap.querySelector('.foro-vote-count, .vc') : null;
    if (!countEl) return;
    if (F.votes.has(id)) btn.classList.add('voted'); else btn.classList.remove('voted');
    toggleVote(id, targetType, countEl, btn);
  });
}

/* ── Página: LISTA DE POSTS ──────────────────────────────────── */
async function initForoIndex() {
  await loadCategories();
  renderSidebar();
  await renderPostList();
}

function renderSidebar() {
  var el = document.getElementById('foro-sidebar');
  if (!el) return;
  el.innerHTML =
    '<p class="foro-sidebar-title">Categorías</p>' +
    '<a class="foro-cat-item' + (F.catFilter === null ? ' active' : '') + '" href="#" onclick="filterCat(null,event)">' +
    '<span class="foro-cat-icon">🎣</span> Todos los temas</a>' +
    F.categories.map(function(c) {
      return '<a class="foro-cat-item' + (F.catFilter === c.id ? ' active' : '') + '" href="#" onclick="filterCat(' + c.id + ',event)">' +
        '<span class="foro-cat-icon">' + esc(c.icon) + '</span> ' + esc(c.name) + '</a>';
    }).join('');
}

async function renderPostList() {
  var el = document.getElementById('foro-posts');
  if (!el) return;
  el.innerHTML = '<p class="foro-loading">Cargando…</p>';
  var posts = await loadPosts({ category: F.catFilter, sort: F.sort });
  if (!posts.length) {
    el.innerHTML = '<p class="foro-empty">No hay posts aquí todavía. ¡Sé el primero en publicar!</p>';
    return;
  }
  el.innerHTML = posts.map(function(p) { return renderPostCard(p); }).join('');
  el.querySelectorAll('[data-vote-wrap]').forEach(function(wrap) {
    var btn = wrap.querySelector('.foro-vote-btn');
    if (btn) {
      if (F.votes.has(btn.dataset.id)) btn.classList.add('voted');
      bindVoteBtn(btn, 'post');
    }
  });
}

function renderPostCard(p) {
  var prf = p.profiles || {};
  var cat = p.categories || {};
  var name = prf.username || 'anónimo';
  var icon = cat.icon || '🎣';
  var catName = cat.name || '';
  var excerpt = p.body.length > 130 ? p.body.slice(0, 130) + '…' : p.body;
  return (
    '<article class="foro-post-card">' +
    '<div class="foro-vote-col" data-vote-wrap>' +
    '<button class="foro-vote-btn" data-id="' + esc(p.id) + '" title="Votar">▲</button>' +
    '<span class="foro-vote-count">' + (p.upvotes || 0) + '</span>' +
    '</div>' +
    '<div class="foro-post-content">' +
    '<div class="foro-post-meta">' +
    '<span class="foro-badge">' + esc(icon) + ' ' + esc(catName) + '</span>' +
    '<span class="foro-meta-text">por <strong>@' + esc(name) + '</strong> · ' + timeAgo(p.created_at) + '</span>' +
    '</div>' +
    '<a class="foro-post-title" href="/foro/post/?id=' + esc(p.id) + '">' + esc(p.title) + '</a>' +
    '<p class="foro-post-excerpt">' + esc(excerpt) + '</p>' +
    '<div class="foro-post-footer">' +
    '<a class="foro-comment-link" href="/foro/post/?id=' + esc(p.id) + '">💬 ' + (p.comment_count || 0) + ' comentarios</a>' +
    '</div></div></article>'
  );
}

async function filterCat(catId, e) {
  if (e) e.preventDefault();
  F.catFilter = catId;
  renderSidebar();
  await renderPostList();
}

async function sortBy(s) {
  F.sort = s;
  document.querySelectorAll('.foro-sort-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.sort === s);
  });
  await renderPostList();
}

/* ── Página: POST INDIVIDUAL ─────────────────────────────────── */
async function initForoPost() {
  var postId = new URLSearchParams(location.search).get('id');
  if (!postId) { location.href = '/foro/'; return; }

  var post = await loadPost(postId);
  if (!post) {
    var area = document.getElementById('foro-post-area');
    if (area) area.innerHTML = '<p class="foro-error" style="padding:32px">Post no encontrado.</p>';
    return;
  }

  document.title = esc(post.title) + ' · Foro AJSpinning';
  renderFullPost(post);
  var comments = await loadComments(postId);
  renderCommentList(comments, postId);
  renderCommentForm(postId);
}

function renderFullPost(p) {
  var el = document.getElementById('foro-post-area');
  if (!el) return;
  var prf = p.profiles || {};
  var cat = p.categories || {};
  var name = prf.username || 'anónimo';
  var col = avatarColor(name);
  el.innerHTML =
    '<div class="foro-full-post">' +
    '<div class="foro-full-top"><span class="foro-badge">' + esc(cat.icon || '🎣') + ' ' + esc(cat.name || '') + '</span></div>' +
    '<h1 class="foro-full-title">' + esc(p.title) + '</h1>' +
    '<div class="foro-full-meta">' +
    '<span class="foro-avatar foro-avatar-sm" style="background:' + col + '">' + esc(avatarChar(name)) + '</span>' +
    '<span class="foro-meta-text"><strong>@' + esc(name) + '</strong> · ' + timeAgo(p.created_at) + '</span>' +
    '</div>' +
    '<div class="foro-full-body"><p>' + nl2br(p.body) + '</p></div>' +
    '<div class="foro-full-actions" data-vote-wrap>' +
    '<button class="foro-vote-inline" id="post-vote-btn" data-id="' + esc(p.id) + '">▲ <span class="foro-vote-count">' + (p.upvotes || 0) + '</span> votos</button>' +
    '<span class="foro-meta-text">💬 <span id="post-comment-count">' + (p.comment_count || 0) + '</span> comentarios</span>' +
    '</div></div>';

  var btn = el.querySelector('#post-vote-btn');
  if (btn) {
    if (F.votes.has(p.id)) btn.classList.add('voted');
    bindVoteBtn(btn, 'post');
  }
}

function renderCommentList(comments, postId) {
  var el = document.getElementById('foro-comments');
  if (!el) return;
  var roots = [], repliesMap = {};
  comments.forEach(function(c) {
    if (!c.parent_id) roots.push(c);
    else { (repliesMap[c.parent_id] = repliesMap[c.parent_id] || []).push(c); }
  });
  if (!roots.length) {
    el.innerHTML = '<p class="foro-empty">Todavía no hay comentarios. ¡Añade el primero!</p>';
    return;
  }
  el.innerHTML = roots.map(function(c) { return renderComment(c, repliesMap[c.id] || [], postId); }).join('');
  bindCommentVotes(el);
  bindReplyBtns(el, postId);
}

function renderComment(c, replies, postId) {
  var prf = c.profiles || {};
  var name = prf.username || 'anónimo';
  var col = avatarColor(name);
  return (
    '<div class="foro-comment" id="comment-' + esc(c.id) + '">' +
    '<div class="foro-comment-header">' +
    '<span class="foro-avatar foro-avatar-xs" style="background:' + col + '">' + esc(avatarChar(name)) + '</span>' +
    '<strong class="foro-comment-author">@' + esc(name) + '</strong>' +
    '<span class="foro-meta-text">· ' + timeAgo(c.created_at) + '</span>' +
    '</div>' +
    '<div class="foro-comment-body"><p>' + nl2br(c.body) + '</p></div>' +
    '<div class="foro-comment-actions" data-vote-wrap>' +
    '<button class="foro-vote-btn foro-vote-sm' + (F.votes.has(c.id) ? ' voted' : '') + '" data-comment-vote="' + esc(c.id) + '" data-id="' + esc(c.id) + '" title="Votar">▲ <span class="foro-vote-count vc">' + (c.upvotes || 0) + '</span></button>' +
    (postId ? '<button class="foro-reply-btn" data-reply-to="' + esc(c.id) + '">Responder</button>' : '') +
    '</div>' +
    (replies.length ? '<div class="foro-comment-replies">' + replies.map(function(r) { return renderComment(r, [], null); }).join('') + '</div>' : '') +
    '<div id="reply-form-' + esc(c.id) + '"></div>' +
    '</div>'
  );
}

function bindCommentVotes(container) {
  container.querySelectorAll('[data-comment-vote]').forEach(function(btn) {
    bindVoteBtn(btn, 'comment');
  });
}

function bindReplyBtns(container, postId) {
  container.querySelectorAll('[data-reply-to]').forEach(function(btn) {
    btn.addEventListener('click', function() { showReplyForm(btn.dataset.replyTo, postId); });
  });
}

function showReplyForm(parentId, postId) {
  var el = document.getElementById('reply-form-' + parentId);
  if (!el) return;
  if (el.innerHTML.trim()) { el.innerHTML = ''; return; } // toggle
  el.innerHTML =
    '<form class="foro-reply-form" onsubmit="submitReply(event,\'' + esc(parentId) + '\',\'' + esc(postId) + '\')">' +
    '<textarea class="foro-textarea foro-textarea-sm" placeholder="Tu respuesta…" required rows="2"></textarea>' +
    '<button class="foro-btn foro-btn-sm" type="submit">Enviar</button>' +
    '<button type="button" class="foro-btn-ghost" onclick="document.getElementById(\'reply-form-' + esc(parentId) + '\').innerHTML=\'\'">Cancelar</button>' +
    '</form>';
}

async function submitReply(e, parentId, postId) {
  e.preventDefault();
  var ta = e.target.querySelector('textarea');
  var body = ta.value.trim();
  if (!body) return;
  var btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Enviando…';
  var res = await createComment(postId, body, parentId);
  if (res.error === 'login') return;
  if (res.error) { btn.disabled = false; btn.textContent = 'Enviar'; alert(res.error); return; }
  var formEl = document.getElementById('reply-form-' + parentId);
  if (formEl) formEl.innerHTML = '';
  var parentEl = document.getElementById('comment-' + parentId);
  if (parentEl && res.data) {
    var fakeC = Object.assign({}, res.data, { profiles: { username: userName(F.profile) }, upvotes: 0 });
    var repliesEl = parentEl.querySelector('.foro-comment-replies');
    if (!repliesEl) {
      repliesEl = document.createElement('div');
      repliesEl.className = 'foro-comment-replies';
      parentEl.insertBefore(repliesEl, formEl);
    }
    repliesEl.insertAdjacentHTML('beforeend', renderComment(fakeC, [], null));
    bindCommentVotes(repliesEl.lastElementChild);
  }
  incrementCommentCount();
}

function renderCommentForm(postId) {
  var el = document.getElementById('foro-add-comment');
  if (!el) return;
  el.innerHTML =
    '<div class="foro-add-comment-wrap">' +
    '<p class="foro-section-title" style="margin-bottom:14px">Añadir comentario</p>' +
    '<form onsubmit="submitMainComment(event,\'' + esc(postId) + '\')">' +
    '<div class="foro-field"><textarea id="main-comment-ta" class="foro-textarea" placeholder="Comparte tu opinión, experiencia o consejo…" required rows="4"></textarea></div>' +
    (F.user
      ? '<button class="foro-btn" type="submit">Enviar comentario</button>'
      : '<p class="foro-login-prompt">Para comentar debes <a onclick="showAuthModal(\'login\')">iniciar sesión</a> o <a onclick="showAuthModal(\'register\')">registrarte</a> (es gratis).</p>'
    ) +
    '</form></div>';
}

async function submitMainComment(e, postId) {
  e.preventDefault();
  var ta = document.getElementById('main-comment-ta');
  var body = ta.value.trim();
  if (!body) return;
  var btn = e.target.querySelector('button');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
  var res = await createComment(postId, body, null);
  if (res.error === 'login') {
    if (btn) { btn.disabled = false; btn.textContent = 'Enviar comentario'; }
    return;
  }
  if (res.error) {
    if (btn) { btn.disabled = false; btn.textContent = 'Enviar comentario'; }
    alert(res.error); return;
  }
  ta.value = '';
  if (btn) { btn.disabled = false; btn.textContent = 'Enviar comentario'; }
  if (res.data) {
    var commentsEl = document.getElementById('foro-comments');
    var emptyEl = commentsEl && commentsEl.querySelector('.foro-empty');
    if (emptyEl) commentsEl.innerHTML = '';
    if (commentsEl) {
      var fakeC = Object.assign({}, res.data, { profiles: { username: userName(F.profile) }, upvotes: 0 });
      commentsEl.insertAdjacentHTML('beforeend', renderComment(fakeC, [], postId));
      var newEl = commentsEl.lastElementChild;
      bindCommentVotes(newEl);
      bindReplyBtns(newEl, postId);
    }
    incrementCommentCount();
  }
}

function incrementCommentCount() {
  var el = document.getElementById('post-comment-count');
  if (el) el.textContent = (parseInt(el.textContent) || 0) + 1;
}

/* ── Página: NUEVO POST ──────────────────────────────────────── */
async function initNuevoPost() {
  await loadCategories();
  var sel = document.getElementById('post-category');
  if (sel) {
    sel.innerHTML = '<option value="">— Selecciona categoría —</option>' +
      F.categories.map(function(c) {
        return '<option value="' + c.id + '">' + esc(c.icon) + ' ' + esc(c.name) + '</option>';
      }).join('');
  }
  if (!F.user) {
    var wrap = document.getElementById('nuevo-form-wrap');
    if (wrap) wrap.style.opacity = '0.5';
    showAuthModal('login');
  }
  var titleIn = document.getElementById('post-title');
  var charCount = document.getElementById('title-chars');
  if (titleIn && charCount) {
    titleIn.addEventListener('input', function() {
      charCount.textContent = titleIn.value.length + '/200';
    });
  }
}

async function handleNewPost(e) {
  e.preventDefault();
  var catId = document.getElementById('post-category').value;
  var title = document.getElementById('post-title').value;
  var body = document.getElementById('post-body').value;
  var errEl = document.getElementById('post-error');
  errEl.textContent = '';
  if (!catId) { errEl.textContent = 'Selecciona una categoría'; return; }
  if (title.trim().length < 5) { errEl.textContent = 'El título es demasiado corto (mín. 5 caracteres)'; return; }
  if (body.trim().length < 10) { errEl.textContent = 'El texto es demasiado corto (mín. 10 caracteres)'; return; }
  var btn = document.getElementById('foro-submit-btn');
  btn.disabled = true; btn.textContent = 'Publicando…';
  var res = await createPost(catId, title, body);
  if (res.error && res.error !== 'login' && res.error !== 'username') {
    errEl.textContent = res.error;
    btn.disabled = false; btn.textContent = 'Publicar';
    return;
  }
  if (res.data) location.href = '/foro/post/?id=' + res.data.id;
}

/* ── Entrada principal ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async function() {
  if (!configOk()) {
    var banner = document.createElement('div');
    banner.className = 'foro-setup-banner';
    banner.innerHTML = '⚠️ <strong>Configura Supabase:</strong> Edita <code>/assets/js/foro.js</code> y reemplaza <code>FORO_URL</code> y <code>FORO_KEY</code> con las credenciales de tu proyecto Supabase. <a href="/foro/setup.html" style="color:inherit;text-decoration:underline">Ver instrucciones →</a>';
    var wrap = document.querySelector('.foro-wrap');
    if (wrap) wrap.insertAdjacentElement('afterbegin', banner);
    return;
  }

  sb = supabase.createClient(FORO_URL, FORO_KEY);
  injectModals();
  await initAuth();

  var page = document.body.dataset.foroPage;
  if (page === 'index') initForoIndex();
  else if (page === 'post') initForoPost();
  else if (page === 'nuevo') initNuevoPost();
});
