'use client';

import Sidebar from '../components/Sidebar';
import { useEffect, useState, useCallback } from 'react';

const SearchIcon = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const LayersIcon = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0l-7 7m7-7l-7-7" />
  </svg>
);
const CheckCircleIcon = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ClockIcon = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const AlertCircleIcon = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
  </svg>
);
const RefreshCwIcon = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const FilmIcon = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth="2" />
    <path d="M7 4v16M17 4v16M2 8h20M2 16h20" strokeWidth="2" />
  </svg>
);
const XIcon = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const getBrandBadgeStyle = (accountName) => {
  const acc = (accountName || '').toLowerCase().trim();
  if (acc === 'dummybrand01' || acc.includes('blue') || acc.includes('skincare')) {
    return {
      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
      border: '1px solid #3b82f6',
      color: '#93c5fd',
      boxShadow: '0 2px 10px rgba(59, 130, 246, 0.35)'
    };
  }
  if (acc === 'dummybrand02' || acc.includes('red') || acc.includes('food')) {
    return {
      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(239, 68, 68, 0.25) 100%)',
      border: '1px solid #ef4444',
      color: '#fca5a5',
      boxShadow: '0 2px 10px rgba(239, 68, 68, 0.35)'
    };
  }
  // Fallback Option D (Sleek Emerald Green)
  return {
    background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)',
    border: '1px solid #10b981',
    color: '#6ee7b7',
    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
  };
};

export default function ContentFlowHubPage() {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [tiktokFilter, setTiktokFilter] = useState('Semua');
  const [fbFilter, setFbFilter] = useState('Semua');
  const [igFilter, setIgFilter] = useState('Semua');

  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Detail Modal State
  const [activeItem, setActiveItem] = useState(null);
  const [copiedKeys, setCopiedKeys] = useState({});
  const [editStatusForm, setEditStatusForm] = useState({
    tiktok_status: 'Not Published',
    tiktok_publish_date: '',
    permalink_tiktok: '',
    facebook_status: 'Not Published',
    facebook_publish_date: '',
    permalink_facebook: '',
    instagram_status: 'Not Published',
    instagram_publish_date: '',
    permalink_instagram: '',
    account_name: '',
    drive_link: '',
    nextcloud_url: ''
  });
  const [savingStatus, setSavingStatus] = useState(false);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  }, []);

  const copyToClipboard = useCallback((text, label, key = null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label || 'Teks'} berhasil disalin ke clipboard! 📋`);

    if (key) {
      setCopiedKeys(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedKeys(prev => ({ ...prev, [key]: false }));
      }, 2000);
    }
  }, [showToast]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSourceFilter('all');
    setAccountFilter('all');
    setProductFilter('all');
    setTiktokFilter('Semua');
    setFbFilter('Semua');
    setIgFilter('Semua');
  }, []);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/content-flow?page=1&limit=50&`;
      if (searchTerm.trim()) url += `q=${encodeURIComponent(searchTerm.trim())}&`;
      if (sourceFilter !== 'all') url += `source_type=${encodeURIComponent(sourceFilter)}&`;
      if (accountFilter !== 'all') url += `account=${encodeURIComponent(accountFilter)}&`;
      if (productFilter !== 'all') url += `product=${encodeURIComponent(productFilter)}&`;
      if (tiktokFilter !== 'Semua') url += `tiktok_status=${encodeURIComponent(tiktokFilter)}&`;
      if (fbFilter !== 'Semua') url += `facebook_status=${encodeURIComponent(fbFilter)}&`;
      if (igFilter !== 'Semua') url += `instagram_status=${encodeURIComponent(igFilter)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setTotalItems(data.total_items || 0);
        setAvailableAccounts(data.available_accounts || []);
        setAvailableProducts(data.available_products || []);
      }
    } catch (err) {
      console.error('Failed to load content flow:', err);
      showToast('Gagal memuat konten: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sourceFilter, accountFilter, productFilter, tiktokFilter, fbFilter, igFilter, showToast]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  async function handleTriggerRetroSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/content-flow/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        loadContent();
      } else {
        showToast('Sync error: ' + data.error);
      }
    } catch (err) {
      showToast('Error sync: ' + err.message);
    } finally {
      setSyncing(false);
    }
  }

  function openDetailModal(item) {
    setActiveItem(item);
    setEditStatusForm({
      tiktok_status: item.tiktok_status || 'Not Published',
      tiktok_publish_date: item.tiktok_publish_date || '',
      permalink_tiktok: item.permalink_tiktok || '',
      facebook_status: item.facebook_status || 'Not Published',
      facebook_publish_date: item.facebook_publish_date || '',
      permalink_facebook: item.permalink_facebook || '',
      instagram_status: item.instagram_status || 'Not Published',
      instagram_publish_date: item.instagram_publish_date || '',
      permalink_instagram: item.permalink_instagram || '',
      account_name: item.account_name || '',
      drive_link: item.drive_link || '',
      nextcloud_url: item.nextcloud_url || ''
    });
  }

  async function handleSaveStatus(e) {
    if (e) e.preventDefault();
    if (!activeItem) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/content-flow/${activeItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editStatusForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Status publishing berhasil diperbarui! ✨');
        setActiveItem(null);
        loadContent();
      } else {
        showToast('Gagal update: ' + data.error);
      }
    } catch (err) {
      showToast('Error update: ' + err.message);
    } finally {
      setSavingStatus(false);
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Published':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '11px', fontWeight: 600
          }}>
            <CheckCircleIcon style={{ width: 12, height: 12, color: '#34d399' }} /> Published
          </span>
        );
      case 'Scheduled':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '11px', fontWeight: 600
          }}>
            <ClockIcon style={{ width: 12, height: 12, color: '#fbbf24' }} /> Scheduled
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px',
            background: 'rgba(39, 39, 42, 0.8)', color: '#9ca3af', border: '1px solid rgba(63, 63, 70, 0.8)',
            fontSize: '11px', fontWeight: 500
          }}>
            <AlertCircleIcon style={{ width: 12, height: 12, color: '#9ca3af' }} /> Not Published
          </span>
        );
    }
  };

  const getSourceBadge = (sourceType) => {
    const badges = {
      opc: { label: 'OPC Pillar', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
      strategic: { label: 'Strategic (SC)', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.35)' },
      re: { label: 'Reverse Eng (RE)', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
      instant: { label: 'Instant Factory', bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' },
      recipe: { label: 'Recipe Labs', bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' },
      bridge: { label: 'Bridge Injector', bg: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: 'rgba(6, 182, 212, 0.3)' }
    };
    const b = badges[sourceType] || badges.opc;
    return (
      <span style={{
        padding: '3px 9px', borderRadius: '12px', background: b.bg, color: b.color,
        border: `1px solid ${b.border}`, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase'
      }}>
        {b.label}
      </span>
    );
  };

  const publishedCount = items.filter(
    (i) => i.tiktok_status === 'Published' || i.facebook_status === 'Published' || i.instagram_status === 'Published'
  ).length;
  const scheduledCount = items.filter(
    (i) => i.tiktok_status === 'Scheduled' || i.facebook_status === 'Scheduled' || i.instagram_status === 'Scheduled'
  ).length;

  return (
    <div className="layout-with-sidebar">
      <Sidebar />

      <main className="main-content" style={{ padding: '28px 32px', background: '#0a0a0c', minHeight: '100vh', color: '#f3f4f6' }}>
        {/* Centered Main Container (1050px) setara OPC / RE */}
        <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
          {/* Toast Notification */}
          {toastMsg && (
            <div style={{
              position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
              padding: '12px 24px', borderRadius: '12px', background: '#2563eb',
              color: '#fff', fontWeight: 600, fontSize: '14px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(96, 165, 250, 0.4)'
            }}>
              <CheckCircleIcon style={{ width: 16, height: 16 }} />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Top Control Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', color: '#fff' }}>
                  <LayersIcon style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    ContentFlow Publishing Tracker Hub
                  </h1>
                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: '2px 0 0' }}>
                    Pusat pemantauan & manajemen status tayang konten media sosial dari seluruh mesin kampanye MAKNA Grid.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleTriggerRetroSync}
                disabled={syncing}
                style={{
                  padding: '10px 18px', background: syncing ? '#1e293b' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#fff', border: '1px solid #10b981', borderRadius: '10px', fontWeight: 700, cursor: syncing ? 'not-allowed' : 'pointer',
                  fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <RefreshCwIcon style={{ width: 14, height: 14, animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                <span>{syncing ? '⏳ Menyinkronkan...' : '🔄 Sync Seluruh Aset Kampanye'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(18, 19, 24, 0.8)', border: '1px solid #27272a' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, display: 'block' }}>Total Konten Terindeks</span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff' }}>{totalItems}</span>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Video Items</span>
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600, display: 'block' }}>Telah Publish</span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#34d399' }}>{publishedCount}</span>
                <span style={{ fontSize: '11px', color: '#059669', fontFamily: 'monospace' }}>Completed</span>
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600, display: 'block' }}>Terjadwal (Scheduled)</span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#fbbf24' }}>{scheduledCount}</span>
                <span style={{ fontSize: '11px', color: '#d97706', fontFamily: 'monospace' }}>Queue</span>
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(18, 19, 24, 0.8)', border: '1px solid #27272a' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, display: 'block' }}>Produk Aktif</span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#60a5fa' }}>{availableProducts.length}</span>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Skus</span>
              </div>
            </div>
          </div>

          {/* Multi-level Search & Filter Panel */}
          <div style={{ padding: '20px', borderRadius: '16px', background: '#121318', border: '1px solid #27272a', marginBottom: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            {/* Row 1: Universal Search & Metadata Filters (4 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
              {/* Universal Search */}
              <div style={{ position: 'relative' }}>
                <SearchIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari ID Video, Hook, Produk, Caption..."
                  style={{
                    width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', background: '#09090b',
                    border: '1px solid #3f3f46', color: '#fff', fontSize: '12px', outline: 'none'
                  }}
                />
              </div>

              {/* Campaign Source Type Filter */}
              <div>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', background: '#09090b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: '12px', outline: 'none' }}
                >
                  <option value="all">Semua Sumber Kampanye (All)</option>
                  <option value="opc">🌱 OPC (Organic Pillar)</option>
                  <option value="strategic">🎯 Strategic Campaign</option>
                  <option value="re">🔄 Reverse Engineering</option>
                  <option value="instant">⚡ Instant Factory</option>
                  <option value="recipe">🧪 Recipe Labs</option>
                  <option value="bridge">🔗 Bridge Injector</option>
                </select>
              </div>

              {/* Account Filter */}
              <div>
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', background: '#09090b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: '12px', outline: 'none' }}
                >
                  <option value="all">Semua Akun Brand ({availableAccounts.length})</option>
                  {availableAccounts.map(acc => (
                    <option key={acc} value={acc}>@{acc}</option>
                  ))}
                </select>
              </div>

              {/* Product Filter */}
              <div>
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', background: '#09090b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: '12px', outline: 'none' }}
                >
                  <option value="all">Semua Produk ({availableProducts.length})</option>
                  {availableProducts.map(prod => (
                    <option key={prod} value={prod}>{prod}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Platform Status Filters + Reset Button (4 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', paddingTop: '14px', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
              <div>
                <select
                  value={tiktokFilter}
                  onChange={(e) => setTiktokFilter(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#09090b', border: '1px solid #3f3f46', color: '#d4d4d8', fontSize: '12px', outline: 'none' }}
                >
                  <option value="Semua">🎵 Semua TikTok Status</option>
                  <option value="Not Published">Not Published</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div>
                <select
                  value={fbFilter}
                  onChange={(e) => setFbFilter(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#09090b', border: '1px solid #3f3f46', color: '#d4d4d8', fontSize: '12px', outline: 'none' }}
                >
                  <option value="Semua">📘 Semua Facebook Status</option>
                  <option value="Not Published">Not Published</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div>
                <select
                  value={igFilter}
                  onChange={(e) => setIgFilter(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#09090b', border: '1px solid #3f3f46', color: '#d4d4d8', fontSize: '12px', outline: 'none' }}
                >
                  <option value="Semua">📷 Semua Instagram Status</option>
                  <option value="Not Published">Not Published</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                    background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s ease'
                  }}
                >
                  🔄 Reset Filter
                </button>
              </div>
            </div>
          </div>

          {/* Content Items 1-Column Feed */}
          {loading ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }}></div>
              <p>Memuat item konten dari SQLite Database...</p>
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', background: '#121318', borderRadius: '16px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
              <h3 style={{ fontSize: '18px', color: '#fff', margin: '0 0 8px' }}>Tidak Ada Konten Ditemukan</h3>
              <p style={{ color: '#9ca3af', fontSize: '13px', maxWidth: '420px', margin: '0 auto 20px' }}>
                Tidak ada konten yang sesuai dengan filter atau pencarian Anda. Klik tombol Sync untuk menyinkronkan seluruh kampanye.
              </p>
              <button
                onClick={handleTriggerRetroSync}
                style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
              >
                🔄 Refresh & Sync Database
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#0d1322', border: '1px solid #1e293b', borderRadius: '16px',
                    padding: '16px 20px', display: 'grid', gridTemplateColumns: '220px 1fr 240px', gap: '20px',
                    alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.45)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1e293b'}
                >
                  {/* Column 1: Thumbnail & Cloud Links */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                      position: 'relative', width: '100%', height: '124px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                        <FilmIcon style={{ width: 20, height: 20 }} />
                      </div>

                      <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2 }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #3b82f6', color: '#60a5fa', fontSize: '10px', fontWeight: 700, fontFamily: 'monospace' }}>
                          {item.video_id}
                        </span>
                      </div>
                    </div>

                    {/* Single Priority Cloud Asset Link Button */}
                    <div style={{ width: '100%' }}>
                      {item.drive_link ? (
                        <a
                          href={item.drive_link}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'block', width: '100%', textAlign: 'center', padding: '6px 10px',
                            borderRadius: '8px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            color: '#ffffff', fontSize: '11px', fontWeight: 700, textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)', transition: 'all 0.2s ease'
                          }}
                          title="Buka Folder Google Drive"
                        >
                          📁 Google Drive
                        </a>
                      ) : item.nextcloud_url ? (
                        <a
                          href={item.nextcloud_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'block', width: '100%', textAlign: 'center', padding: '6px 10px',
                            borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                            color: '#ffffff', fontSize: '11px', fontWeight: 700, textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)', transition: 'all 0.2s ease'
                          }}
                          title="Buka Folder Nextcloud"
                        >
                          ☁️ Nextcloud
                        </a>
                      ) : item.url_asset ? (
                        <a
                          href={item.url_asset}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'block', width: '100%', textAlign: 'center', padding: '6px 10px',
                            borderRadius: '8px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            color: '#ffffff', fontSize: '11px', fontWeight: 700, textDecoration: 'none'
                          }}
                        >
                          📥 Download Asset
                        </a>
                      ) : (
                        <span
                          style={{
                            display: 'block', width: '100%', textAlign: 'center', padding: '6px 10px',
                            borderRadius: '8px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155',
                            color: '#64748b', fontSize: '11px', fontWeight: 600
                          }}
                        >
                          🔒 Asset Kosong
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Content Details & Monospace Caption */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                    {/* Top Row: Prominent Brand Header & Metadata Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {item.account_name && (
                        <span style={{
                          fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '8px',
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          ...getBrandBadgeStyle(item.account_name)
                        }}>
                          🏷️ @{item.account_name}
                        </span>
                      )}
                      {getSourceBadge(item.source_type)}
                      {item.nama_produk && (
                        <span style={{ fontSize: '11px', color: '#e2e8f0', background: '#1e293b', padding: '2px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                          📦 {item.nama_produk}
                        </span>
                      )}
                      {item.production_date && (
                        <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: 'auto', fontFamily: 'monospace' }}>
                          📅 {new Date(item.production_date).toISOString().split('T')[0]}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.4 }}>
                      {item.hook || 'Tanpa Hook'}
                    </h3>

                    {/* Monospace Caption Block with Copy Button */}
                    <div style={{ position: 'relative', background: '#05070d', borderRadius: '8px', border: '1px solid #1e293b', padding: '8px 12px' }}>
                      <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#cbd5e1', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '90px' }}>
                        {item.caption || '(Tidak ada caption)'}
                      </p>
                      {item.caption && (
                        <button
                          onClick={() => copyToClipboard(item.caption, 'Caption', `card_caption_${item.id}`)}
                          style={{
                            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                            padding: '4px 10px', borderRadius: '6px',
                            background: copiedKeys[`card_caption_${item.id}`] ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : '#1e293b',
                            border: `1px solid ${copiedKeys[`card_caption_${item.id}`] ? '#10b981' : '#334155'}`,
                            color: '#ffffff', fontSize: '11px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease'
                          }}
                        >
                          {copiedKeys[`card_caption_${item.id}`] ? '✓ Copied!' : '📋 Copy'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Platform Status & Action Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', height: '100%', borderLeft: '1px solid #1e293b', paddingLeft: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>🎵 TikTok</span>
                        {getStatusBadge(item.tiktok_status)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: '#60a5fa', fontWeight: 700 }}>📘 Facebook</span>
                        {getStatusBadge(item.facebook_status)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: '#f472b6', fontWeight: 700 }}>📷 Instagram</span>
                        {getStatusBadge(item.instagram_status)}
                      </div>
                    </div>

                    <button
                      onClick={() => openDetailModal(item)}
                      style={{
                        width: '100%', padding: '9px 14px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                        color: '#ffffff', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)', transition: 'all 0.2s ease'
                      }}
                    >
                      Detail & Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Modal Detail & Update Status */}
        {activeItem && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
          }}>
            <div style={{
              background: '#0d1322', border: '1px solid #1e293b', borderRadius: '16px',
              width: '100%', maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto', padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <span style={{
                    padding: '5px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #3b82f6',
                    color: '#60a5fa', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, flexShrink: 0
                  }}>
                    {activeItem.video_id}
                  </span>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeItem.hook}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveItem(null)}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                >
                  <XIcon style={{ width: 22, height: 22 }} />
                </button>
              </div>

              {/* 4 Action Buttons Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeItem.caption, 'Caption', `modal_caption_${activeItem.id}`)}
                  disabled={!activeItem.caption}
                  style={{
                    padding: '10px 14px', borderRadius: '10px',
                    background: copiedKeys[`modal_caption_${activeItem.id}`] ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : activeItem.caption ? '#1e293b' : 'rgba(30, 41, 59, 0.5)',
                    border: copiedKeys[`modal_caption_${activeItem.id}`] ? '1px solid #10b981' : '1px solid #334155',
                    color: activeItem.caption ? '#f1f5f9' : '#64748b', fontWeight: 600, fontSize: '13px',
                    cursor: activeItem.caption ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copiedKeys[`modal_caption_${activeItem.id}`] ? '✓ Copied!' : '📋 Copy Caption'}
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(activeItem.link_affiliate, 'Link Affiliate', `modal_affiliate_${activeItem.id}`)}
                  disabled={!activeItem.link_affiliate}
                  style={{
                    padding: '10px 14px', borderRadius: '10px',
                    background: copiedKeys[`modal_affiliate_${activeItem.id}`] ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : activeItem.link_affiliate ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(30, 41, 59, 0.5)',
                    border: copiedKeys[`modal_affiliate_${activeItem.id}`] ? '1px solid #10b981' : activeItem.link_affiliate ? '1px solid #818cf8' : '1px solid #334155',
                    color: activeItem.link_affiliate ? '#ffffff' : '#64748b', fontWeight: 700, fontSize: '13px',
                    cursor: activeItem.link_affiliate ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    boxShadow: activeItem.link_affiliate ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copiedKeys[`modal_affiliate_${activeItem.id}`] ? '✓ Copied!' : '📋 Copy Affiliate Link'}
                </button>

                {activeItem.link_produk ? (
                  <a
                    href={activeItem.link_produk}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '10px 14px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                      border: '1px solid #38bdf8', color: '#ffffff', fontWeight: 700, fontSize: '13px',
                      textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
                    }}
                  >
                    🔗 Buka Link Produk
                  </a>
                ) : (
                  <button
                    disabled
                    style={{
                      padding: '10px 14px', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid #334155', color: '#64748b', fontWeight: 600, fontSize: '13px',
                      cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    🔗 Tanpa Link Produk
                  </button>
                )}

                {activeItem.url_asset || activeItem.drive_link || activeItem.nextcloud_url ? (
                  <a
                    href={activeItem.url_asset || activeItem.drive_link || activeItem.nextcloud_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '10px 14px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      border: '1px solid #10b981', color: '#ffffff', fontWeight: 700, fontSize: '13px',
                      textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    📥 Asset Ready
                  </a>
                ) : (
                  <button
                    disabled
                    style={{
                      padding: '10px 14px', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid #334155', color: '#64748b', fontWeight: 600, fontSize: '13px',
                      cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    📥 Asset Kosong
                  </button>
                )}
              </div>

              {/* Metadata Panel */}
              <div style={{ background: '#090d16', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Nama Produk:</span>
                    <strong style={{ fontSize: '13px', color: '#ffffff' }}>{activeItem.nama_produk || 'Umum'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Production Date:</span>
                    <strong style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'monospace' }}>
                      {activeItem.production_date ? new Date(activeItem.production_date).toISOString().split('T')[0] : 'N/A'}
                    </strong>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Caption:</span>
                  <div style={{
                    fontSize: '12px', fontFamily: 'monospace', color: '#cbd5e1', background: '#05070d',
                    padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', whiteSpace: 'pre-wrap',
                    maxHeight: '140px', overflowY: 'auto', lineHeight: '1.6'
                  }}>
                    {activeItem.caption || '(Tidak ada caption)'}
                  </div>
                </div>
              </div>

              {/* Sub-Header */}
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                STATUS PUBLIKASI PER PLATFORM
              </h3>

              <form onSubmit={handleSaveStatus} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* TikTok Controls */}
                <div style={{ background: '#090d16', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📱 TIKTOK
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px', alignItems: 'center' }}>
                    <div style={{ gridColumn: 'span 4' }}>
                      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Status</label>
                      <select
                        value={editStatusForm.tiktok_status}
                        onChange={(e) => setEditStatusForm({ ...editStatusForm, tiktok_status: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', background: '#05070d', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      >
                        <option value="Not Published">Not Published</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Published">Published</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: 'span 4' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>Publish Date</label>
                        <button
                          type="button"
                          onClick={() => setEditStatusForm({ ...editStatusForm, tiktok_publish_date: new Date().toISOString().split('T')[0] })}
                          style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '10px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          Hari Ini
                        </button>
                      </div>
                      <input
                        type="date"
                        value={editStatusForm.tiktok_publish_date}
                        onChange={(e) => setEditStatusForm({ ...editStatusForm, tiktok_publish_date: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', background: '#05070d', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', colorScheme: 'dark' }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 4' }}>
                      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Permalink TikTok</label>
                      <input
                        type="text"
                        value={editStatusForm.permalink_tiktok}
                        onChange={(e) => setEditStatusForm({ ...editStatusForm, permalink_tiktok: e.target.value })}
                        placeholder="https://tiktok.com/@..."
                        style={{ width: '100%', padding: '8px 10px', background: '#05070d', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Facebook Controls */}
                <div style={{ background: '#090d16', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📘 FACEBOOK
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px', alignItems: 'center' }}>
                    <div style={{ gridColumn: 'span 4' }}>
                      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Status</label>
                      <select
                        value={editStatusForm.facebook_status}
                        onChange={(e) => setEditStatusForm({ ...editStatusForm, facebook_status: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', background: '#05070d', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      >
                        <option value="Not Published">Not Published</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Published">Published</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: 'span 4' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>Publish Date</label>
                        <button
                          type="button"
                          onClick={() => setEditStatusForm({ ...editStatusForm, facebook_publish_date: new Date().toISOString().split('T')[0] })}
                          style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '10px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          Hari Ini
                        </button>
                      </div>
                      <input
                        type="date"
                        value={editStatusForm.facebook_publish_date}
                        onChange={(e) => setEditStatusForm({ ...editStatusForm, facebook_publish_date: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', background: '#05070d', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', colorScheme: 'dark' }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 4' }}>
                      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Permalink FB</label>
                      <input
                        type="text"
                        value={editStatusForm.permalink_facebook}
                        onChange={(e) => setEditStatusForm({ ...editStatusForm, permalink_facebook: e.target.value })}
                        placeholder="https://facebook.com/..."
                        style={{ width: '100%', padding: '8px 10px', background: '#05070d', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Instagram Controls */}
                <div style={{ background: '#090d16', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f472b6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📷 INSTAGRAM
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px', alignItems: 'center' }}>
                    <div style={{ gridColumn: 'span 4' }}>
                      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Status</label>
                      <select
                        value={editStatusForm.instagram_status}
                        onChange={(e) => setEditStatusForm({ ...editStatusForm, instagram_status: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', background: '#05070d', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      >
                        <option value="Not Published">Not Published</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Published">Published</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: 'span 4' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>Publish Date</label>
                        <button
                          type="button"
                          onClick={() => setEditStatusForm({ ...editStatusForm, instagram_publish_date: new Date().toISOString().split('T')[0] })}
                          style={{ background: 'none', border: 'none', color: '#f472b6', fontSize: '10px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          Hari Ini
                        </button>
                      </div>
                      <input
                        type="date"
                        value={editStatusForm.instagram_publish_date}
                        onChange={(e) => setEditStatusForm({ ...editStatusForm, instagram_publish_date: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', background: '#05070d', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', colorScheme: 'dark' }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 4' }}>
                      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Permalink Instagram</label>
                      <input
                        type="text"
                        value={editStatusForm.permalink_instagram}
                        onChange={(e) => setEditStatusForm({ ...editStatusForm, permalink_instagram: e.target.value })}
                        placeholder="https://instagram.com/p/..."
                        style={{ width: '100%', padding: '8px 10px', background: '#05070d', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer Submit Bar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    style={{ padding: '10px 18px', background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingStatus}
                    style={{
                      padding: '10px 22px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                      border: 'none', color: '#ffffff', borderRadius: '10px', fontWeight: 700,
                      cursor: savingStatus ? 'not-allowed' : 'pointer', fontSize: '13px',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                    }}
                  >
                    {savingStatus ? 'Menyimpan...' : '💾 Simpan Perubahan Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
