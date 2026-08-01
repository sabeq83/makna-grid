import { getDb } from '../lib/db.js';
import { generateContentFlexible, GEMINI_MODELS } from '../lib/gemini.js';
import { getAuthorizedClient } from '../lib/google-auth.js';
import { google } from 'googleapis';
import { updateCell } from '../lib/sheets-autopilot-worker.js';

const CAMPAIGN_ID = 'sheets_260801_0vmu98';

async function recover() {
  console.log(`\n🚀 === RECOVERING CAPTIONS FOR CAMPAIGN: ${CAMPAIGN_ID} === 🚀`);
  
  const db = getDb();
  
  // 1. Fetch the campaign to get spreadsheet_id
  const campaign = db.prepare("SELECT * FROM sheets_campaigns WHERE campaign_id = ?").get(CAMPAIGN_ID);
  if (!campaign) {
    console.error(`Error: Campaign ${CAMPAIGN_ID} not found in database!`);
    return;
  }
  
  console.log(`✓ Campaign found: ${campaign.campaign_name}`);
  console.log(`✓ Spreadsheet ID: ${campaign.spreadsheet_id}`);
  
  // 2. Fetch all processed jobs for this campaign
  const jobs = db.prepare(`
    SELECT * FROM sheets_jobs 
    WHERE campaign_id = ? 
  `).all(CAMPAIGN_ID);
  
  const targetJobs = jobs.filter(job => {
    try {
      const caps = JSON.parse(job.captions_json || '{}');
      return !caps.caption && !caps.tiktok_caption && !caps.ig_caption;
    } catch {
      return true;
    }
  });
  
  console.log(`✓ Total jobs: ${jobs.length}`);
  console.log(`✓ Jobs needing caption recovery: ${targetJobs.length}`);
  
  if (targetJobs.length === 0) {
    console.log("No jobs need recovery. Exiting.");
    return;
  }
  
  // 3. Connect to Google Sheets
  console.log("Connecting to Google Sheets API...");
  const auth = getAuthorizedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  const sheetName = campaign.campaign_type === 'RE' ? 'CAMPAIGN_RE' : (campaign.campaign_type === 'OPC' ? 'CAMPAIGN_OPC' : 'CAMPAIGN_IFC');
  console.log(`✓ Target sheet tab: ${sheetName}`);
  
  // Read headers to find caption columns
  const meta = await sheets.spreadsheets.get({ spreadsheetId: campaign.spreadsheet_id });
  const sheetExists = meta.data.sheets.some(s => s.properties.title === sheetName);
  if (!sheetExists) {
    console.error(`Error: Tab "${sheetName}" not found in spreadsheet!`);
    return;
  }
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: campaign.spreadsheet_id,
    range: `'${sheetName}'!A1:Z1`
  });
  
  const headers = (response.data.values || [[]])[0].map(h => h.trim().toLowerCase());
  
  const tiktokColIdx = headers.indexOf('tiktok_caption');
  const igColIdx = headers.indexOf('ig_caption');
  
  console.log(`✓ TikTok Caption column index: ${tiktokColIdx}`);
  console.log(`✓ IG Caption column index: ${igColIdx}`);
  
  // 4. Loop and recover each job
  for (let i = 0; i < targetJobs.length; i++) {
    const job = targetJobs[i];
    console.log(`\n[${i + 1}/${targetJobs.length}] Processing Row ${job.row_index} (Job ID: ${job.id})...`);
    
    // Parse storyboard and voiceover
    let storyboard = [];
    let voiceover = [];
    try {
      storyboard = JSON.parse(job.storyboard || '[]');
      voiceover = JSON.parse(job.voiceover || '[]');
    } catch (e) {
      console.warn(`  Warning: Failed to parse storyboard or voiceover for Row ${job.row_index}. Skipping.`);
      continue;
    }
    
    const narrationText = voiceover.map(v => v.narration || '').join('\n');
    const visualText = storyboard.map(s => s.visual_description || '').join('\n');
    
    if (!narrationText && !visualText) {
      console.warn(`  Warning: Narrative text and visual text are both empty. Skipping.`);
      continue;
    }
    
    // Build Prompt
    const prompt = `
You are a professional social media copywriter.
Given the voiceover narration script and visual storyboard of a short promotional video, generate an engaging, highly persuasive social media Caption.
The caption should have:
1. A strong hook to capture attention.
2. Clear explanation of value.
3. Natural call to action (CTA).
4. Relevantly selected hashtags.

Voiceover Script:
${narrationText}

Visual Storyboard:
${visualText}

Generate a single unified Social Media Caption in Indonesian. Do NOT include any intro or outro. Respond ONLY with the final caption text.
`;

    console.log(`  Calling Gemini to generate caption...`);
    let generatedCaption = '';
    try {
      const geminiResponse = await generateContentFlexible({
        prompt,
        modelName: GEMINI_MODELS.PRIMARY
      });
      generatedCaption = geminiResponse.trim();
    } catch (err) {
      console.error(`  Error calling Gemini:`, err.message);
      continue;
    }
    
    if (!generatedCaption) {
      console.warn(`  Warning: Gemini returned empty caption. Skipping.`);
      continue;
    }
    
    console.log(`  Generated Caption (length: ${generatedCaption.length}):`);
    console.log(`  -----------------------------`);
    console.log(generatedCaption.substring(0, 150) + '...');
    console.log(`  -----------------------------`);
    
    // Update local database
    const newCaptionsJson = JSON.stringify({
      caption: generatedCaption,
      tiktok_caption: generatedCaption,
      ig_caption: generatedCaption,
      yt_title: generatedCaption,
      yt_desc: generatedCaption
    });
    
    db.prepare("UPDATE sheets_jobs SET captions_json = ? WHERE id = ?").run(newCaptionsJson, job.id);
    console.log(`  ✓ Database updated.`);
    
    // Write back to Google Sheets
    if (tiktokColIdx !== -1) {
      await updateCell(sheets, campaign.spreadsheet_id, sheetName, tiktokColIdx, job.row_index, generatedCaption);
      console.log(`  ✓ Google Sheets TikTok Column updated.`);
    }
    if (igColIdx !== -1) {
      await updateCell(sheets, campaign.spreadsheet_id, sheetName, igColIdx, job.row_index, generatedCaption);
      console.log(`  ✓ Google Sheets IG Column updated.`);
    }
    
    // Throttle slightly to be nice to APIs
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log("\n🎉 Recovery complete! All empty captions have been successfully generated and synchronized.");
}

recover().catch(err => {
  console.error("Fatal error during recovery:", err);
});
