'use client';

import Sidebar from './components/Sidebar';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) { console.error(e); }
  }

  async function seedKBs() {
    setSeeding(true);
    try {
      const res = await fetch('/api/kb/seed', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Done!');
      fetchStats();
    } catch (e) { alert('Error: ' + e.message); }
    setSeeding(false);
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header">
            <h2>Dashboard</h2>
            <p>MAKNA AI Video Content Generator v54.9 — Command Center</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Knowledge Bases</div>
              <div className="stat-value accent">{stats?.kbCount ?? '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Products Extracted</div>
              <div className="stat-value info">{stats?.productCount ?? '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pipeline Runs</div>
              <div className="stat-value warning">{stats?.pipelineCount ?? '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">RE Results</div>
              <div className="stat-value success">{stats?.reverseCount ?? '—'}</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-title"><span className="icon">🚀</span> Quick Start — Pipeline v54.9</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.7' }}>
              Selamat datang di <strong>MAKNA Engine v54.9</strong>. Pipeline 5-stage untuk konten video:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 }}>1</span>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Setup KB & API Key</strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Settings → Load Knowledge Base + Gemini API Key</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 }}>2</span>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Open Pipeline v54.9</strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Extract produk → Auto hot trend → Narration → Visual → T2I/I2V/T2V prompts</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 }}>3</span>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Copy & Generate</strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Copy T2V prompts langsung ke AI video generator favorit kamu</p>
                </div>
              </div>
            </div>
          </div>

          {stats?.kbCount === 0 && (
            <div className="card">
              <div className="card-title"><span className="icon">📚</span> Seed Knowledge Base</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                Kami mendeteksi 11 file Knowledge Base di folder <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-glass)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>kb-seeds/</code>. Klik tombol di bawah untuk memuat semuanya ke database.
              </p>
              <button className="btn btn-primary" onClick={seedKBs} disabled={seeding}>
                {seeding ? '⏳ Loading...' : '📥 Load Knowledge Bases'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
