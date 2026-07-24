import { getGeminiModel } from './gemini.js';

/**
 * High-speed Lexicon Pattern Scanner for TikTok Shop Policy Blockers & High Risk Claims
 */
const FORBIDDEN_LEXICON_BLOCKERS = [
  { pattern: /menyembuhkan/i, category: 'disease_treatment_claim', reason: 'Klaim menyembuhkan penyakit dilarang oleh kebijakan TikTok Shop.' },
  { pattern: /mengobati/i, category: 'disease_treatment_claim', reason: 'Klaim mengobati penyakit dilarang oleh kebijakan TikTok Shop.' },
  { pattern: /obat\s+penyakit/i, category: 'disease_treatment_claim', reason: 'Penggunaan istilah obat penyakit dilarang untuk produk non-farmasi.' },
  { pattern: /garansi\s+100%/i, category: 'guaranteed_results_claim', reason: 'Klaim garansi 100% hasil instan dilarang.' },
  { pattern: /dijamin\s+langsing/i, category: 'weight_loss_claim', reason: 'Klaim jaminan penurunan berat badan dilarang.' },
  { pattern: /hilang\s+permanen/i, category: 'permanent_results_claim', reason: 'Klaim hasil permanen instan dilarang.' },
  { pattern: /resep\s+dokter/i, category: 'doctor_endorsement_claim', reason: 'Klaim endorse atau resep dokter tanpa lisensi terbukti dilarang.' }
];

function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

async function callGeminiJson(prompt, systemInstruction = '') {
  const model = await getGeminiModel();
  const fullPrompt = systemInstruction 
    ? `${systemInstruction}\n\n${prompt}`
    : prompt;
    
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  });

  const responseText = result.response.text();
  const jsonStr = cleanJsonResponse(responseText);
  return JSON.parse(jsonStr);
}

/**
 * Local Lexicon Pre-Scanner
 */
export function scanLexicon(text) {
  const detected = [];
  if (!text) return detected;
  
  FORBIDDEN_LEXICON_BLOCKERS.forEach(rule => {
    if (rule.pattern.test(text)) {
      detected.push({
        category: rule.category,
        matched_text: text.match(rule.pattern)[0],
        reason: rule.reason
      });
    }
  });
  return detected;
}

/**
 * Method 1: Review Creative Content Package (Call 1 Output)
 * Inspects Hook, Master VO, Scene VOs, On-screen Text, Visual Actions
 */
export async function reviewCreative(item, creativePackage, productProfile = {}) {
  const hook = creativePackage.creative_direction?.final_hook || item.hook || '';
  const masterVo = creativePackage.voice_over?.master_vo || '';
  const storyboard = creativePackage.storyboard || [];

  const textToScan = `${hook} ${masterVo} ${storyboard.map(s => s.voice_over || '').join(' ')} ${storyboard.map(s => s.on_screen_text || '').join(' ')}`;
  const lexiconIssues = scanLexicon(textToScan);

  const systemInstruction = `
Kamu adalah TikTok Shop Compliance Auditor & QC Specialist senior (Health & Beauty Niche).
Tugasmu adalah melakukan audit kepatuhan terhadap naskah video naskah adegan berdasarkan Kebijakan Resmi TikTok Shop Health & Beauty Policy.

ATURAN AUDIT TIKTOK SHOP:
1. DILARANG klaim menyembuhkan/mengobati penyakit (diabetes, kanker, eksim berat, jerawat parah instan, dll.).
2. DILARANG klaim garansi 100%, instan 3 hari, atau permanen seumur hidup.
3. DILARANG klaim rekomendasi dokter/ahli tanpa sertifikasi terbukti.
4. DILARANG klaim klaim perbandingan ekstrem "sebelum dan sesudah" yang menyesatkan.

KATEGORI HASIL STATUS:
- "pass": Naskah bersih dari klaim terlarang.
- "revise": Terdapat klaim terlarang/superlatif ringan yang BISA DIREVISI OTOMATIS menjadi kalimat aman tanpa merusak strategi.
- "block": Terdapat pelanggaran fundamental berat yang dilarang penuh.
- "human_review": Terdapat kalimat berisiko tinggi / ambigu yang memerlukan keputusan manusia (Human-in-the-loop).

KATEGORI RISIKO:
- "low" (skor 1-2), "medium" (skor 3-5), "high" (skor 6-8), "critical" (skor 9-10).

FORMAT OUTPUT JSON WAJIB:
{
  "status": "pass" | "revise" | "block" | "human_review",
  "risk_level": "low" | "medium" | "high" | "critical",
  "detected_issues": [
    {
      "field": "final_hook" | "master_voice_over" | "scene_voice_over" | "on_screen_text",
      "scene_number": number | null,
      "category": "disease_treatment_claim" | "guaranteed_results_claim" | "medical_misinformation",
      "original_text": "...",
      "reason": "...",
      "policy_reference": "TikTok Shop Health & Beauty Policy Section 4.2"
    }
  ],
  "fields_to_revise": ["final_hook", "master_voice_over"],
  "safe_revisions": {
    "final_hook": "Teks revisi aman...",
    "master_voice_over": "Teks master VO revisi aman...",
    "scene_voice_overs": ["Klip 1 revisi...", "Klip 2 revisi..."],
    "on_screen_texts": ["Text 1 revisi...", "Text 2 revisi..."]
  },
  "human_review_required": boolean
}
`;

  const prompt = `
Lakukan audit kepatuhan TikTok terhadap data naskah berikut:
Produk: ${item.product}
Final Hook: "${hook}"
Master Voiceover: "${masterVo}"
Adegan Storyboard (${storyboard.length} Klip):
${storyboard.map((s, idx) => `Klip #${idx+1}: VO="${s.voice_over || ''}" | Text="${s.on_screen_text || ''}" | Visual="${s.visual_action || ''}"`).join('\n')}

Isu Pemindaian awal Lexicon: ${JSON.stringify(lexiconIssues)}

Hasilkan audit JSON sesuai schema di atas.
`;

  console.log(`[TikTokComplianceService] Reviewing Creative Package for item ${item.id}...`);
  const reviewResult = await callGeminiJson(prompt, systemInstruction);

  // If lexicon scanner caught a hard blocker but Gemini passed, override to revise or human_review
  if (lexiconIssues.length > 0 && reviewResult.status === 'pass') {
    reviewResult.status = 'revise';
    reviewResult.risk_level = 'medium';
    reviewResult.human_review_required = true;
  }

  return reviewResult;
}

/**
 * Method 2: Rewrite Unsafe Fields in Creative Package using Safe Revisions
 */
export function rewriteUnsafeFields(item, creativePackage, safeRevisions = {}) {
  if (!creativePackage) return creativePackage;

  const updatedPkg = JSON.parse(JSON.stringify(creativePackage));

  if (safeRevisions.final_hook && updatedPkg.creative_direction) {
    updatedPkg.creative_direction.final_hook = safeRevisions.final_hook;
  }

  if (safeRevisions.master_voice_over && updatedPkg.voice_over) {
    updatedPkg.voice_over.master_vo = safeRevisions.master_voice_over;
  }

  if (Array.isArray(safeRevisions.scene_voice_overs) && Array.isArray(updatedPkg.storyboard)) {
    safeRevisions.scene_voice_overs.forEach((revVo, idx) => {
      if (updatedPkg.storyboard[idx] && revVo) {
        updatedPkg.storyboard[idx].voice_over = revVo;
      }
    });
  }

  if (Array.isArray(safeRevisions.on_screen_texts) && Array.isArray(updatedPkg.storyboard)) {
    safeRevisions.on_screen_texts.forEach((revText, idx) => {
      if (updatedPkg.storyboard[idx] && revText) {
        updatedPkg.storyboard[idx].on_screen_text = revText;
      }
    });
  }

  return updatedPkg;
}

/**
 * Method 3: Review Publishing Content Package (Call 2 Output)
 * Inspects Captions, CTA, Hashtags, Titles, SEO
 */
export async function reviewPublishing(item, creativePackage, publishingPackage, productProfile = {}) {
  const tiktokCaption = publishingPackage?.publishing_assets?.tiktok?.caption || '';
  const igCaption = publishingPackage?.publishing_assets?.instagram?.caption || '';
  const cta = publishingPackage?.publishing_assets?.tiktok?.cta || '';

  const lexiconIssues = scanLexicon(`${tiktokCaption} ${igCaption} ${cta}`);

  const systemInstruction = `
Kamu adalah TikTok Shop Publishing Compliance Auditor.
Tugasmu adalah memeriksa Caption media sosial, CTA, dan Hashtag hasil Call 2 agar mematuhi aturan periklanan TikTok Shop.

Format Output WAJIB berupa JSON Object:
{
  "status": "pass" | "revise" | "block" | "human_review",
  "risk_level": "low" | "medium" | "high" | "critical",
  "detected_issues": [],
  "safe_revisions": {
    "tiktok_caption": "...",
    "cta": "..."
  },
  "human_review_required": boolean
}
`;

  const prompt = `
Lakukan audit kepatuhan penerbitan terhadap data berikut:
TikTok Caption: "${tiktokCaption}"
Instagram Caption: "${igCaption}"
CTA: "${cta}"
Isi Lexicon Issues: ${JSON.stringify(lexiconIssues)}

Hasilkan audit JSON.
`;

  console.log(`[TikTokComplianceService] Reviewing Publishing Package for item ${item.id}...`);
  return await callGeminiJson(prompt, systemInstruction);
}
