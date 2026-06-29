/* ════════════════════════════════════════════════════════════════
   AJSpinning · Foro comunitario
   Supabase v2 + Vanilla JS puro
   ════════════════════════════════════════════════════════════════

   Credenciales públicas del proyecto Supabase (anon key):
   Settings → API → Project URL / anon public
   ════════════════════════════════════════════════════════════════ */

var FORO_URL = 'https://ssmcqqtnbuyuxqsyozdn.supabase.co';
var FORO_KEY = 'sb_publishable_F87ry8e0jaWxLalUJ-w1Qw_BhadB5gO';

/* ── Estado global ───────────────────────────────────────────── */
var sb = null;
var F = {
  user: null,
  profile: null,
  categories: [],
  votes: new Set(),
  catFilter: null,
  sort: 'new'
};
var _currentPost = null;
var _currentPostImages = [];

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
  var cols = ['#4ab8f7','#22c55e','#f97316','#fbbf24','#a78bfa','#f87171','#38bdf8','#4ade80'];
  return cols[(name || '?').charCodeAt(0) % cols.length];
}
function userName(profile) {
  if (profile && profile.display_name) return profile.display_name;
  if (profile && profile.username) return profile.username;
  if (F.user) return F.user.email.split('@')[0];
  return 'anónimo';
}
function userHandle(profile) {
  var n = userName(profile);
  return n.includes(' ') ? n : '@' + n;
}

/* Genera HTML de avatar: imagen real si hay avatar_url, sino inicial de color */
function avatarHtml(prf, cls) {
  var name = (prf && prf.username) || '?';
  var col = avatarColor(name);
  var clsStr = cls ? ' ' + cls : '';
  if (prf && prf.avatar_url) {
    return '<span class="foro-avatar' + clsStr + '" style="background:' + col + ';padding:0;overflow:hidden">' +
      '<img src="' + esc(prf.avatar_url) + '" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'">' +
      '</span>';
  }
  return '<span class="foro-avatar' + clsStr + '" style="background:' + col + '">' + esc(avatarChar(name)) + '</span>';
}

/* SVG del ojo para mostrar/ocultar contraseña */
var _SVG_EYE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
var _SVG_EYE_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

function togglePw(inputId, btn) {
  var inp = document.getElementById(inputId);
  var show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.innerHTML = show ? _SVG_EYE_OFF : _SVG_EYE;
  btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
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
    '<div class="foro-field"><label>Contraseña</label><div class="foro-pw-wrap"><input id="login-pw" type="password" required autocomplete="current-password" placeholder="Tu contraseña"><button type="button" class="foro-pw-eye" onclick="togglePw(\'login-pw\',this)" tabindex="-1" aria-label="Mostrar contraseña">' + _SVG_EYE + '</button></div></div>' +
    '<button class="foro-btn foro-btn-block" type="submit">Entrar</button>' +
    '<p style="text-align:right;margin:8px 0 0"><button type="button" class="foro-link-btn" onclick="showForgotForm()">¿Olvidaste tu contraseña?</button></p>' +
    '</form>' +
    '<form id="form-register" style="display:none" onsubmit="handleRegister(event)">' +
    '<div class="foro-field"><label>Email</label><input id="reg-email" type="email" required autocomplete="email" placeholder="tu@email.com"></div>' +
    '<div class="foro-field"><label>Contraseña</label><div class="foro-pw-wrap"><input id="reg-pw" type="password" required autocomplete="new-password" placeholder="Mínimo 6 caracteres"><button type="button" class="foro-pw-eye" onclick="togglePw(\'reg-pw\',this)" tabindex="-1" aria-label="Mostrar contraseña">' + _SVG_EYE + '</button></div></div>' +
    '<div class="foro-field"><label>Repite contraseña</label><div class="foro-pw-wrap"><input id="reg-pw2" type="password" required autocomplete="new-password"><button type="button" class="foro-pw-eye" onclick="togglePw(\'reg-pw2\',this)" tabindex="-1" aria-label="Mostrar contraseña">' + _SVG_EYE + '</button></div></div>' +
    '<button class="foro-btn foro-btn-block" type="submit">Crear cuenta</button>' +
    '</form>' +
    '<div id="form-forgot" style="display:none">' +
    '<h3 class="foro-modal-title" style="margin-bottom:6px">Recuperar contraseña</h3>' +
    '<p class="foro-modal-sub">Introduce tu email y te enviaremos un enlace para restablecerla.</p>' +
    '<div class="foro-field"><label>Email</label><input id="forgot-email" type="email" autocomplete="email" placeholder="tu@email.com"></div>' +
    '<button class="foro-btn foro-btn-block" type="button" onclick="handleForgotPw()">Enviar enlace</button>' +
    '<p id="forgot-msg" style="min-height:18px;margin-top:10px;font-size:13px"></p>' +
    '<p style="margin:12px 0 0;text-align:center"><button type="button" class="foro-link-btn" onclick="hideForgotForm()">← Volver al inicio de sesión</button></p>' +
    '</div>' +
    '</div></div>' +
    '<div id="foro-reset-pw-modal" class="foro-overlay" style="display:none">' +
    '<div class="foro-modal">' +
    '<h3 class="foro-modal-title">Nueva contraseña</h3>' +
    '<p class="foro-modal-sub">Elige una contraseña nueva para tu cuenta.</p>' +
    '<div class="foro-field"><label>Nueva contraseña</label><div class="foro-pw-wrap"><input id="reset-pw" type="password" required autocomplete="new-password" placeholder="Mínimo 6 caracteres"><button type="button" class="foro-pw-eye" onclick="togglePw(\'reset-pw\',this)" tabindex="-1" aria-label="Mostrar contraseña">' + _SVG_EYE + '</button></div></div>' +
    '<div class="foro-field"><label>Repite contraseña</label><div class="foro-pw-wrap"><input id="reset-pw2" type="password" required autocomplete="new-password"><button type="button" class="foro-pw-eye" onclick="togglePw(\'reset-pw2\',this)" tabindex="-1" aria-label="Mostrar contraseña">' + _SVG_EYE + '</button></div></div>' +
    '<p id="reset-msg" class="foro-error" style="min-height:18px"></p>' +
    '<button class="foro-btn foro-btn-block" type="button" onclick="handleNewPassword()">Guardar contraseña</button>' +
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
  /* Gestión del redirect tras confirmación de email.
     Supabase v2 implict flow devuelve tokens en el hash (#access_token=...).
     El cliente los procesa automáticamente en getSession(), pero limpiamos
     el hash para que no quede en el historial ni se comparta. */
  var hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  if (hash && hash.includes('error_description')) {
    var params = new URLSearchParams(hash.replace(/^#/, ''));
    var errDesc = decodeURIComponent((params.get('error_description') || 'Error de verificación').replace(/\+/g, ' '));
    history.replaceState(null, '', window.location.pathname + window.location.search);
    setTimeout(function() {
      var msg = document.createElement('div');
      msg.className = 'foro-setup-banner';
      msg.textContent = '⚠️ ' + errDesc;
      var wrap = document.querySelector('.foro-wrap');
      if (wrap) wrap.insertAdjacentElement('afterbegin', msg);
    }, 100);
  }

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
    if (event === 'PASSWORD_RECOVERY') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      showResetPwModal();
    }
  });
}

async function loadProfile() {
  if (!F.user) return;
  var res = await sb.from('profiles').select('*').eq('id', F.user.id).single();
  /* PGRST116 = ninguna fila encontrada — es normal si el trigger no creó el perfil */
  if (res.error && res.error.code !== 'PGRST116') {
    console.warn('[foro] loadProfile:', res.error.message);
  }
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
    el.innerHTML =
      '<div class="foro-user-pill">' +
      avatarHtml(F.profile, '') +
      '<a class="foro-uname" href="/foro/perfil/" title="Mi perfil">@' + esc(name) + '</a>' +
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

/* FIX: emailRedirectTo para que el link de confirmación redirija a /foro/ */
async function doRegister(email, pw) {
  var redirectTo = window.location.origin + '/foro/';
  var res = await sb.auth.signUp({
    email: email,
    password: pw,
    options: { emailRedirectTo: redirectTo }
  });
  return res.error ? res.error.message : null;
}

async function doLogout() {
  await sb.auth.signOut();
  window.location.reload();
}

/* FIX: upsert en lugar de update para garantizar creación si el trigger falló */
async function saveUsername(u) {
  u = u.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (u.length < 3) return 'Mínimo 3 caracteres (letras, números, _)';
  if (u.length > 20) return 'Máximo 20 caracteres';
  var res = await sb.from('profiles').upsert({ id: F.user.id, username: u }, { onConflict: 'id' });
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
function showForgotForm() {
  var lf = document.getElementById('form-login');
  var ff = document.getElementById('form-forgot');
  var tabs = document.querySelector('.foro-modal-tabs');
  var msg = document.getElementById('modal-msg');
  if (lf) lf.style.display = 'none';
  if (ff) ff.style.display = '';
  if (tabs) tabs.style.display = 'none';
  if (msg) msg.textContent = '';
}
function hideForgotForm() {
  var lf = document.getElementById('form-login');
  var ff = document.getElementById('form-forgot');
  var tabs = document.querySelector('.foro-modal-tabs');
  var fmsg = document.getElementById('forgot-msg');
  if (lf) lf.style.display = '';
  if (ff) ff.style.display = 'none';
  if (tabs) tabs.style.display = '';
  if (fmsg) fmsg.textContent = '';
  switchTab('login');
}
async function handleForgotPw() {
  var email = (document.getElementById('forgot-email').value || '').trim();
  var msgEl = document.getElementById('forgot-msg');
  if (!email) { msgEl.style.color = '#f87171'; msgEl.textContent = 'Introduce tu email.'; return; }
  msgEl.style.color = 'var(--c-muted)'; msgEl.textContent = 'Enviando…';
  var res = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/foro/'
  });
  if (res.error) {
    msgEl.style.color = '#f87171'; msgEl.textContent = res.error.message;
  } else {
    msgEl.style.color = '#22c55e';
    msgEl.textContent = '¡Enlace enviado! Revisa tu bandeja de entrada (y el spam).';
  }
}
function showResetPwModal() {
  var m = document.getElementById('foro-reset-pw-modal');
  if (m) m.style.display = 'flex';
}
function hideResetPwModal() {
  var m = document.getElementById('foro-reset-pw-modal');
  if (m) m.style.display = 'none';
}
async function handleNewPassword() {
  var pw = document.getElementById('reset-pw').value;
  var pw2 = document.getElementById('reset-pw2').value;
  var msgEl = document.getElementById('reset-msg');
  msgEl.className = 'foro-error'; msgEl.textContent = '';
  if (pw.length < 6) { msgEl.textContent = 'Mínimo 6 caracteres.'; return; }
  if (pw !== pw2) { msgEl.textContent = 'Las contraseñas no coinciden.'; return; }
  msgEl.className = 'foro-meta-text'; msgEl.textContent = 'Guardando…';
  var res = await sb.auth.updateUser({ password: pw });
  if (res.error) {
    msgEl.className = 'foro-error'; msgEl.textContent = res.error.message;
  } else {
    msgEl.className = 'foro-success'; msgEl.textContent = '¡Contraseña actualizada! Ya puedes usarla.';
    setTimeout(hideResetPwModal, 2500);
  }
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
    'id,created_at,title,body,upvotes,comment_count,user_id,category_id,' +
    'profiles(username,display_name,avatar_url),categories(slug,name,icon)'
  );
  if (opts.category) q = q.eq('category_id', opts.category);
  if (opts.sort === 'top') q = q.order('upvotes', { ascending: false });
  else q = q.order('created_at', { ascending: false });
  var res = await q.limit(opts.limit || 40);
  if (!res.error) return res.data || [];
  console.warn('[foro] loadPosts join failed:', JSON.stringify(res.error));
  var q2 = sb.from('posts').select('id,created_at,title,body,upvotes,comment_count,user_id,category_id');
  if (opts.category) q2 = q2.eq('category_id', opts.category);
  if (opts.sort === 'top') q2 = q2.order('upvotes', { ascending: false });
  else q2 = q2.order('created_at', { ascending: false });
  var res2 = await q2.limit(opts.limit || 40);
  if (res2.error) console.warn('[foro] loadPosts fallback failed:', JSON.stringify(res2.error));
  return res2.data || [];
}

async function loadPost(id) {
  var res = await sb.from('posts')
    .select('*,profiles(username,display_name,avatar_url),categories(slug,name,icon)')
    .eq('id', id).single();
  if (!res.error) return res.data;
  console.warn('[foro] loadPost join failed:', JSON.stringify(res.error));
  var r2 = await sb.from('posts').select('*').eq('id', id).single();
  if (r2.error) {
    console.warn('[foro] loadPost fallback failed:', JSON.stringify(r2.error));
    return null;
  }
  var post = r2.data;
  if (post.user_id) {
    var rp = await sb.from('profiles').select('username,display_name,avatar_url').eq('id', post.user_id).maybeSingle();
    post.profiles = (rp && rp.data) || {};
  }
  if (post.category_id) {
    var rc = await sb.from('categories').select('slug,name,icon').eq('id', post.category_id).maybeSingle();
    post.categories = (rc && rc.data) || {};
  }
  return post;
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
    .select('*,profiles(username,display_name,avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return res.data || [];
}

async function createComment(postId, body, parentId) {
  if (!F.user) { showAuthModal('login'); return { error: 'login' }; }
  var obj = { user_id: F.user.id, post_id: postId, body: body.trim() };
  if (parentId) obj.parent_id = parentId;
  var res = await sb.from('comments').insert(obj).select('*,profiles(username,avatar_url)').single();
  return { data: res.data, error: res.error ? res.error.message : null };
}

/* ── API: Imágenes de posts ──────────────────────────────────── */
async function loadPostImages(postId) {
  var res = await sb.from('post_images').select('image_url,position').eq('post_id', postId).order('position');
  return res.data || [];
}

async function uploadPostImages(postId, files, onProgress) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg','jpeg','png','webp'].includes(ext)) ext = 'jpg';
    var path = F.user.id + '/' + postId + '_' + i + '.' + ext;
    var upRes = await sb.storage.from('forum-images').upload(path, file, { contentType: file.type });
    if (upRes.error) return 'Error subiendo imagen ' + (i + 1) + ': ' + upRes.error.message;
    var publicUrl = sb.storage.from('forum-images').getPublicUrl(path).data.publicUrl;
    var imgRes = await sb.from('post_images').insert({
      post_id: postId, user_id: F.user.id,
      image_url: publicUrl, storage_path: path, position: i
    });
    if (imgRes.error) return 'Error guardando imagen ' + (i + 1) + ': ' + imgRes.error.message;
    if (onProgress) onProgress(i + 1, files.length);
  }
  return null;
}

function renderPostGallery(images) {
  if (!images || !images.length) return '';
  return '<div class="foro-post-gallery">' +
    images.map(function(img) {
      return '<a href="' + esc(img.image_url) + '" target="_blank" rel="noopener" class="foro-gallery-item">' +
        '<img src="' + esc(img.image_url) + '" alt="Imagen del post" loading="lazy" class="foro-gallery-img">' +
        '</a>';
    }).join('') +
    '</div>';
}

var _postImageFiles = [];

function initImageUploadInput() {
  var input = document.getElementById('post-images');
  var preview = document.getElementById('post-images-preview');
  var errEl = document.getElementById('post-error');
  if (!input || !preview) return;
  input.addEventListener('change', function() {
    _postImageFiles = [];
    preview.innerHTML = '';
    if (errEl) errEl.textContent = '';
    var files = Array.from(input.files);
    if (files.length > 4) {
      if (errEl) errEl.textContent = 'Máximo 4 imágenes por post.';
      input.value = ''; return;
    }
    var valid = true;
    files.forEach(function(f) {
      if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(f.type)) {
        if (errEl) errEl.textContent = '"' + f.name + '" no es válido. Solo JPG, PNG o WebP.';
        valid = false;
      } else if (f.size > 3 * 1024 * 1024) {
        if (errEl) errEl.textContent = '"' + f.name + '" supera los 3 MB.';
        valid = false;
      }
    });
    if (!valid) { input.value = ''; return; }
    _postImageFiles = files;
    files.forEach(function(f, idx) {
      var url = URL.createObjectURL(f);
      var div = document.createElement('div');
      div.className = 'foro-img-preview-item';
      div.innerHTML =
        '<img src="' + url + '" alt="Preview" class="foro-img-preview-thumb">' +
        '<button type="button" class="foro-img-preview-remove" onclick="removePreviewImage(' + idx + ')">×</button>';
      preview.appendChild(div);
    });
  });
}

function removePreviewImage(idx) {
  _postImageFiles.splice(idx, 1);
  var preview = document.getElementById('post-images-preview');
  var input = document.getElementById('post-images');
  if (preview) {
    var items = preview.querySelectorAll('.foro-img-preview-item');
    if (items[idx]) items[idx].remove();
    preview.querySelectorAll('.foro-img-preview-remove').forEach(function(btn, i) {
      btn.setAttribute('onclick', 'removePreviewImage(' + i + ')');
    });
  }
  if (input) input.value = '';
}

/* ── Votos (via toggle_vote RPC atómico) ────────────────────── */
async function toggleVote(targetId, targetType, countEl, btnEl) {
  if (!F.user) { showAuthModal('login'); return; }
  var had = F.votes.has(targetId);
  countEl.textContent = Math.max(0, (parseInt(countEl.textContent) || 0) + (had ? -1 : 1));
  btnEl.classList.toggle('voted', !had);

  var res = await sb.rpc('toggle_vote', { p_target_id: targetId, p_target_type: targetType });

  if (res.error) {
    countEl.textContent = Math.max(0, (parseInt(countEl.textContent) || 0) + (had ? 1 : -1));
    btnEl.classList.toggle('voted', had);
    console.warn('[foro] toggleVote:', res.error.message);
    return;
  }
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
  var cats = F.categories.length
    ? F.categories.map(function(c) {
        return '<a class="foro-cat-item' + (F.catFilter === c.id ? ' active' : '') +
          '" href="#" onclick="filterCat(' + c.id + ',event)">' +
          '<span class="foro-cat-icon">' + esc(c.icon) + '</span> ' + esc(c.name) + '</a>';
      }).join('')
    : '<p style="font-size:12px;color:var(--c-muted);padding:4px 10px">Sin categorías</p>';

  el.innerHTML =
    '<p class="foro-sidebar-title">Categorías</p>' +
    '<a class="foro-cat-item' + (F.catFilter === null ? ' active' : '') +
    '" href="#" onclick="filterCat(null,event)">' +
    '<span class="foro-cat-icon">🎣</span> Todos los temas</a>' + cats;
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
  var excerpt = (p.body || '').length > 130 ? p.body.slice(0, 130) + '…' : (p.body || '');
  return (
    '<article class="foro-post-card">' +
    '<div class="foro-vote-col" data-vote-wrap>' +
    '<button class="foro-vote-btn" data-id="' + esc(p.id) + '" title="Votar">▲</button>' +
    '<span class="foro-vote-count">' + (p.upvotes || 0) + '</span>' +
    '</div>' +
    '<div class="foro-post-content">' +
    '<div class="foro-post-meta">' +
    '<span class="foro-badge">' + esc(cat.icon || '🎣') + ' ' + esc(cat.name || '') + '</span>' +
    avatarHtml(prf, 'foro-avatar-xs') +
    '<span class="foro-meta-text">por <strong>' + esc(userHandle(prf)) + '</strong> · ' + timeAgo(p.created_at) + '</span>' +
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

/* ── Acciones sociales del post ──────────────────────────────── */
function respondPost() {
  if (!F.user) { showAuthModal('login'); return; }
  var anchor = document.getElementById('foro-add-comment');
  if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(function() {
    var ta = document.getElementById('main-comment-ta');
    if (ta) ta.focus();
  }, 420);
}

function sharePost(title) {
  var url = location.origin + '/foro/post/?id=' + (_currentPost ? _currentPost.id : '');
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(function(e) {
      if (e.name !== 'AbortError') copyPostLink(url);
    });
  } else {
    copyPostLink(url);
  }
}

function copyPostLink(url) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() { showToast('¡Enlace copiado!'); });
  } else {
    var ta = document.createElement('textarea');
    ta.value = url; ta.style.position = 'fixed'; ta.style.top = '-9999px';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast('¡Enlace copiado!'); } catch(e) {}
    document.body.removeChild(ta);
  }
}

function showToast(msg) {
  var t = document.getElementById('foro-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'foro-toast'; t.className = 'foro-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function republicarPost() {
  var p = _currentPost;
  if (!p) return;
  if (!F.user) { showAuthModal('login'); return; }
  var lines = (p.body || '').split('\n').slice(0, 4);
  var quote = lines.map(function(l) { return '> ' + l; }).join('\n');
  if ((p.body || '').split('\n').length > 4) quote += '\n> [...]';
  var body = quote + '\n\n';
  location.href = '/foro/nuevo/?title=' + encodeURIComponent('Re: ' + p.title) +
    '&body=' + encodeURIComponent(body);
}

async function editPost() {
  var p = _currentPost;
  if (!p) return;
  if (!F.categories.length) await loadCategories();
  var el = document.getElementById('foro-post-area');
  if (!el) return;
  var catOptions = F.categories.map(function(c) {
    return '<option value="' + c.id + '"' + (c.id === p.category_id ? ' selected' : '') + '>' +
      esc(c.icon) + ' ' + esc(c.name) + '</option>';
  }).join('');
  el.innerHTML =
    '<div class="foro-form-card">' +
    '<p class="foro-section-title" style="margin-bottom:16px">Editar post</p>' +
    '<form onsubmit="handleEditPost(event)">' +
    '<div class="foro-field"><label>Categoría</label>' +
    '<select id="edit-category" class="foro-select">' + catOptions + '</select></div>' +
    '<div class="foro-field"><label>Título</label>' +
    '<input id="edit-title" type="text" required minlength="5" maxlength="200" value="' + esc(p.title) + '"></div>' +
    '<div class="foro-field"><label>Texto</label>' +
    '<textarea id="edit-body" class="foro-textarea" required minlength="10" rows="10">' + esc(p.body) + '</textarea></div>' +
    '<p id="edit-error" class="foro-error" style="min-height:18px"></p>' +
    '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
    '<button class="foro-btn" type="submit" id="edit-save-btn">Guardar cambios</button>' +
    '<button type="button" class="foro-btn-ghost" onclick="initForoPost()">Cancelar</button>' +
    '</div></form></div>';
}

async function handleEditPost(e) {
  e.preventDefault();
  var p = _currentPost;
  if (!p) return;
  var errEl = document.getElementById('edit-error');
  var btn = document.getElementById('edit-save-btn');
  var catId = parseInt(document.getElementById('edit-category').value);
  var title = document.getElementById('edit-title').value.trim();
  var body = document.getElementById('edit-body').value.trim();
  if (title.length < 5) { errEl.textContent = 'El título es demasiado corto (mín. 5 caracteres)'; return; }
  if (body.length < 10) { errEl.textContent = 'El texto es demasiado corto (mín. 10 caracteres)'; return; }
  btn.disabled = true; btn.textContent = 'Guardando…';
  var res = await sb.from('posts').update({ title: title, body: body, category_id: catId }).eq('id', p.id);
  if (res.error) {
    errEl.textContent = 'Error: ' + res.error.message;
    btn.disabled = false; btn.textContent = 'Guardar cambios'; return;
  }
  var cat = F.categories.find(function(c) { return c.id === catId; }) || p.categories;
  _currentPost = Object.assign({}, p, { title: title, body: body, category_id: catId, categories: cat });
  renderFullPost(_currentPost);
  document.title = esc(title) + ' · Foro AJSpinning';
  var galleryEl = document.getElementById('post-images-gallery');
  if (galleryEl && _currentPostImages.length) galleryEl.innerHTML = renderPostGallery(_currentPostImages);
}

async function deletePost(postId) {
  if (!confirm('¿Seguro que quieres eliminar este post? Esta acción no se puede deshacer.')) return;
  var btn = document.querySelector('.foro-delete-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Eliminando…'; }
  var res = await sb.from('posts').delete().eq('id', postId);
  if (res.error) {
    console.warn('[foro] deletePost error:', JSON.stringify(res.error));
    alert('Error al eliminar: ' + res.error.message);
    if (btn) { btn.disabled = false; btn.textContent = '🗑 Eliminar post'; }
    return;
  }
  location.href = '/foro/';
}

/* ── Página: POST INDIVIDUAL ─────────────────────────────────── */
async function initForoPost() {
  var postId = new URLSearchParams(location.search).get('id');
  if (!postId) { location.href = '/foro/'; return; }

  var post = await loadPost(postId);
  if (!post) {
    var area = document.getElementById('foro-post-area');
    if (area) area.innerHTML =
      '<p class="foro-error" style="padding:32px">Post no encontrado o error al cargarlo.' +
      ' Revisa la consola del navegador para ver el error real.</p>';
    return;
  }

  document.title = esc(post.title) + ' · Foro AJSpinning';
  renderFullPost(post);

  var images = await loadPostImages(postId);
  _currentPostImages = images;
  var galleryEl = document.getElementById('post-images-gallery');
  if (galleryEl && images.length) galleryEl.innerHTML = renderPostGallery(images);

  var comments = await loadComments(postId);
  renderCommentList(comments, postId);
  renderCommentForm(postId);
}

function renderFullPost(p) {
  _currentPost = p;
  var el = document.getElementById('foro-post-area');
  if (!el) return;
  var prf = p.profiles || {};
  var cat = p.categories || {};
  var isAuthor = F.user && F.user.id === p.user_id;
  el.innerHTML =
    '<div class="foro-full-post">' +
    (isAuthor
      ? '<div class="foro-author-actions">' +
        '<button class="foro-edit-btn" onclick="editPost()">✏️ Editar</button>' +
        '<button class="foro-delete-btn" onclick="deletePost(\'' + esc(p.id) + '\')">🗑 Eliminar</button>' +
        '</div>'
      : '') +
    '<div class="foro-full-top"><span class="foro-badge">' + esc(cat.icon || '🎣') + ' ' + esc(cat.name || '') + '</span></div>' +
    '<h1 class="foro-full-title">' + esc(p.title) + '</h1>' +
    '<div class="foro-full-meta">' +
    avatarHtml(prf, 'foro-avatar-sm') +
    '<span class="foro-meta-text"><strong>' + esc(userHandle(prf)) + '</strong> · ' + timeAgo(p.created_at) + '</span>' +
    '</div>' +
    '<div class="foro-full-body"><p>' + nl2br(p.body) + '</p></div>' +
    '<div id="post-images-gallery"></div>' +
    '<div class="foro-full-actions" data-vote-wrap>' +
    '<button class="foro-vote-inline" id="post-vote-btn" data-id="' + esc(p.id) + '">▲ <span class="foro-vote-count">' + (p.upvotes || 0) + '</span> votos</button>' +
    '<span class="foro-meta-text">💬 <span id="post-comment-count">' + (p.comment_count || 0) + '</span> comentarios</span>' +
    '</div>' +
    '<div class="foro-post-social">' +
    '<button class="foro-social-btn" onclick="respondPost()">💬 Responder</button>' +
    '<button class="foro-social-btn" onclick="sharePost(' + JSON.stringify(p.title) + ')">🔗 Compartir</button>' +
    '<a class="foro-social-btn foro-whatsapp-btn" href="https://api.whatsapp.com/send?text=' +
      encodeURIComponent(p.title + ' — ' + location.origin + '/foro/post/?id=' + p.id) +
    '" target="_blank" rel="noopener">📲 WhatsApp</a>' +
    '<button class="foro-social-btn" onclick="republicarPost()">🔄 Republicar</button>' +
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
  return (
    '<div class="foro-comment" id="comment-' + esc(c.id) + '">' +
    '<div class="foro-comment-header">' +
    avatarHtml(prf, 'foro-avatar-xs') +
    '<strong class="foro-comment-author">' + esc(userHandle(prf)) + '</strong>' +
    '<span class="foro-meta-text">· ' + timeAgo(c.created_at) + '</span>' +
    '</div>' +
    '<div class="foro-comment-body"><p>' + nl2br(c.body) + '</p></div>' +
    '<div class="foro-comment-actions" data-vote-wrap>' +
    '<button class="foro-vote-btn foro-vote-sm' + (F.votes.has(c.id) ? ' voted' : '') +
    '" data-comment-vote="' + esc(c.id) + '" data-id="' + esc(c.id) + '" title="Votar">▲ <span class="foro-vote-count vc">' + (c.upvotes || 0) + '</span></button>' +
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
  if (el.innerHTML.trim()) { el.innerHTML = ''; return; }
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
    var fakeC = Object.assign({}, res.data, { profiles: F.profile || { username: userName(F.profile) }, upvotes: 0 });
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
      var fakeC = Object.assign({}, res.data, { profiles: F.profile || { username: userName(F.profile) }, upvotes: 0 });
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
  var qp = new URLSearchParams(location.search);
  if (qp.get('title')) {
    var tEl = document.getElementById('post-title');
    if (tEl) tEl.value = qp.get('title');
  }
  if (qp.get('body')) {
    var bEl = document.getElementById('post-body');
    if (bEl) bEl.value = qp.get('body');
  }
  var titleIn = document.getElementById('post-title');
  var charCount = document.getElementById('title-chars');
  if (titleIn && charCount) {
    titleIn.addEventListener('input', function() {
      charCount.textContent = titleIn.value.length;
    });
  }
  initImageUploadInput();
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
    errEl.textContent = 'Error al publicar: ' + res.error;
    btn.disabled = false; btn.textContent = 'Publicar post';
    return;
  }
  if (!res.data) return;
  if (_postImageFiles.length > 0) {
    btn.textContent = 'Subiendo imágenes (0/' + _postImageFiles.length + ')…';
    var imgErr = await uploadPostImages(res.data.id, _postImageFiles, function(done, total) {
      btn.textContent = 'Subiendo imágenes (' + done + '/' + total + ')…';
    });
    if (imgErr) {
      errEl.textContent = imgErr;
      btn.disabled = false; btn.textContent = 'Publicar post';
      return;
    }
  }
  location.href = '/foro/post/?id=' + res.data.id;
}

/* ── Página: PERFIL ──────────────────────────────────────────── */
async function initForoPerfil() {
  var el = document.getElementById('foro-perfil-area');
  if (!el) return;

  if (!F.user) {
    el.innerHTML =
      '<div class="foro-perfil-card" style="text-align:center;padding:48px 24px">' +
      '<p style="color:var(--c-text2);margin-bottom:20px">Debes iniciar sesión para ver tu perfil.</p>' +
      '<button class="foro-btn" onclick="showAuthModal(\'login\')">Entrar</button>' +
      '</div>';
    return;
  }

  renderPerfilForm();
}

function renderPerfilForm() {
  var el = document.getElementById('foro-perfil-area');
  if (!el) return;
  var p = F.profile || {};
  var name = userName(p);
  var col = avatarColor(name);

  var expOptions = [
    ['', '— Nivel de experiencia —'],
    ['beginner',     'Principiante (menos de 1 año)'],
    ['intermediate', 'Intermedio (1–3 años)'],
    ['advanced',     'Avanzado (3–7 años)'],
    ['expert',       'Experto (+7 años)']
  ].map(function(o) {
    return '<option value="' + o[0] + '"' + (p.experience === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
  }).join('');

  el.innerHTML =
    '<div class="foro-perfil-card">' +

    /* Avatar */
    '<div class="foro-perfil-avatar-wrap">' +
    (p.avatar_url
      ? '<img id="perfil-avatar-preview" class="foro-perfil-avatar-img" src="' + esc(p.avatar_url) + '" alt="Avatar">'
      : '<div id="perfil-avatar-preview" class="foro-perfil-avatar-placeholder" style="background:' + col + '">' + esc(avatarChar(name)) + '</div>'
    ) +
    '<label class="foro-avatar-upload-label">' +
    '<input type="file" id="avatar-file-input" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="handleAvatarUpload(event)">' +
    '<span class="foro-avatar-upload-btn">📷 Cambiar foto</span>' +
    '</label>' +
    '<p id="avatar-msg" class="foro-meta-text" style="font-size:11px;margin:4px 0 0;min-height:16px"></p>' +
    '</div>' +

    /* Formulario */
    '<form id="perfil-form" onsubmit="handlePerfilSave(event)">' +

    '<div class="foro-field">' +
    '<label>Nombre público <span class="foro-label-hint">(visible en posts y comentarios · puede tener espacios)</span></label>' +
    '<input id="perfil-display-name" type="text" value="' + esc(p.display_name || '') +
    '" minlength="3" maxlength="40" placeholder="ej: Far del Sud, Jordi Delta, Pescador del Ebro…">' +
    '</div>' +

    '<div class="foro-field">' +
    '<label>Nombre de usuario <span class="foro-label-hint">(identificador único sin espacios)</span></label>' +
    '<input id="perfil-username" type="text" value="' + esc(p.username || '') +
    '" minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+" placeholder="ej: pescador_42" required>' +
    '</div>' +

    '<div class="foro-field">' +
    '<label>Email</label>' +
    '<input type="email" value="' + esc((F.user && F.user.email) || '') + '" disabled class="foro-input-disabled">' +
    '</div>' +

    '<div class="foro-field">' +
    '<label>Bio <span class="foro-label-hint">(breve presentación, máx. 300 caracteres)</span></label>' +
    '<textarea id="perfil-bio" class="foro-textarea" rows="3" maxlength="300" placeholder="Cuéntanos algo sobre ti como pescador…">' + esc(p.bio || '') + '</textarea>' +
    '</div>' +

    '<div class="foro-field">' +
    '<label>Zona habitual de pesca</label>' +
    '<input id="perfil-zone" type="text" value="' + esc(p.fishing_zone || '') +
    '" maxlength="100" placeholder="ej: Ríos del País Vasco, Costa mediterránea…">' +
    '</div>' +

    '<div class="foro-field">' +
    '<label>Especies preferidas</label>' +
    '<input id="perfil-species" type="text" value="' + esc(p.species_prefs || '') +
    '" maxlength="150" placeholder="ej: Trucha, Lucio, Lubina…">' +
    '</div>' +

    '<div class="foro-field">' +
    '<label>Nivel de experiencia</label>' +
    '<select id="perfil-experience" class="foro-select">' + expOptions + '</select>' +
    '</div>' +

    '<p id="perfil-msg" class="foro-error" style="min-height:18px"></p>' +
    '<button class="foro-btn" type="submit" id="perfil-save-btn">Guardar cambios</button>' +
    '</form>' +
    '</div>';
}

async function handlePerfilSave(e) {
  e.preventDefault();
  var msgEl = document.getElementById('perfil-msg');
  var btn = document.getElementById('perfil-save-btn');
  msgEl.textContent = ''; msgEl.className = 'foro-error';
  btn.disabled = true; btn.textContent = 'Guardando…';

  var newUsername = document.getElementById('perfil-username').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (newUsername.length < 3) {
    msgEl.textContent = 'El nombre de usuario necesita mínimo 3 caracteres.';
    btn.disabled = false; btn.textContent = 'Guardar cambios'; return;
  }

  var newDisplayName = (document.getElementById('perfil-display-name').value || '').trim();
  if (newDisplayName && newDisplayName.length < 3) {
    msgEl.textContent = 'El nombre público necesita mínimo 3 caracteres.';
    btn.disabled = false; btn.textContent = 'Guardar cambios'; return;
  }
  if (newDisplayName.length > 40) {
    msgEl.textContent = 'El nombre público no puede superar los 40 caracteres.';
    btn.disabled = false; btn.textContent = 'Guardar cambios'; return;
  }
  if (/[<>{}\[\]\\^`|;=*]/.test(newDisplayName)) {
    msgEl.textContent = 'El nombre público contiene caracteres no permitidos.';
    btn.disabled = false; btn.textContent = 'Guardar cambios'; return;
  }

  var updates = {
    id: F.user.id,
    username: newUsername,
    display_name: newDisplayName || null,
    bio: document.getElementById('perfil-bio').value.trim() || null,
    fishing_zone: document.getElementById('perfil-zone').value.trim() || null,
    species_prefs: document.getElementById('perfil-species').value.trim() || null,
    experience: document.getElementById('perfil-experience').value || null
  };

  var res = await sb.from('profiles').upsert(updates, { onConflict: 'id' });
  if (res.error) {
    msgEl.textContent = res.error.code === '23505' ? 'Ese nombre de usuario ya está en uso.' : res.error.message;
    btn.disabled = false; btn.textContent = 'Guardar cambios'; return;
  }

  F.profile = Object.assign({}, F.profile || {}, updates);
  renderAuthBar();
  msgEl.className = 'foro-success'; msgEl.textContent = '¡Perfil guardado correctamente!';
  btn.disabled = false; btn.textContent = 'Guardar cambios';
  setTimeout(function() { if (msgEl) { msgEl.textContent = ''; msgEl.className = 'foro-error'; } }, 3000);
}

async function handleAvatarUpload(e) {
  var file = e.target.files[0];
  if (!file) return;
  var msgEl = document.getElementById('avatar-msg');

  if (file.size > 2 * 1024 * 1024) {
    msgEl.textContent = 'Máximo 2 MB por imagen.'; msgEl.style.color = '#f87171'; return;
  }
  var allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    msgEl.textContent = 'Solo JPG, PNG o WebP.'; msgEl.style.color = '#f87171'; return;
  }

  msgEl.textContent = 'Subiendo imagen…'; msgEl.style.color = 'var(--c-muted)';

  var ext = file.name.split('.').pop().toLowerCase();
  if (!['jpg','jpeg','png','webp'].includes(ext)) ext = 'jpg';
  var path = F.user.id + '/avatar.' + ext;

  var upRes = await sb.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type
  });
  if (upRes.error) {
    msgEl.textContent = 'Error al subir: ' + upRes.error.message;
    msgEl.style.color = '#f87171'; return;
  }

  var publicUrl = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  /* Cache-bust para forzar recarga si el nombre de archivo es el mismo */
  var displayUrl = publicUrl + '?t=' + Date.now();

  var saveRes = await sb.from('profiles').upsert(
    { id: F.user.id, avatar_url: publicUrl },
    { onConflict: 'id' }
  );
  if (saveRes.error) {
    msgEl.textContent = 'Error guardando URL: ' + saveRes.error.message;
    msgEl.style.color = '#f87171'; return;
  }

  F.profile = Object.assign({}, F.profile || {}, { avatar_url: publicUrl });
  renderAuthBar();

  /* Actualizar preview */
  var preview = document.getElementById('perfil-avatar-preview');
  if (preview) {
    if (preview.tagName === 'IMG') {
      preview.src = displayUrl;
    } else {
      preview.outerHTML = '<img id="perfil-avatar-preview" class="foro-perfil-avatar-img" src="' + esc(displayUrl) + '" alt="Avatar">';
    }
  }
  msgEl.textContent = '¡Avatar actualizado!'; msgEl.style.color = '#22c55e';
  setTimeout(function() { if (msgEl) { msgEl.textContent = ''; } }, 4000);
}

/* ── Entrada principal ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async function() {
  if (!configOk()) {
    var banner = document.createElement('div');
    banner.className = 'foro-setup-banner';
    banner.innerHTML = '⚠️ <strong>Configura Supabase:</strong> Edita <code>/assets/js/foro.js</code> y reemplaza <code>FORO_URL</code> y <code>FORO_KEY</code>.';
    var wrap = document.querySelector('.foro-wrap');
    if (wrap) wrap.insertAdjacentElement('afterbegin', banner);
    return;
  }

  sb = supabase.createClient(FORO_URL, FORO_KEY);
  injectModals();
  await initAuth();

  var page = document.body.dataset.foroPage;
  if (page === 'index')  initForoIndex();
  else if (page === 'post')   initForoPost();
  else if (page === 'nuevo')  initNuevoPost();
  else if (page === 'perfil') initForoPerfil();
});
