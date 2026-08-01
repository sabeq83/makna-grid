import { getDb } from '../lib/db.js';
import { generateContentFlexible, GEMINI_MODELS } from '../lib/gemini.js';
import { getAuthorizedClient } from '../lib/google-auth.js';
import { google } from 'googleapis';
import { updateCell } from '../lib/sheets-autopilot-worker.js';

const CAMPAIGN_ID = 'sheets_260801_0vmu98';

async function recover() {
  console.log(`\n🚀 === 1-CALL CAPTION RECOVERY FOR CAMPAIGN: ${CAMPAIGN_ID} === 🚀`);
  
  const db = getDb();
  
  // 1. Fetch the campaign to get spreadsheet_id
  const campaign = db.prepare("SELECT * FROM sheets_campaigns WHERE id = ?").get(CAMPAIGN_ID);
  if (!campaign) {
    console.error(`Error: Campaign ${CAMPAIGN_ID} not found in database!`);
    return;
  }
  
  console.log(`✓ Campaign found: ${campaign.campaign_name}`);
  console.log(`✓ Spreadsheet ID: ${campaign.spreadsheet_id}`);
  
  // 2. Fetch all jobs for this campaign
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
  
  // 3. Build a single structured prompt for all jobs
  let promptItemsText = '';
  for (const job of targetJobs) {
    let storyboard = [];
    let voiceover = [];
    try {
      storyboard = JSON.parse(job.storyboard || '[]');
      voiceover = JSON.parse(job.voiceover || '[]');
    } catch (e) {
      continue;
    }
    const narrationText = voiceover.map(v => v.narration || '').join('\n');
    const visualText = storyboard.map(s => s.visual_description || '').join('\n');
    
    promptItemsText += `
--- Video Row Index: ${job.row_index} ---
Voiceover Script:
${narrationText}
Storyboard Visuals:
${visualText}
`;
  }
  
  const prompt = `
You are a professional social media copywriter.
Generate a highly engaging, persuasive, and custom social media caption for each of the following video scripts.
Each caption must have a strong hook, clear value, natural call to action (CTA), and relevant hashtags.

Here are the video details:
${promptItemsText}

Format the response strictly as a JSON array of objects, where each object has:
- "row_index" (integer)
- "caption" (string, the generated caption in Indonesian)

Do NOT include any extra formatting, explanations, or wrapping markdown code blocks (e.g. do not wrap in \`\`\`json). Respond ONLY with raw parseable JSON array.
`;

  // 4. Call Gemini in a single 1x API Call
  console.log(`\nCalling Gemini AI (1x API Call) to generate captions for all ${targetJobs.length} rows...`);
  let rawResponse = '';
  try {
    rawResponse = await generateContentFlexible({
      prompt,
      modelName: GEMINI_MODELS.PRIMARY
    });
  } catch (err) {
    console.error(`Error calling Gemini AI:`, err.message);
    return;
  }
  
  // Clean potential markdown wrapping if returned anyway
  let cleanJson = rawResponse.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
  }
  
  let results = [];
  try {
    results = JSON.parse(cleanJson);
  } catch (err) {
    console.error("Error parsing JSON response from Gemini:", err.message);
    console.log("Raw Response received:", rawResponse);
    return;
  }
  
  console.log(`✓ Successfully received and parsed captions for ${results.length} rows.`);
  
  // 5. Connect to Google Sheets to update cells
  console.log("\nConnecting to Google Sheets API...");
  const auth = getAuthorizedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  const sheetName = campaign.campaign_type === 'RE' ? 'CAMPAIGN_RE' : (campaign.campaign_type === 'OPC' ? 'CAMPAIGN_OPC' : 'CAMPAIGN_IFC');
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
  
  console.log(`✓ TikTok Column: ${tiktokColIdx !== -1 ? 'Found' : 'Not Found'}, IG Column: ${igColIdx !== -1 ? 'Found' : 'Not Found'}`);
  
  // 6. Write back to database and Google Sheets
  for (const item of results) {
    const rowIndex = item.row_index;
    const generatedCaption = item.caption;
    
    if (!rowIndex || !generatedCaption) continue;
    
    const job = targetJobs.find(j => j.row_index === rowIndex);
    if (!job) {
      console.warn(`  Warning: Received result for row ${rowIndex} but no matching job found. Skipping.`);
      continue;
    }
    
    console.log(`Updating Row ${rowIndex}...`);
    
    // Save to SQLite
    const newCaptionsJson = JSON.stringify({
      caption: generatedCaption,
      tiktok_caption: generatedCaption,
      ig_caption: generatedCaption,
      yt_title: generatedCaption,
      yt_desc: generatedCaption
    });
    
    db.prepare("UPDATE sheets_jobs SET captions_json = ? WHERE id = ?").run(newCaptionsJson, job.id);
    
    // Save to Google Sheets
    if (tiktokColIdx !== -1) {
      await updateCell(sheets, campaign.spreadsheet_id, sheetName, tiktokColIdx, rowIndex, generatedCaption);
    }
    if (igColIdx !== -1) {
      await updateCell(sheets, campaign.spreadsheet_id, sheetName, igColIdx, rowIndex, generatedCaption);
    }
    
    console.log(`  ✓ Row ${rowIndex} successfully updated in database and Sheets.`);
  }
  
  console.log("\n🎉 Recovery complete! All captions synchronized in 1x Gemini API call.");
}

recover().catch(err => {
  console.error("Fatal error during recovery:", err);
});
