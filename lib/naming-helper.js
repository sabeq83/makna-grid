/**
 * Centralized Naming & Folder Helper for MAKNA Grid Campaign Schedulers and Sync Workers
 * Standardized for Google Drive and Nextcloud uploads.
 */

export function getProductSlug(campaign, item = {}) {
  const rawProduct = item.nama_produk || item.product || campaign.product_name || campaign.campaign_name || 'umum';
  return rawProduct
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join('_');
}

export function formatVideoId({ accountName, modulePrefix = 're', campaignId = '', sequence = 1, productSlug = 'umum' }) {
  const accountSlug = (accountName || 'umum')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');

  const modPrefix = (modulePrefix || 're').toLowerCase().trim();

  let campaignHash = '66b4d6';
  if (campaignId) {
    const cleanId = String(campaignId).replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (cleanId.length >= 6) {
      campaignHash = cleanId.substring(0, 6);
    } else {
      campaignHash = cleanId.padEnd(6, '0');
    }
  }

  const paddedSeq = String(sequence).padStart(2, '0');
  return `${accountSlug}_${modPrefix}_${productSlug}_${campaignHash}_${paddedSeq}`;
}

export function getCampaignParentFolderName(campaign, type = 'OPC') {
  const brandSlug = (campaign.account_name || 'umum')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
  const cleanId = String(campaign.id || '').replace(/[^a-zA-Z0-9]/gi, '').toLowerCase();
  const campaignHash = cleanId.length >= 6 ? cleanId.substring(0, 6) : cleanId.padEnd(6, '0');
  const productSlug = getProductSlug(campaign);
  return `${brandSlug}_${type.toLowerCase()}_${productSlug}_${campaignHash}`;
}

export function getFilePrefixFromBatchId(batchId) {
  if (!batchId) return '';
  const parts = batchId.split('_');
  if (parts.length >= 3) {
    return parts.slice(2).join('_');
  }
  return batchId;
}

export function getReBatchId(campaign, item, db) {
  const campaignItems = db.prepare('SELECT id FROM re_campaign_items WHERE campaign_id = ? ORDER BY id ASC').all(campaign.id);
  const itemIndex = campaignItems.findIndex(i => i.id === item.id);
  const sequenceNumber = itemIndex !== -1 ? itemIndex + 1 : 1;
  return formatVideoId({
    accountName: campaign.account_name || 'umum',
    modulePrefix: 're',
    campaignId: campaign.id,
    sequence: sequenceNumber,
    productSlug: getProductSlug(campaign, item)
  });
}

export function getScBatchId(campaign, item, db) {
  const campaignItems = db.prepare('SELECT id FROM strategic_campaign_items WHERE campaign_id = ? ORDER BY sequence ASC, id ASC').all(campaign.id);
  const itemIndex = campaignItems.findIndex(i => i.id === item.id);
  const sequenceNumber = itemIndex !== -1 ? itemIndex + 1 : (item.sequence || 1);
  return formatVideoId({
    accountName: campaign.account_name || 'umum',
    modulePrefix: 'sc',
    campaignId: campaign.id,
    sequence: sequenceNumber,
    productSlug: getProductSlug(campaign, item)
  });
}

export function getIfcBatchId(campaign, item, db) {
  const campaignItems = db.prepare('SELECT id FROM instant_campaign_items WHERE campaign_id = ? ORDER BY id ASC').all(campaign.id);
  const itemIndex = campaignItems.findIndex(i => i.id === item.id);
  const sequenceNumber = itemIndex !== -1 ? itemIndex + 1 : 1;
  return formatVideoId({
    accountName: campaign.account_name || 'umum',
    modulePrefix: 'ifc',
    campaignId: campaign.id,
    sequence: sequenceNumber,
    productSlug: getProductSlug(campaign, item)
  });
}

export function getOpcBatchId(campaign, item, db) {
  const campaignItems = db.prepare('SELECT id FROM pillar_campaign_items WHERE campaign_id = ? ORDER BY id ASC').all(campaign.id);
  const itemIndex = campaignItems.findIndex(i => i.id === item.id);
  const sequenceNumber = itemIndex !== -1 ? itemIndex + 1 : 1;
  return formatVideoId({
    accountName: campaign.account_name || 'umum',
    modulePrefix: 'opc',
    campaignId: campaign.id,
    sequence: sequenceNumber,
    productSlug: getProductSlug(campaign, item)
  });
}
