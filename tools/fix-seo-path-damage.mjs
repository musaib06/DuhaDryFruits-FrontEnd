import fs from 'fs';
import path from 'path';

const roots = [
  'src/app/main/components/main/end-user',
  'src/app/main/components/internal/End-user',
  'src/app/services',
];

/** Reverse accidental filesystem/module path rewrites — keep SEO URL changes. */
const fixes = [
  // routing / folder imports
  [/\.\/buy-dry-fruits\/shop/g, './shop/shop'],
  [/\.\/saved-items\/saved-items/g, './wishlist/wishlist'],
  [/\.\/order-history\/order-history/g, './my-orders/my-orders'],
  [/\.\/contact\/contact/g, './contact-us/contact-us'],
  [/static-pages\/about-duha\/about-duha/g, 'static-pages/about-us/about-us'],
  [/static-pages\/returns-and-refunds\/returns-and-refunds/g, 'static-pages/refund-and-return-policy/refund-and-return-policy'],
  [/\.\/dry-fruits-for-health\/dry-fruits-for-health/g, './health-concerns/health-concerns'],
  [/\.\/journal\/blog-list/g, './blog/blog-list'],
  [/\.\/journal\/blog-detail/g, './blog/blog-detail'],
  [/\.\/wholesale-dry-fruits\/wholesale-dry-fruits/g, './bulk-orders/bulk-orders'],
  [/\.\/my-wholesale-requests\/my-wholesale-requests/g, './my-bulk-orders/my-bulk-orders'],

  // template / style urls
  [/'\.\/saved-items\.html'/g, "'./wishlist.html'"],
  [/'\.\/saved-items\.scss'/g, "'./wishlist.scss'"],
  [/'\.\/order-history\.html'/g, "'./my-orders.html'"],
  [/'\.\/order-history\.scss'/g, "'./my-orders.scss'"],
  [/'\.\/contact\.html'/g, "'./contact-us.html'"],
  [/'\.\/contact\.scss'/g, "'./contact-us.scss'"],
  [/'\.\/about-duha\.html'/g, "'./about-us.html'"],
  [/'\.\/about-duha\.scss'/g, "'./about-us.scss'"],
  [/'\.\/returns-and-refunds\.html'/g, "'./refund-and-return-policy.html'"],
  [/'\.\/returns-and-refunds\.scss'/g, "'./refund-and-return-policy.scss'"],
  [/'\.\/dry-fruits-for-health\.html'/g, "'./health-concerns.html'"],
  [/'\.\/dry-fruits-for-health\.scss'/g, "'./health-concerns.scss'"],
  [/'\.\/wholesale-dry-fruits\.html'/g, "'./bulk-orders.html'"],
  [/'\.\/wholesale-dry-fruits\.scss'/g, "'./bulk-orders.scss'"],
  [/'\.\/my-wholesale-requests\.html'/g, "'./my-bulk-orders.html'"],
  [/'\.\/my-wholesale-requests\.scss'/g, "'./my-bulk-orders.scss'"],

  // services / models / clients (filesystem names)
  [/saved-items\.service/g, 'wishlist.service'],
  [/saved-items\.viewmodel/g, 'wishlist.viewmodel'],
  [/order-history\.viewmodel/g, 'my-orders.viewmodel'],
  [/wholesale-dry-fruits\.viewmodel/g, 'bulk-orders.viewmodel'],
  [/my-wholesale-requests\.viewmodel/g, 'my-bulk-orders.viewmodel'],
  [/contact\.viewmodel/g, 'contact-us.viewmodel'],
  [/services\/contact\.service/g, 'services/contact-us.service'],
  [/clients\/contact\.client/g, 'clients/contact-us.client'],
  [/contact-s-m/g, 'contact-us-s-m'],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.ts$/.test(e.name) && !e.name.includes('.spec.')) files.push(p);
  }
  return files;
}

const changed = [];
for (const root of roots) {
  for (const file of walk(root)) {
    let text = fs.readFileSync(file, 'utf8');
    const orig = text;
    for (const [re, to] of fixes) text = text.replace(re, to);
    if (text !== orig) {
      fs.writeFileSync(file, text);
      changed.push(file);
    }
  }
}
console.log('Fixed', changed.length, 'files');
changed.forEach((f) => console.log(' -', f));
