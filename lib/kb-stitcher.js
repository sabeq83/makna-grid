import fs from 'fs';
import path from 'path';

// Explicit ideal order of Knowledge Base files to merge
const KB_FILES_ORDER = [
  'MAKNA_Config_v54.9.md',
  'PROMPT_SYSTEM_v47.9.md',
  'NARRATIVE_STRUCTURE_v47.9.md',
  'STRATEGIC_FRAMEWORKS_v47.9.md',
  'CHARACTER_PSYCHOLOGY_v47.9.md',
  'CHARACTER_ROLES_v47.9.md',
  'REALIST_VIRAL_NARRATIVE_v47.9.md',
  'VISUAL_STYLE_GUIDE_v47.9.md',
  'LOCATION_GUIDE_v47.9.md',
  'AUTEUR_GUIDE_v47.9.md',
  'Food Styling & Photography KB.md'
];

/**
 * Reads all KB files from the /kb-seeds/ folder and joins them with structured markdown boundaries.
 * @returns {string} Master Payload System Instruction for Gemini Context Caching
 */
export function getStitchedMasterKB() {
  const seedsFolder = path.join(process.cwd(), 'kb-seeds');
  let stitchedString = `## MAKNA ENGINE V7 MASTER KNOWLEDGE BASE ##\n`;
  stitchedString += `This is the complete system directive, mandates, and creative guidelines for MAKNA Engine. Adhere to all rules strictly.\n\n`;

  for (const fileName of KB_FILES_ORDER) {
    const filePath = path.join(seedsFolder, fileName);
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Insert structured boundaries between instruction domains
      stitchedString += `\n\n========================================================================\n`;
      stitchedString += `MODULE START: ${fileName.toUpperCase()}\n`;
      stitchedString += `========================================================================\n\n`;
      stitchedString += fileContent;
      stitchedString += `\n\n========================================================================\n`;
      stitchedString += `MODULE END: ${fileName.toUpperCase()}\n`;
      stitchedString += `========================================================================\n`;
    } else {
      console.warn(`[KB Stitcher] File ${fileName} not found in folder kb-seeds/! Skipping.`);
    }
  }

  return stitchedString;
}
