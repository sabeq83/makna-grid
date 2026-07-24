'use client';

import { useState, useEffect } from 'react';

const GEMINI_VOICES = [
  { id: 'Kore', name: 'Kore (Female)', avatar: '👩', desc: 'Standard Female (Skincare/Cosmetic)' },
  { id: 'Fenrir', name: 'Fenrir (Male)', avatar: '🧔', desc: 'Deep/Heavy Male (Otomotif/High-End)' },
  { id: 'Puck', name: 'Puck (Male)', avatar: '👦', desc: 'Ceria, Playful (Makanan/Promo Kilat)' },
  { id: 'Charon', name: 'Charon (Male)', avatar: '👨', desc: 'Formal, News Style (Review Tech/Finansial)' },
  { id: 'Leda', name: 'Leda (Female)', avatar: '👵', desc: 'Hangat, Ramah (Edukasi/Ibu Anak)' },
  { id: 'Zephyr', name: 'Zephyr (Male)', avatar: '👨‍🦱', desc: 'Kasual, Santai (Storytelling/Daily Vlog)' },
  { id: 'Orus', name: 'Orus (Male)', avatar: '🧔', desc: 'Tegas, Optimis (Motivasi/Online Course)' },
  { id: 'Aoede', name: 'Aoede (Female)', avatar: '👩‍🎨', desc: 'Artistik, Ekspresif (Fashion/Seni)' },
  { id: 'Callirrhoe', name: 'Callirrhoe (Female)', avatar: '👩‍💼', desc: 'Berenergi, Dinamis (Olahraga/Lifestyle)' },
  { id: 'Autonoe', name: 'Autonoe (Female)', avatar: '👩‍🎓', desc: 'Dewasa, Profesional (Bisnis/Corporate)' },
  { id: 'Enceladus', name: 'Enceladus (Male)', avatar: '👨‍🎤', desc: 'Misterius, Berat (Teaser/Trailer)' },
  { id: 'Iapetus', name: 'Iapetus (Male)', avatar: '👴', desc: 'Bijaksana, Ramah (Mentor/Tips Hidup)' },
  { id: 'Umbriel', name: 'Umbriel (Male)', avatar: '👨‍🔬', desc: 'Dingin, Fokus (Dokumenter/Sains)' },
  { id: 'Despina', name: 'Despina (Female)', avatar: '👧', desc: 'Cepat, Riang (TikTok/Tips Singkat)' },
];

const MINIMAX_VOICES = [
  { id: 'Indonesian_casual_reporter_vv2', name: 'Casual Reporter (Male)', avatar: '👨', desc: 'Laki-laki (Casual Reporter - Vv2)' },
  { id: 'Indonesian_compelling_storyteller_vv2', name: 'Compelling Storyteller (Male)', avatar: '👨', desc: 'Laki-laki (Storyteller - Vv2)' },
  { id: 'Indonesian_expressive_podcaster_vv2', name: 'Expressive Podcaster (Male)', avatar: '👨', desc: 'Laki-laki (Podcaster - Vv2)' },
  { id: 'Indonesian_energetic_streamer_vv2', name: 'Energetic Streamer (Male)', avatar: '👨', desc: 'Laki-laki (Streamer - Vv2)' },
  { id: 'Indonesian_intellectual_commentator_vv2', name: 'Intellectual Commentator (Female)', avatar: '👩', desc: 'Perempuan (Commentator - Vv2)' },
  { id: 'Indonesian_professional_anchor_vv2', name: 'Professional Anchor (Female)', avatar: '👩', desc: 'Perempuan (Anchor - Vv2)' },
  { id: 'Indonesian_crisp_reporter_vv2', name: 'Crisp Reporter (Female)', avatar: '👩', desc: 'Perempuan (Crisp Reporter - Vv2)' }
];

export default function ImportPlannerModal({
  isOpen,
  onClose,
  initialPlannerId = '',
  onSuccess
}) {
  const [planners, setPlanners] = useState([]);
  const [selectedPlannerId, setSelectedPlannerId] = useState(initialPlannerId);
  const [planner, setPlanner] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(0);

  // Form State Aligning with SC & OPC
  const [campaignName, setCampaignName] = useState('');
  const [brandProfiles, setBrandProfiles] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');

  // Accordion 2: Aesthetics & Visual Settings
  const [narrativeMode, setNarrativeMode] = useState('Storytelling');
  const [visualStyle, setVisualStyle] = useState('Cinematic');
  const [targetAi, setTargetAi] = useState('Google Veo (8s)');
  const [videoModel, setVideoModel] = useState('veo_31_lite');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [faceVisibility, setFaceVisibility] = useState('Faceless');
  const [targetClipsCount, setTargetClipsCount] = useState(4);
  const [wordsPerClip, setWordsPerClip] = useState('17-19 kata');

  // Accordion 3: Product Bridging Settings
  const [isBridgingActive, setIsBridgingActive] = useState(true);
  const [bridgeAtClip, setBridgeAtClip] = useState(2);
  const [bridgeDurationClips, setBridgeDurationClips] = useState(1);
  const [promotionStyle, setPromotionStyle] = useState('Softselling');

  // Accordion 4: VSO Engine
  const [isVsoActive, setIsVsoActive] = useState(false);
  const [characterConcept, setCharacterConcept] = useState('faceless');
  const [subjectDemographic, setSubjectDemographic] = useState('syari_classic');
  const [wardrobeStyle, setWardrobeStyle] = useState('amber_terracotta');
  const [lightingStyle, setLightingStyle] = useState('window_daylight');
  const [visualStylePreset, setVisualStylePreset] = useState('3d_claymation_cozy');

  // Voice & Workflow
  const [voiceProvider, setVoiceProvider] = useState('minimax');
  const [voicePersona, setVoicePersona] = useState('Indonesian_casual_reporter_vv2');
  const [targetLanguage, setTargetLanguage] = useState('id-ID');
  const [enableVoAudit, setEnableVoAudit] = useState(0);
  const [enableTts, setEnableTts] = useState(true);
  const [enableFfmpeg, setEnableFfmpeg] = useState(true);
  const [enableSocialPost, setEnableSocialPost] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlanners();
      fetchBrandProfiles();
      if (initialPlannerId) {
        setSelectedPlannerId(initialPlannerId);
        loadPlannerDetail(initialPlannerId);
      }
    }
  }, [isOpen, initialPlannerId]);

  async function fetchPlanners() {
    try {
      const res = await fetch('/api/content-planner');
      const data = await res.json();
      if (data.success) {
        setPlanners(data.planners || []);
      }
    } catch (e) {
      console.error('[ImportPlannerModal] Fetch planners error:', e);
    }
  }

  async function fetchBrandProfiles() {
    try {
      const res = await fetch('/api/settings/brand-profiles');
      if (res.ok) {
        const data = await res.json();
        setBrandProfiles(data.profiles || []);
      }
    } catch (_) {}
  }

  async function loadPlannerDetail(id) {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/content-planner/${id}`);
      const data = await res.json();
      if (data.success && data.planner) {
        setPlanner(data.planner);
        const rList = data.planner.rows || [];
        setRows(rList);
        setSelectedRowIds(rList.map(r => r.id));
        setCampaignName(`[OPC Planner] ${data.planner.title || data.planner.product_name}`);
        if (data.planner.brand_id) setSelectedBrandId(data.planner.brand_id);
      }
    } catch (e) {
      console.error('[ImportPlannerModal] Load planner detail error:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPlanner(id) {
    setSelectedPlannerId(id);
    if (id) loadPlannerDetail(id);
    else {
      setPlanner(null);
      setRows([]);
      setSelectedRowIds([]);
    }
  }

  function toggleRowSelection(rowId) {
    setSelectedRowIds(prev =>
      prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
    );
  }

  function toggleAllRows() {
    if (selectedRowIds.length === rows.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(rows.map(r => r.id));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedPlannerId) {
      alert('Pilih Content Planner terlebih dahulu');
      return;
    }
    if (selectedRowIds.length === 0) {
      alert('Pilih setidaknya 1 baris strategi konten untuk di-ingest');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        planner_id: selectedPlannerId,
        selected_row_ids: selectedRowIds,
        campaign_name: campaignName,
        global_settings: {
          brand_profile_id: selectedBrandId || null,
          narrative_mode: narrativeMode,
          visual_style: visualStyle,
          target_ai: targetAi,
          video_model: videoModel,
          aspect_ratio: aspectRatio,
          face_visibility: faceVisibility,
          target_clips_count: targetClipsCount,
          words_per_clip: wordsPerClip,
          is_bridging_active: isBridgingActive ? 1 : 0,
          bridge_at_clip: bridgeAtClip,
          bridge_duration_clips: bridgeDurationClips,
          promotion_style: promotionStyle,
          enable_tts: enableTts ? 1 : 0,
          enable_ffmpeg: enableFfmpeg ? 1 : 0,
          enable_social_post: enableSocialPost ? 1 : 0,
          voice_provider: voiceProvider,
          voice_persona: voicePersona,
          target_language: targetLanguage,
          enable_vo_audit: enableVoAudit,
          visual_overrides_json: isVsoActive ? JSON.stringify({
            is_vso_active: true,
            character_concept: characterConcept,
            subject_demographic: subjectDemographic,
            wardrobe_style: wardrobeStyle,
            lighting_style: lightingStyle,
            visual_style_preset: visualStylePreset
          }) : null
        }
      };

      const res = await fetch('/api/v2/pillar-campaigns/ingest-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        if (onSuccess) onSuccess(data);
        onClose();
      } else {
        alert('Gagal mengimpor planner: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    }}>
      <div style={{
        background: '#121318', border: '1px solid #27272a', borderRadius: '16px',
        width: '100%', maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto', padding: '28px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', color: '#f3f4f6'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌱</span> Impor Content Planner ke Organic Pillar (OPC)
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Top Mode Header Banner */}
          <div style={{
            padding: '12px 16px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '10px', marginBottom: '20px', color: '#818cf8', fontWeight: 700, fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span>📊 Mode Impor Content Planner Master ke Engine Produksi Autopilot OPC</span>
          </div>

          {/* Structured 4 Accordions Stack (SC-Identical Layout) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            
            {/* ACCORDION 1: Basic Creative Strategy & Planner Master */}
            <div style={{ background: '#18181b', borderRadius: '10px', border: '1px solid #27272a', overflow: 'hidden' }}>
              <div
                onClick={() => setActiveAccordion(0)}
                style={{
                  padding: '14px 18px', background: activeAccordion === 0 ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                  color: activeAccordion === 0 ? '#818cf8' : '#f3f4f6', fontWeight: 700, fontSize: '14px',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <span>1. Basic Creative Strategy & Planner Master</span>
                <span>{activeAccordion === 0 ? '▲' : '▼'}</span>
              </div>

              {activeAccordion === 0 && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {!initialPlannerId && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', display: 'block', marginBottom: '6px' }}>
                        📊 Pilih Content Planner Master:
                      </label>
                      <select
                        value={selectedPlannerId}
                        onChange={(e) => handleSelectPlanner(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px', fontSize: '13px' }}
                      >
                        <option value="">-- Pilih Content Planner --</option>
                        {planners.map(p => (
                          <option key={p.id} value={p.id}>{p.title || p.planner_name} ({p.product_name})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {loading ? (
                    <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '12px' }}>Memuat detail planner...</div>
                  ) : planner && (
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                          📦 Produk: {planner.product_name} | Platform: {planner.platform?.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={toggleAllRows}
                          style={{ background: '#334155', border: 'none', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {selectedRowIds.length === rows.length ? 'Batal Pilih Semua' : 'Pilih Semua Row'}
                        </button>
                      </div>

                      <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', background: '#09090b', padding: '8px', borderRadius: '6px', border: '1px solid #27272a' }}>
                        {rows.map(r => (
                          <label key={r.id} style={{ fontSize: '12px', color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedRowIds.includes(r.id)}
                              onChange={() => toggleRowSelection(r.id)}
                            />
                            <span style={{ fontWeight: 600, color: '#818cf8' }}>#{r.sequence} [{r.pillar}]</span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{r.hook}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Nama Kampanye OPC:</label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={e => setCampaignName(e.target.value)}
                      placeholder="cth: [OPC Planner] Kampanye Produk"
                      style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>🔊 TTS Voice Provider:</label>
                      <select
                        value={voiceProvider}
                        onChange={e => {
                          const prov = e.target.value;
                          setVoiceProvider(prov);
                          if (prov === 'gemini') setVoicePersona('Kore');
                          else setVoicePersona('Indonesian_casual_reporter_vv2');
                        }}
                        style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}
                      >
                        <option value="minimax">MiniMax Speech</option>
                        <option value="gemini">Google Gemini TTS</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>🗣 Voice Persona:</label>
                      <select
                        value={voicePersona}
                        onChange={e => setVoicePersona(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}
                      >
                        {voiceProvider === 'gemini' ? (
                          GEMINI_VOICES.map(v => <option key={v.id} value={v.id}>{v.avatar} {v.name}</option>)
                        ) : (
                          MINIMAX_VOICES.map(v => <option key={v.id} value={v.id}>{v.avatar} {v.name}</option>)
                        )}
                      </select>
                    </div>
                  </div>

                  {brandProfiles.length > 0 && (
                    <div>
                      <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>🧬 Brand Profile (Opsional):</label>
                      <select
                        value={selectedBrandId}
                        onChange={e => setSelectedBrandId(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}
                      >
                        <option value="">-- Tanpa Brand (Generik) --</option>
                        {brandProfiles.map(bp => (
                          <option key={bp.id} value={bp.id}>{bp.brand_name} ({bp.tone_of_voice})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ACCORDION 2: Aesthetics & Visual Settings */}
            <div style={{ background: '#18181b', borderRadius: '10px', border: '1px solid #27272a', overflow: 'hidden' }}>
              <div
                onClick={() => setActiveAccordion(1)}
                style={{
                  padding: '14px 18px', background: activeAccordion === 1 ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                  color: activeAccordion === 1 ? '#818cf8' : '#f3f4f6', fontWeight: 700, fontSize: '14px',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <span>2. Aesthetics & Visual Settings</span>
                <span>{activeAccordion === 1 ? '▲' : '▼'}</span>
              </div>

              {activeAccordion === 1 && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Mode Narasi:</label>
                      <select value={narrativeMode} onChange={e => setNarrativeMode(e.target.value)} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                        <option value="Storytelling">Storytelling (Bercerita / Vlog)</option>
                        <option value="Promo Hard Sell">Promo Hard Sell (Langsung Penawaran)</option>
                        <option value="Educational Review">Educational Review (Edukasi & Ulasan)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Gaya Visual & Mood:</label>
                      <select value={visualStyle} onChange={e => setVisualStyle(e.target.value)} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                        <option value="Cinematic">Cinematic (Estetik Sinematik)</option>
                        <option value="Photorealistic Studio">Photorealistic Studio (Foto Produk Terang)</option>
                        <option value="Warm Cozy Home">Warm Cozy Home (Hangat Rumahan)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Target AI Engine:</label>
                      <select value={targetAi} onChange={e => setTargetAi(e.target.value)} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                        <option value="Google Veo (8s)">Google Veo (8s)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Model Video Veo:</label>
                      <select value={videoModel} onChange={e => setVideoModel(e.target.value)} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                        <option value="veo_31_lite">Veo 3.1 Lite (Cepat & Hemat Quota)</option>
                        <option value="veo_31_standard">Veo 3.1 Standard (Kualitas Maksimal)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Aspect Ratio:</label>
                      <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                        <option value="9:16">9:16 (Vertical Short/Reels/TikTok)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Visibilitas Wajah:</label>
                      <select value={faceVisibility} onChange={e => setFaceVisibility(e.target.value)} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                        <option value="Faceless">Faceless (Tangan & Pundak Saja)</option>
                        <option value="Full Face">Full Face (Tampak Wajah)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Jumlah Klip Target:</label>
                      <select value={targetClipsCount} onChange={e => setTargetClipsCount(Number(e.target.value))} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                        <option value={4}>4 Klip adegan (~32d)</option>
                        <option value={5}>5 Klip adegan (~40d)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACCORDION 3: Product Bridging Settings */}
            <div style={{ background: '#18181b', borderRadius: '10px', border: '1px solid #27272a', overflow: 'hidden' }}>
              <div
                onClick={() => setActiveAccordion(2)}
                style={{
                  padding: '14px 18px', background: activeAccordion === 2 ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                  color: activeAccordion === 2 ? '#818cf8' : '#f3f4f6', fontWeight: 700, fontSize: '14px',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <span>3. Product Bridging Settings</span>
                <span>{activeAccordion === 2 ? '▲' : '▼'}</span>
              </div>

              {activeAccordion === 2 && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#f3f4f6', fontWeight: 600 }}>
                    <input type="checkbox" checked={isBridgingActive} onChange={e => setIsBridgingActive(e.target.checked)} />
                    Aktifkan Product Bridging (Sisipkan Transisi Produk Softselling)
                  </label>

                  {isBridgingActive && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Mulai Bridging Klip Ke:</label>
                        <select value={bridgeAtClip} onChange={e => setBridgeAtClip(Number(e.target.value))} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                          <option value={2}>Klip 2</option>
                          <option value={3}>Klip 3</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Durasi Bridging:</label>
                        <select value={bridgeDurationClips} onChange={e => setBridgeDurationClips(Number(e.target.value))} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                          <option value={1}>1 Klip</option>
                          <option value={2}>2 Klip</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Gaya Promosi:</label>
                        <select value={promotionStyle} onChange={e => setPromotionStyle(e.target.value)} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                          <option value="Softselling">Softselling (Menyatu)</option>
                          <option value="Hardsell">Hardsell (Direct)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ACCORDION 4: Visual Swap Overrides (VSO Engine) */}
            <div style={{ background: '#18181b', borderRadius: '10px', border: '1px solid #27272a', overflow: 'hidden' }}>
              <div
                onClick={() => setActiveAccordion(3)}
                style={{
                  padding: '14px 18px', background: activeAccordion === 3 ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                  color: activeAccordion === 3 ? '#818cf8' : '#f3f4f6', fontWeight: 700, fontSize: '14px',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <span>4. Visual Swap Overrides (VSO Engine)</span>
                <span>{activeAccordion === 3 ? '▲' : '▼'}</span>
              </div>

              {activeAccordion === 3 && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#f3f4f6', fontWeight: 600 }}>
                    <input type="checkbox" checked={isVsoActive} onChange={e => setIsVsoActive(e.target.checked)} />
                    Aktifkan Visual Swap Overrides (VSO Override Directives)
                  </label>

                  {isVsoActive && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Demografi Subjek:</label>
                        <select value={subjectDemographic} onChange={e => setSubjectDemographic(e.target.value)} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                          <option value="syari_classic">Wanita Indonesia Syar'i</option>
                          <option value="caucasian_male">Pria Kaukasia / Barat</option>
                          <option value="asian_modern">Wanita Asia Modern</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Lighting Style:</label>
                        <select value={lightingStyle} onChange={e => setLightingStyle(e.target.value)} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }}>
                          <option value="window_daylight">Natural Window Daylight</option>
                          <option value="warm_indoor">Warm Ambient Indoor</option>
                          <option value="studio_bright">Bright Studio Softbox</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Bottom Action Footer Bar (Controls at the bottom, matching SC) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 18px', background: '#27272a', color: '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 24px', backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            >
              {submitting ? 'Memproses Ingest...' : '✨ Ingest & Launch OPC Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
