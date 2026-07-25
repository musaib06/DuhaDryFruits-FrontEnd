/**
 * Bulk-replace Bootstrap Icons → Remix Icons across storefront templates.
 * Run: node tools/migrate-icons.mjs
 */
import fs from 'fs';
import path from 'path';

const roots = [
  'src/app/main/components/internal/End-user',
  'src/app/main/components/main/end-user',
];

const pairs = [
  // longest / most specific first
  ['bi bi-exclamation-triangle', 'ri ri-error-warning-line'],
  ['bi bi-chat-square-text', 'ri ri-chat-4-line'],
  ['bi bi-pencil-square', 'ri ri-edit-2-line'],
  ['bi bi-calendar-heart', 'ri ri-calendar-check-line'],
  ['bi bi-question-circle', 'ri ri-question-line'],
  ['bi bi-patch-check-fill', 'ri ri-verified-badge-fill'],
  ['bi bi-check2-circle', 'ri ri-checkbox-circle-line'],
  ['bi bi-shield-check', 'ri ri-shield-check-line'],
  ['bi bi-heart-pulse', 'ri ri-heart-pulse-line'],
  ['bi bi-journal-text', 'ri ri-article-line'],
  ['bi bi-info-circle', 'ri ri-information-line'],
  ['bi bi-plus-circle', 'ri ri-add-circle-line'],
  ['bi bi-x-circle', 'ri ri-close-circle-line'],
  ['bi bi-cart-plus', 'ri ri-shopping-bag-add-line'],
  ['bi bi-cart-x', 'ri ri-shopping-bag-line'],
  ['bi bi-basket-fill', 'ri ri-shopping-basket-2-fill'],
  ['bi bi-grid-3x3-gap-fill', 'ri ri-apps-2-fill'],
  ['bi bi-grid-fill', 'ri ri-grid-fill'],
  ['bi bi-box-seam', 'ri ri-archive-2-line'],
  ['bi bi-star-fill', 'ri ri-star-fill'],
  ['bi bi-star-half', 'ri ri-star-half-s-fill'],
  ['bi bi-heart-fill', 'ri ri-heart-3-fill'],
  ['bi bi-file-text', 'ri ri-file-text-line'],
  ['bi bi-list-check', 'ri ri-list-check-3'],
  ['bi bi-dash-lg', 'ri ri-subtract-line'],
  ['bi bi-plus-lg', 'ri ri-add-line'],
  ['bi bi-x-lg', 'ri ri-close-line'],
  ['bi bi-whatsapp', 'ri ri-whatsapp-line'],
  ['bi bi-lightning', 'ri ri-flashlight-line'],
  ['bi bi-building', 'ri ri-building-4-line'],
  ['bi bi-headset', 'ri ri-customer-service-2-line'],
  ['bi bi-envelope', 'ri ri-mail-send-line'],
  ['bi bi-globe2', 'ri ri-global-line'],
  ['bi bi-search', 'ri ri-search-2-line'],
  ['bi bi-cart', 'ri ri-shopping-bag-3-line'],
  ['bi bi-heart', 'ri ri-heart-3-line'],
  ['bi bi-eye', 'ri ri-eye-line'],
  ['bi bi-list', 'ri ri-menu-3-line'],
  ['bi bi-shop', 'ri ri-store-2-line'],
  ['bi bi-house', 'ri ri-home-5-line'],
  ['bi bi-basket', 'ri ri-shopping-basket-2-line'],
  ['bi bi-star', 'ri ri-star-line'],
  ['bi bi-award', 'ri ri-medal-2-line'],
  ['bi bi-truck', 'ri ri-truck-line'],
  ['bi bi-gift', 'ri ri-gift-2-line'],
  ['bi bi-boxes', 'ri ri-stack-line'],
  ['bi bi-trash', 'ri ri-delete-bin-6-line'],
  ['bi bi-image', 'ri ri-image-line'],
  ['bi bi-tags', 'ri ri-price-tag-3-line'],
  ['bi bi-share', 'ri ri-share-forward-line'],
  ['bi bi-grid', 'ri ri-layout-grid-line'],
  ['bi bi-bag', 'ri ri-briefcase-4-line'],
  ['bi bi-box', 'ri ri-box-3-line'],
  ['bi bi-dash', 'ri ri-subtract-line'],
  ['bi bi-plus', 'ri ri-add-line'],
  ['bi bi-x', 'ri ri-close-line'],

  // bare / ngClass class names
  ["'bi-star-fill", "'ri-star-fill"],
  ["'bi-star-half", "'ri-star-half-s-fill"],
  ["'bi-star", "'ri-star-line"],
  ['"bi-star-fill', '"ri-star-fill'],
  ['"bi-star-half', '"ri-star-half-s-fill'],
  ['"bi-star', '"ri-star-line'],
  ['bi-heart-fill', 'ri-heart-3-fill'],
  ['bi-heart', 'ri-heart-3-line'],
  ['bi-dash', 'ri-subtract-line'],
  ['bi-plus', 'ri-add-line'],
  ['bi-dash-lg', 'ri-subtract-line'],
  ['bi-plus-lg', 'ri-add-line'],
  ['bi-tags', 'ri-price-tag-3-line'],
  ['bi-headset', 'ri-customer-service-2-line'],
  ['bi-lightning', 'ri-flashlight-line'],
  ['bi-building', 'ri-building-4-line'],
  ['bi-truck', 'ri-truck-line'],
  ['bi-box-seam', 'ri-archive-2-line'],
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(html|ts|scss)$/.test(entry.name)) out.push(full);
  }
  return out;
}

let changed = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    let text = fs.readFileSync(file, 'utf8');
    const before = text;
    for (const [from, to] of pairs) {
      if (text.includes(from)) text = text.split(from).join(to);
    }
    // leftover "bi bi-" prefixes still using bootstrap
    text = text.replace(/\bbi bi-/g, 'ri ri-');
    text = text.replace(/\[class\.bi-/g, '[class.ri-');
    text = text.replace(/class=\"bi\"/g, 'class="ri"');
    text = text.replace(/class='bi'/g, "class='ri'");
    if (text !== before) {
      fs.writeFileSync(file, text);
      changed++;
      console.log('updated', file);
    }
  }
}
console.log(`Done. Files changed: ${changed}`);
