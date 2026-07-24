/**
 * User Schema & RBAC Tables Initialization for MAKNA Grid
 */

import crypto from 'crypto';

export const ALL_MENU_KEYS = [
  { key: 'strategic_campaign', label: 'Strategic Campaign Generator', category: 'Campaign Generator' },
  { key: 'content_planner', label: 'Content Planner Calendar', category: 'Campaign Generator' },
  { key: 'sheets_autopilot', label: 'Sheets Autopilot Mass Engine', category: 'Campaign Generator' },
  { key: 'opc_mass_bridging', label: 'OPC Mass Bridging', category: 'Campaign Generator' },
  { key: 'recipe_labs', label: 'Recipe Engine Labs', category: 'Campaign Generator' },
  { key: 'bridge_injector', label: 'Bridge Injector & Multiplier', category: 'Campaign Generator' },
  { key: 'instant_campaign', label: 'Instant Video Campaign', category: 'Campaign Generator' },
  { key: 'tts_studio', label: 'TTS Studio (Gemini & MiniMax)', category: 'Audio Studio' },
  { key: 'ffmpeg_studio', label: 'FFmpeg Smart Sync Studio', category: 'Video Studio' },
  { key: 'brand_profiles', label: 'Brand DNA Profiles (Akun Brand)', category: 'Brand Management' },
  { key: 'video_library', label: 'Media & Video Vault', category: 'Asset Vault' },
  { key: 'system_settings', label: 'Pengaturan System & API Keys', category: 'System Administration' }
];

export function hashPassword(password) {
  const salt = 'makna_grid_salt_2026';
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function initUserTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_menu_permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      menu_key TEXT NOT NULL,
      can_read INTEGER DEFAULT 1,
      can_write INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, menu_key)
    );

    CREATE TABLE IF NOT EXISTS user_brands (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      brand_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, brand_id)
    );
  `);

  // Seed default Admin user if no users exist
  const existingUsersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (existingUsersCount === 0) {
    const adminId = 'usr_admin_default';
    const defaultPassword = hashPassword('admin123');
    
    console.log('[User Schema] Seeding default Admin user (username: admin)...');
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `).run(adminId, 'admin', 'admin@makna.grid', defaultPassword);

    // Grant all menu permissions to Admin
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_menu_permissions (id, user_id, menu_key, can_read, can_write)
      VALUES (?, ?, ?, 1, 1)
    `);
    
    for (const menu of ALL_MENU_KEYS) {
      stmt.run(`perm_${adminId}_${menu.key}`, adminId, menu.key);
    }
  }

  // Ensure migration columns exist on campaign & asset tables
  ensureUserAndBrandColumns(db);
}

function ensureUserAndBrandColumns(db) {
  const tablesToMigrate = [
    { table: 'strategic_campaigns', columns: ['user_id TEXT', 'brand_profile_id TEXT'] },
    { table: 'content_planners', columns: ['user_id TEXT', 'brand_profile_id TEXT'] },
    { table: 're_campaigns', columns: ['user_id TEXT', 'brand_profile_id TEXT'] },
    { table: 'sheets_campaigns', columns: ['user_id TEXT', 'brand_profile_id TEXT'] },
    { table: 'recipe_campaigns', columns: ['user_id TEXT', 'brand_profile_id TEXT'] },
    { table: 'bridge_injector_campaigns', columns: ['user_id TEXT', 'brand_profile_id TEXT'] },
    { table: 'brand_profiles', columns: ['created_by_user_id TEXT'] },
    { table: 'tts_studio_batches', columns: ['user_id TEXT'] },
    { table: 'ffmpeg_studio_jobs', columns: ['user_id TEXT'] }
  ];

  for (const item of tablesToMigrate) {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${item.table})`).all();
      const existingColumnNames = tableInfo.map(c => c.name);

      for (const colDef of item.columns) {
        const colName = colDef.split(' ')[0];
        if (!existingColumnNames.includes(colName)) {
          console.log(`[DB Migration] Adding column '${colName}' to table '${item.table}'...`);
          db.prepare(`ALTER TABLE ${item.table} ADD COLUMN ${colDef}`).run();
        }
      }
    } catch (e) {
      // Table might not exist yet if created later in initSchema
    }
  }
}
