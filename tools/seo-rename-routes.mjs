import fs from 'fs';
import path from 'path';

const roots = [
  'src/app/main/components/main/end-user',
  'src/app/main/components/internal/End-user',
  'src/app/services',
];

/** @type {Array<[RegExp, string]>} */
const replacements = [
  [/\/health-concerns/g, '/dry-fruits-for-health'],
  [/\/refund-and-return-policy/g, '/returns-and-refunds'],
  [/\/my-bulk-orders/g, '/my-wholesale-requests'],
  [/\/bulk-orders/g, '/wholesale-dry-fruits'],
  [/\/contact-us/g, '/contact'],
  [/\/about-us/g, '/about-duha'],
  [/\/my-orders/g, '/order-history'],
  [/\/wishlist/g, '/saved-items'],
  [/routerLink="\/cart"/g, 'routerLink="/shopping-cart"'],
  [/routerLink='\/cart'/g, "routerLink='/shopping-cart'"],
  [/\['\/cart'/g, "['/shopping-cart'"],
  [/\/shop\//g, '/buy-dry-fruits/'],
  [/routerLink="\/shop"/g, 'routerLink="/buy-dry-fruits"'],
  [/routerLink='\/shop'/g, "routerLink='/buy-dry-fruits'"],
  [/\['\/shop'/g, "['/buy-dry-fruits'"],
  [/\/product\//g, '/dry-fruits/'],
  [/\['\/product'/g, "['/dry-fruits'"],
  [/\/blog\//g, '/journal/'],
  [/routerLink="\/blog"/g, 'routerLink="/journal"'],
  [/routerLink='\/blog'/g, "routerLink='/journal'"],
  [/\['\/blog'/g, "['/journal'"],
  [/`\/blog\//g, '`/journal/'],
  [/routerLink="\/home"/g, 'routerLink="/"'],
  [/routerLink='\/home'/g, "routerLink='/'"],
  [/\['\/home'\]/g, "['/']"],
  [/\/home'/g, "/'"], // careful - skip
];

// Remove the overly broad last rule
replacements.pop();

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(ts|html)$/.test(e.name) && !e.name.includes('.spec.')) files.push(p);
  }
  return files;
}

const changed = [];
for (const root of roots) {
  for (const file of walk(root)) {
    let text = fs.readFileSync(file, 'utf8');
    const orig = text;
    for (const [re, to] of replacements) {
      text = text.replace(re, to);
    }
    // navigate(['/home']) style
    text = text.replace(/navigate\(\['\/home'\]\)/g, "navigate(['/'])");
    text = text.replace(/navigateByUrl\('\/home'\)/g, "navigateByUrl('/')");
    // template string product urls already handled via /product/
    // leftover `/blog` without trailing slash in template strings
    text = text.replace(/`\/blog`/g, '`/journal`');
    text = text.replace(/"\/blog"/g, '"/journal"');
    text = text.replace(/'\/blog'/g, "'/journal'");
    text = text.replace(/`\/shop`/g, '`/buy-dry-fruits`');
    text = text.replace(/"\/shop"/g, '"/buy-dry-fruits"');
    text = text.replace(/'\/shop'/g, "'/buy-dry-fruits'");
    if (text !== orig) {
      fs.writeFileSync(file, text);
      changed.push(file);
    }
  }
}

console.log('Updated', changed.length, 'files');
changed.forEach((f) => console.log(' -', f));
