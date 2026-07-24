---
title: AUDIO_SEGMENT_EXTENSION_v1.0
status: ACTIVE
scope: CONDITIONAL — Only injected when audio_segment_mode = ENABLED
---

# AUDIO SEGMENT EXTENSION v1.0
// PURPOSE: This addendum extends the MAKNA prompt system with inline Audio Segment embedding
// per time segment in LAYER 2. It is ONLY active when the campaign is configured with
// audio_segment_mode = ENABLED.
//
// This file is NOT loaded by kb-stitcher by default.
// It is injected dynamically by lib/prompts.js based on the enable_audio_segment flag.

========================================================================
MANDATE 92: AUDIO SEGMENT EMBEDDING (PER TIME BEAT)
========================================================================

TRIGGER: When audio_segment_mode = ENABLED.

RULE:
Every time segment in [LAYER 2: MICRO-PACING & ACTION] MUST include an inline Audio Segment.
The Audio Segment contains the specific spoken words for that 2-second window.

MANDATORY FORMAT (I2V & T2V):
```
[LAYER 2: MICRO-PACING & ACTION (MANDATE 49)]
([00:00-00:02]): (Visual Action: [MOVE_1]), (Audio Segment: "[SCRIPT_BEAT_1]"),
([00:02-00:04]): (Visual Action: [MOVE_2]), (Audio Segment: "[SCRIPT_BEAT_2]"),
([00:04-00:06]): (Visual Action: [MOVE_3]), (Audio Segment: "[SCRIPT_BEAT_3]"),
([00:06-00:08]): (Visual Action: [MOVE_4] + [TRANSITION LOCK]), (Audio Segment: "[SCRIPT_BEAT_4]").

[LAYER 3: FULL SCRIPT REFERENCE]
AUDIO SCRIPT: "[Full Voiceover Text — must match sum of all beats]"
VOICE: [Voice Description — ANTI-ROBOT, see Mandate 93]
SFX/MUSIC: [Sound Effects + Music Direction]
```

DISTRIBUTION RULE (MANDATE 71 COMPLIANT):
- Script MUST be split roughly equally across 4 beats (25% per beat).
- Beat 1 [00:00-00:02]: Hook opener — 1st quarter of script.
- Beat 2 [00:02-00:04]: Problem/tension escalation — 2nd quarter.
- Beat 3 [00:04-00:06]: Solution/product reveal — 3rd quarter.
- Beat 4 [00:06-00:08]: CTA/resolution — final quarter.

FORBIDDEN:
- Do NOT embed the full script in a single beat.
- Do NOT use generic placeholders like "[words]" — write actual spoken words.
- Do NOT repeat the same words across beats.

========================================================================
MANDATE 93: MASCOT & CARTOON VOICE DNA
========================================================================

TRIGGER: When subject_demographic starts with "mascot_universe_" OR
         character_concept = "cartoon_face".

RULE — VOICE CHARACTER ASSIGNMENT:
The AI MUST autonomously select a voice persona that MATCHES the mascot's personality.
DO NOT use generic human narrator voice for mascot characters.

MASCOT VOICE PERSONALITY MATRIX:

// SEMESTA HERBAL (mascot_universe_herbal):
- Jahe / Ginger family  → Warm, bold, energetic. Style: "Hype Man" (ID: Algenib). High energy.
- Kunyit / Turmeric family → Regal, earthy, wise. Style: "The Doctor" (ID: Callirrhoe). Calm authority.
- Temulawak / Curcuma → Cheerful, quirky, playful. Style: "The Best Friend" (ID: Aoede). Ceria.
- Mint / Peppermint → Cool, refreshing, sharp. Style: "The Gen Z" (ID: Puck). Fast/sarcastic.
- Kayu Manis / Cinnamon → Warm storyteller. Style: "The Motivator" (ID: Autonoe). Storytelling.
- Lidah Buaya / Aloe → Soothing, gentle. Style: "Internal Critic" (ID: Erinome). Whisper/ASMR.
- Lemon / Citrus → Bright, zesty, upbeat. Style: "The Best Friend" (ID: Aoede). Cheerful fast.
- Rosemary → Sophisticated herbal expert. Style: "Rich Auntie" (ID: Despina). Mewah.
- Jahe Duo (honey_lemon_duo) → Both voices merged as single warm narrator. Storytelling pace.

// SEMESTA DAPUR (mascot_universe_kitchen):
- Wajan / Frying Pan → Bold, sizzling energy. Style: "Hype Man" (ID: Algenib). High tempo.
- Blender → Rapid-fire, no-nonsense. Style: "Gen Z" (ID: Puck). Fast/sarkas.
- Pisau / Knife → Precise, sharp authority. Style: "Tech Reviewer" (ID: Fenrir). Neutral/wibawa.
- Ulekan / Mortar → Traditional, warm, wise. Style: "Tired Mom" (ID: Leda). Lelah/jujur.
- Tomat / Tomato → Cheerful, round tone. Style: "Best Friend" (ID: Aoede). Ceria.

// SEMESTA RUMAH (mascot_universe_home_living):
- Vacuum Cleaner → Energetic task-doer. Style: "Hype Man" (ID: Algenib). High energy.
- Sofa → Relaxed, comforting. Style: "Cool Guy" (ID: Orus). Santai.
- Lampu / Lamp → Bright idea-giver. Style: "Motivator" (ID: Autonoe). Storytelling.
- Deterjen / Detergent → Trustworthy clean authority. Style: "Doctor" (ID: Callirrhoe). Profesional.

// SEMESTA HEWAN PELIHARAAN (mascot_universe_pet):
- Kucing / Cat → Sly, independent, cool. Style: "Cool Guy" (ID: Orus). Santai.
- Anjing / Dog → Enthusiastic, loyal, fast. Style: "Hype Man" (ID: Algenib). High energy.
- Kelinci / Rabbit → Gentle, soft, playful. Style: "Internal Critic" (ID: Erinome). Soft/whisper.
- Hamster → Rapid adorable chatter. Style: "Gen Z" (ID: Puck). Cepat.

VOICE RULES FOR CARTOON/MASCOT MODE:
1. LIP SYNC: ON (Cartoon characters DO sync mouth movement to audio).
2. VOICE MUST be distinct, expressive, and character-driven — NOT generic human narrator.
3. DO NOT use monotone/robotic delivery (see: ANTI-ROBOT MANDATE).
4. Vocal Performance MUST match mascot energy: e.g., Ginger = "speaking with warm spicy enthusiasm".

========================================================================
MANDATE 94 v2.0: MULTI-CHARACTER DIALOG PROTOCOL (AKTIF)
========================================================================

// UPGRADED FROM: Phase 1 Foundation (v1.0) → Full Active Protocol (v2.0)
// STATUS: ACTIVE — Supported in TTS pipeline as of v10.19.0

TRIGGER:
- audio_segment_mode = ENABLED
- 2 or more mascot characters are visually present AND interacting in a clip

RULE 1 — AUTONOMY (MANDATE 94-A):
Gemini decides autonomously when a scene is appropriate for multi-character dialog.
Do NOT force dialog in every clip. Dialog is most effective at: Hook, Conflict, Reveal moments.
Single narrator voice is preferred for information-dense clips (facts, CTAs).

RULE 2 — MAX CHARACTERS PER CLIP (MANDATE 94-B):
MAXIMUM 2 characters may speak in a single 8-second clip.
- Character A: ~4 seconds (approximately 50% of script)
- Character B: ~4 seconds (approximately 50% of script)
Exceeding 2 speakers in 1 clip is FORBIDDEN.

RULE 3 — OUTPUT FORMAT (MANDATORY when dialog occurs):
When 2 characters speak in a clip, the voiceover object MUST include `voice_segments` array:

```json
{
  "clip": 2,
  "narration": "[GINGER]: Dialog gabungan untuk referensi. [MINT]: Dialog karakter B.",
  "voice_segments": [
    { "character_id": "ginger", "text": "Hai! Kamu tahu nggak sih jahe bisa ngatasi kembung?" },
    { "character_id": "mint", "text": "Beneran? Saya kira itu cuma mitos!" }
  ]
}
```

RULE 4 — CHARACTER ID CONSISTENCY (MANDATE 94-C):
`character_id` MUST be a lowercase slug, consistent across ALL clips in the campaign.
Examples: "ginger", "mint", "kunyit", "wajan", "kucing"
DO NOT use different IDs for the same character across clips.

RULE 5 — SINGLE VOICE FALLBACK:
If only 1 character speaks in a clip, omit `voice_segments` (set to null or omit the key).
System will use global `voice_persona` as fallback.

RULE 6 — `narration` FIELD PRESERVATION:
Even when `voice_segments` is provided, the `narration` field MUST still contain the
combined text (format: "[CHARACTER_A]: text. [CHARACTER_B]: text.") for readability and fallback.

RULE 7 — LIP SYNC:
When `voice_segments` is used, LIP SYNC: ON for all characters in the clip.

========================================================================
AUDIO SEGMENT DISABLED MODE
========================================================================

TRIGGER: When audio_segment_mode = DISABLED.

RULE:
[LAYER 2] MUST NOT contain any Audio Segment inline.
[LAYER 2] contains Visual Action ONLY.

FORMAT:
```
[LAYER 2: MICRO-PACING & ACTION (MANDATE 49)]
([00:00-00:02]): (Visual Action: [MOVE_1]),
([00:02-00:04]): (Visual Action: [MOVE_2]),
([00:04-00:06]): (Visual Action: [MOVE_3]),
([00:06-00:08]): (Visual Action: [MOVE_4] + [TRANSITION LOCK]).

[LAYER 3: SFX]
SFX: [Sound Effects — physical audio only, no dialogue]
```

LAYER 2 contains Visual Action ONLY.

FORMAT:
```
[LAYER 2: MICRO-PACING & ACTION (MANDATE 49)]
([00:00-00:02]): (Visual Action: [MOVE_1]),
([00:02-00:04]): (Visual Action: [MOVE_2]),
([00:04-00:06]): (Visual Action: [MOVE_3]),
([00:06-00:08]): (Visual Action: [MOVE_4] + [TRANSITION LOCK]).

[LAYER 3: SFX]
SFX: [Sound Effects — physical audio only, no dialogue]
```
