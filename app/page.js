'use client';

import Sidebar from './components/Sidebar';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const getBrandBadgeStyle = (accountName) => {
    const acc = (accountName || '').toLowerCase().trim();
    if (acc === 'dummybrand01' || acc.includes('blue') || acc.includes('skincare')) {
      return { background: 'rgba(37, 99, 235, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd' };
    }
    if (acc === 'dummybrand02' || acc.includes('red') || acc.includes('food')) {
      return { background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #ef4444', color: '#fca5a5' };
    }
    if (acc === 'siasatsehat' || acc.includes('sehat') || acc.includes('health')) {
      return { background: 'rgba(5, 150, 105, 0.25)', border: '1px solid #10b981', color: '#6ee7b7' };
    }
    return { background: 'rgba(5, 150, 105, 0.2)', border: '1px solid #10b981', color: '#6ee7b7' };
  };

  const getStatusBadge = (status) => {
    if (status === 'Published') {
      return <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', fontSize: '10px', fontWeight: 700 }}>Published</span>;
    }
    if (status === 'Scheduled') {
      return <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', fontSize: '10px', fontWeight: 700 }}>Scheduled</span>;
    }
    return <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(100, 116, 139, 0.15)', border: '1px solid #475569', color: '#9ca3af', fontSize: '10px', fontWeight: 600 }}>Not Published</span>;
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />

      <main className="main-content" style={{ padding: '28px 32px', background: '#0a0a0c', minHeight: '100vh', color: '#f3f4f6' }}>
        <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                Dashboard
              </h1>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0 0' }}>
                Ringkasan Eksekutif & Akses Cepat MAKNA Grid System
              </p>
            </div>
            <button
              onClick={fetchStats}
              style={{
                padding: '8px 16px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155',
                color: '#cbd5e1', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              🔄 Refresh Stats
            </button>
          </div>

          {/* BARIS 1: 4 EXECUTIVE METRIC CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            {/* Card 1: Content Ready */}
            <div style={{ padding: '18px 20px', borderRadius: '16px', background: '#121318', border: '1px solid #27272a', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block' }}>
                🎬 KONTEN SIAP PUBLISH
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8' }}>{stats?.contentReadyCount ?? '—'}</span>
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>Video Ready</span>
              </div>
            </div>

            {/* Card 2: Active Campaigns */}
            <div style={{ padding: '18px 20px', borderRadius: '16px', background: '#121318', border: '1px solid #27272a', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block' }}>
                🌱 KAMPANYE AKTIF
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>{stats?.activeCampaignCount ?? '—'}</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>OPC & Strategic</span>
              </div>
            </div>

            {/* Card 3: Products Catalog */}
            <div style={{ padding: '18px 20px', borderRadius: '16px', background: '#121318', border: '1px solid #27272a', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block' }}>
                📦 KATALOG PRODUK
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24' }}>{stats?.productCount ?? '—'}</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>SKUs Active</span>
              </div>
            </div>

            {/* Card 4: Server Cluster Health */}
            <div style={{ padding: '18px 20px', borderRadius: '16px', background: '#121318', border: '1px solid #27272a', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block' }}>
                🟢 SERVER CLUSTER
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>3 / 3 Nodes</span>
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>Healthy</span>
              </div>
            </div>
          </div>

          {/* BARIS 2: QUICK ACTION LAUNCHPAD */}
          <div style={{ padding: '20px', borderRadius: '16px', background: '#121318', border: '1px solid #27272a', marginBottom: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              ⚡ QUICK ACTION LAUNCHPAD
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <Link
                href="/content-flow"
                style={{
                  padding: '10px 14px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  color: '#ffffff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)', transition: 'all 0.2s ease', display: 'block'
                }}
              >
                📱 Content Flow
              </Link>
              <Link
                href="/content-planner"
                style={{
                  padding: '10px 14px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155',
                  color: '#f1f5f9', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center',
                  transition: 'all 0.2s ease', display: 'block'
                }}
              >
                📅 + Buat Content Plan
              </Link>
              <Link
                href="/re-campaigns"
                style={{
                  padding: '10px 14px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155',
                  color: '#f1f5f9', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center',
                  transition: 'all 0.2s ease', display: 'block'
                }}
              >
                ⚡ + Buat Kampanye RE
              </Link>
              <Link
                href="/pillar-campaigns"
                style={{
                  padding: '10px 14px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155',
                  color: '#f1f5f9', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center',
                  transition: 'all 0.2s ease', display: 'block'
                }}
              >
                🌱 + Buat Kampanye OPC
              </Link>
            </div>
          </div>

          {/* BARIS 3: RECENT CONTENT (LEFT) & PLATFORM READINESS (RIGHT) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
            {/* Left Box: 5 Recent Content Flow Items */}
            <div style={{ padding: '20px', borderRadius: '16px', background: '#121318', border: '1px solid #27272a', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 700 }}>
                  📱 5 Konten Siap Publish Terbaru
                </span>
                <Link href="/content-flow" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                  Lihat Semua Konten ➔
                </Link>
              </div>

              {loading ? (
                <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', padding: '24px 0' }}>Memuat data...</p>
              ) : !stats?.recentItems || stats.recentItems.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', padding: '24px 0' }}>Belum ada konten di database.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.recentItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px 14px', borderRadius: '10px', background: '#090d16', border: '1px solid #1e293b',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                          ...getBrandBadgeStyle(item.account_name)
                        }}>
                          @{item.account_name || 'Umum'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.hook || 'Tanpa Hook'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {getStatusBadge(item.tiktok_status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Box: Platform Readiness Progress */}
            <div style={{ padding: '20px', borderRadius: '16px', background: '#121318', border: '1px solid #27272a', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 700, display: 'block', marginBottom: '16px' }}>
                  📊 Progress Publikasi Platform
                </span>

                {/* TikTok */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>🎵 TikTok</span>
                    <span style={{ color: '#9ca3af', fontWeight: 600 }}>{stats?.platformStats?.tiktokPct ?? 0}% Published</span>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats?.platformStats?.tiktokPct ?? 0}%`, height: '100%', background: '#38bdf8', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>

                {/* Facebook */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: '#60a5fa', fontWeight: 700 }}>📘 Facebook</span>
                    <span style={{ color: '#9ca3af', fontWeight: 600 }}>{stats?.platformStats?.fbPct ?? 0}% Published</span>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats?.platformStats?.fbPct ?? 0}%`, height: '100%', background: '#60a5fa', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>

                {/* Instagram */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: '#f472b6', fontWeight: 700 }}>📷 Instagram</span>
                    <span style={{ color: '#9ca3af', fontWeight: 600 }}>{stats?.platformStats?.igPct ?? 0}% Published</span>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats?.platformStats?.igPct ?? 0}%`, height: '100%', background: '#f472b6', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '12px', borderRadius: '10px', background: '#090d16', border: '1px solid #1e293b', fontSize: '11px', color: '#9ca3af', lineHeight: 1.5 }}>
                💡 Status publikasi akan ter-update otomatis ketika Anda memperbarui tanggal & permalink di <strong style={{ color: '#fff' }}>ContentFlow Hub</strong>.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
