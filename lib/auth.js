/**
 * Authentication & Session Management Module for MAKNA Grid (RBAC)
 */

import crypto from 'crypto';
import { getDb } from './db.js';
import { hashPassword, ALL_MENU_KEYS } from './schema/user-schema.js';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'makna_session';
const SESSION_DURATION_DAYS = 7;

export function loginUser(username, password) {
  const db = getDb();
  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  const user = db.prepare("SELECT * FROM users WHERE LOWER(username) = ? AND status = 'active'").get(cleanUsername);
  if (!user) {
    return { success: false, error: 'Username atau password salah' };
  }

  const hashedPassword = hashPassword(cleanPassword);
  if (user.password_hash !== hashedPassword) {
    return { success: false, error: 'Username atau password salah' };
  }

  const session = createSession(user.id);
  return { success: true, user: buildUserObject(db, user), token: session.token, expiresAt: session.expiresAt };
}

export function createSession(userId) {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, userId, token, expiresAt);

  return { token, expiresAt };
}

export function destroySession(token) {
  if (!token) return;
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function buildUserObject(db, user) {
  if (!user) return null;

  let menuPermissions = [];
  if (user.role === 'admin') {
    menuPermissions = ALL_MENU_KEYS.map(m => m.key);
  } else {
    const rows = db.prepare(`
      SELECT menu_key FROM user_menu_permissions
      WHERE user_id = ? AND (can_read = 1 OR can_write = 1)
    `).all(user.id);
    menuPermissions = rows.map(r => r.menu_key);
  }

  const assignedBrands = db.prepare(`
    SELECT ub.brand_id, bp.brand_name FROM user_brands ub
    LEFT JOIN brand_profiles bp ON ub.brand_id = bp.id
    WHERE ub.user_id = ?
  `).all(user.id);
  const brandIds = assignedBrands.map(b => b.brand_id);
  const brandNames = assignedBrands.map(b => b.brand_name).filter(Boolean);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    menuPermissions,
    assignedBrandIds: brandIds,
    assignedBrandNames: brandNames
  };
}

export function getSessionUser(token) {
  if (!token) return null;
  const db = getDb();

  const session = db.prepare(`
    SELECT s.token, s.expires_at, u.id, u.username, u.email, u.role, u.status
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > DATETIME('now') AND u.status = 'active'
  `).get(token);

  if (!session) return null;
  return buildUserObject(db, session);
}

export function getCurrentUser(req) {
  let token = null;

  // 1. Check HTTP Cookies
  const cookiesHeader = req?.headers?.get ? req.headers.get('cookie') : req?.headers?.cookie;
  if (cookiesHeader) {
    const cookies = Object.fromEntries(
      cookiesHeader.split(';').map(c => {
        const [k, v] = c.trim().split('=');
        return [k, decodeURIComponent(v || '')];
      })
    );
    token = cookies[SESSION_COOKIE_NAME];
  }

  // 2. Check Authorization Header fallback
  if (!token) {
    const authHeader = req?.headers?.get ? req.headers.get('authorization') : req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  const db = getDb();
  if (token) {
    const userFromToken = getSessionUser(token);
    if (userFromToken) return userFromToken;
  }

  return null;
}

export function getDataScope(currentUser, filterUserId = null, filterBrandId = null) {
  if (!currentUser) {
    return { isGlobal: true, userId: null, brandIds: [] };
  }

  if (currentUser.role === 'admin') {
    return {
      isGlobal: !filterUserId && !filterBrandId,
      filterUserId: filterUserId || null,
      filterBrandId: filterBrandId || null,
      brandIds: []
    };
  }

  return {
    isGlobal: false,
    filterUserId: currentUser.id,
    filterBrandId: filterBrandId || null,
    brandIds: currentUser.assignedBrandIds || []
  };
}
