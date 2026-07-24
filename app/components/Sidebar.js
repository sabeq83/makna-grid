'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const menuKeyMap = {
  '/instant-factory': 'instant_campaign',
  '/re-campaigns': 'opc_mass_bridging',
  '/pillar-campaigns': 'strategic_campaign',
  '/content-planner': 'content_planner',
  '/strategic-campaigns': 'strategic_campaign',
  '/products': 'strategic_campaign',
  '/deconstruct': 'opc_mass_bridging',
  '/multiplier-lab': 'bridge_injector',
  '/recipe-labs': 'recipe_labs',
  '/product-bridge-inject': 'bridge_injector',
  '/glabs-campaigns': 'instant_campaign',
  '/sheets-autopilot': 'sheets_autopilot',
  '/video-studio': 'ffmpeg_studio',
  '/tts-studio': 'tts_studio',
  '/scraper': 'video_library',
  '/settings/brand-profiles': 'brand_profiles',
  '/settings/users': 'admin_only',
  '/settings': 'system_settings',
  '/system-health': 'system_settings'
};

const navItems = [
  { label: 'Dashboard', href: '/', icon: '◈' },
  { section: 'WORKFLOW' },
  { label: 'Instant Factory', href: '/instant-factory', icon: '🚀' },
  { label: 'RE Campaign', href: '/re-campaigns', icon: '🎬' },
  { label: 'Organic Pillar', href: '/pillar-campaigns', icon: '🌱' },
  { label: 'Content Planner', href: '/content-planner', icon: '🗓️' },
  { label: 'Strategic Campaign', href: '/strategic-campaigns', icon: '🎯' },
  { label: 'Product Database', href: '/products', icon: '📦' },
  { label: 'Deconstruct Lab', href: '/deconstruct', icon: '🔬' },
  { label: 'Multiplier Lab', href: '/multiplier-lab', icon: '🎛️' },
  { label: 'Recipe Labs', href: '/recipe-labs', icon: '🍳' },
  { label: 'Product Bridging', href: '/product-bridge-inject', icon: '🎯' },
  { label: 'G Labs Campaign', href: '/glabs-campaigns', icon: '🎥' },
  { label: 'Sheets Autopilot', href: '/sheets-autopilot', icon: '🤖' },
  { section: 'TOOLS' },
  { label: 'Video Studio', href: '/video-studio', icon: '🎞' },
  { label: 'TTS Studio', href: '/tts-studio', icon: '🎙' },
  { label: 'Video Library', href: '/scraper', icon: '📼' },
  { label: 'MAKNA Hub Sync', href: '/sync', icon: '☁️' },
  { section: 'SYSTEM' },
  { label: 'Brand DNA', href: '/settings/brand-profiles', icon: '🧬' },
  { label: 'User Management', href: '/settings/users', icon: '👥', adminOnly: true },
  { label: 'System Health', href: '/system-health', icon: '🩺' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(err => console.error('[Sidebar Auth Check Failed]', err))
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  const isMenuAllowed = (item) => {
    if (item.href === '/') return true;
    if (!user) return true; // Default fallback if auth is not initialized
    if (user.role === 'admin') return true;

    if (item.adminOnly) return false;
    const requiredKey = menuKeyMap[item.href];
    if (!requiredKey) return true;

    return user.menuPermissions && user.menuPermissions.includes(requiredKey);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>MAKNA GRID</h1>
        <p>Decoupled Multi-Node Cluster</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={i} className="nav-section">{item.section}</div>;
          }

          if (!isMenuAllowed(item)) return null;

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Auth Footer */}
      <div className="sidebar-user-footer" style={{
        marginTop: 'auto',
        padding: '12px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                👤 {user.username}
              </div>
              <div style={{ fontSize: '0.7rem', color: user.role === 'admin' ? '#38bdf8' : '#94a3b8', textTransform: 'uppercase' }}>
                Role: {user.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            style={{
              display: 'block',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            🔐 Sign In / Login
          </Link>
        )}
      </div>
    </aside>
  );
}
