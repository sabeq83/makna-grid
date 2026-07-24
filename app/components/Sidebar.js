'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

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
  { label: 'System Health', href: '/system-health', icon: '🩺' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>MAKNA ENGINE</h1>
        <p>AI Content Generator V8.8</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={i} className="nav-section">{item.section}</div>;
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
    </aside>
  );
}
