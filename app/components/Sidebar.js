'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const menuKeyMap = {
  '/instant-factory': 'instant_campaign',
  '/re-campaigns': 'opc_mass_bridging',
  '/pillar-campaigns': 'pillar_campaign',
  '/content-planner': 'content_planner',
  '/strategic-campaigns': 'strategic_campaign',
  '/products': 'product_database',
  '/deconstruct': 'opc_mass_bridging',
  '/multiplier-lab': 'bridge_injector',
  '/recipe-labs': 'recipe_labs',
  '/product-bridge-inject': 'bridge_injector',
  '/glabs-campaigns': 'instant_campaign',
  '/sheets-autopilot': 'sheets_autopilot',
  '/video-studio': 'ffmpeg_studio',
  '/tts-studio': 'tts_studio',
  '/scraper': 'video_library',
  '/sync': 'system_settings',
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
    window.location.href = '/login';
  };

  const isMenuAllowed = (item) => {
    if (item.href === '/') return true;
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (item.adminOnly) return false;

    const requiredKey = menuKeyMap[item.href];
    if (!requiredKey) return false;

    return Array.isArray(user.menuPermissions) && user.menuPermissions.includes(requiredKey);
  };

  const visibleItems = navItems.filter((item, idx, arr) => {
    if (item.section) {
      const nextSectionIdx = arr.findIndex((x, i) => i > idx && x.section);
      const childItems = arr.slice(idx + 1, nextSectionIdx === -1 ? arr.length : nextSectionIdx);
      return childItems.some(child => !child.section && isMenuAllowed(child));
    }
    return isMenuAllowed(item);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>MAKNA GRID</h1>
        <p>Decoupled Multi-Node Cluster</p>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map((item, i) => {
          if (item.section) {
            return <div key={`sec_${i}`} className="nav-section">{item.section}</div>;
          }

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

      {user && (
        <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
          <div style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '0.5rem' }}>
            Logged in as: <strong style={{ color: '#fff' }}>{user.username}</strong> ({user.role})
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </aside>
  );
}
