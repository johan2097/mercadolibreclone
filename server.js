const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PORT = Number(process.env.PORT || 3000);
const sessions = new Map();
const attempts = new Map();
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', { mode: 0o600 });
const readUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const saveUsers = users => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { mode: 0o600 });
const safeUser = u => ({ id: u.id, name: u.name, email: u.email });
function send(res, status, data, extra = {}) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }); res.end(JSON.stringify(data)); }
function cookie(req, key) { const part = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(key + '=')); return part ? decodeURIComponent(part.slice(key.length + 1)) : ''; }
function setSession(res, userId) { const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, { userId, created: Date.now() }); const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''; res.setHeader('Set-Cookie', `cf_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`); }
function currentUser(req) { const token = cookie(req, 'cf_session'), s = sessions.get(token); if (!s) return null; if (Date.now() - s.created > 7 * 86400000) { sessions.delete(token); return null; } return readUsers().find(u => u.id === s.userId) || null; }
function readBody(req) { return new Promise((resolve, reject) => { let body = ''; req.on('data', chunk => { body += chunk; if (body.length > 20_000) { reject(new Error('Solicitud demasiado grande')); req.destroy(); } }); req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Formato de solicitud inválido')); } }); req.on('error', reject); }); }
function rateLimited(req) { const ip = req.socket.remoteAddress || 'unknown', now = Date.now(), recent = (attempts.get(ip) || []).filter(t => now - t < 10 * 60_000); recent.push(now); attempts.set(ip, recent); return recent.length > 20; }
async function handleApi(req, res, url) {
  if (url.pathname === '/api/me' && req.method === 'GET') { const u = currentUser(req); return u ? send(res, 200, { user: safeUser(u) }) : send(res, 401, { error: 'No has iniciado sesión.' }); }
  if (url.pathname === '/api/logout' && req.method === 'POST') { sessions.delete(cookie(req, 'cf_session')); return send(res, 200, { ok: true }, { 'Set-Cookie': 'cf_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' }); }
  if ((url.pathname === '/api/register' || url.pathname === '/api/login') && req.method === 'POST') {
    if (rateLimited(req)) return send(res, 429, { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
    let body; try { body = await readBody(req); } catch (e) { return send(res, 400, { error: e.message }); }
    const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: 'Escribe un correo electrónico válido.' });
    if (password.length < 8 || password.length > 200) return send(res, 400, { error: 'La contraseña debe tener entre 8 y 200 caracteres.' });
    const users = readUsers(); let user;
    if (url.pathname === '/api/register') {
      const name = String(body.name || '').trim();
      if (name.length < 2 || name.length > 80) return send(res, 400, { error: 'Escribe tu nombre (entre 2 y 80 caracteres).' });
      if (users.some(u => u.email === email)) return send(res, 409, { error: 'Ya existe una cuenta con ese correo. Ingresa o utiliza otro correo.' });
      const salt = crypto.randomBytes(16).toString('hex'); const hash = await scrypt(password, salt, 64);
      user = { id: crypto.randomUUID(), name, email, salt, passwordHash: hash.toString('hex'), createdAt: new Date().toISOString() }; users.push(user); saveUsers(users);
    } else {
      user = users.find(u => u.email === email);
      if (!user) return send(res, 401, { error: 'Correo o contraseña incorrectos.' });
      const hash = await scrypt(password, user.salt, 64);
      const a = Buffer.from(hash.toString('hex'), 'hex'), b = Buffer.from(user.passwordHash, 'hex');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(res, 401, { error: 'Correo o contraseña incorrectos.' });
    }
    setSession(res, user.id); return send(res, 200, { user: safeUser(user) });
  }
  send(res, 404, { error: 'Ruta no encontrada.' });
}
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) { try { await handleApi(req, res, url); } catch (e) { console.error(e); if (!res.headersSent) send(res, 500, { error: 'Ocurrió un error del servidor.' }); } return; }
  let pathname = decodeURIComponent(url.pathname); if (pathname === '/') pathname = '/index.html';
  const target = path.resolve(ROOT, '.' + pathname);
  if (!target.startsWith(ROOT + path.sep) || target === USERS_FILE || target.startsWith(DATA_DIR + path.sep)) return send(res, 403, { error: 'Acceso denegado.' });
  fs.readFile(target, (err, data) => { if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('No encontrado'); return; } res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' }); res.end(data); });
});
server.listen(PORT, '127.0.0.1', () => console.log(`CompraFácil lista en http://localhost:${PORT}`));
