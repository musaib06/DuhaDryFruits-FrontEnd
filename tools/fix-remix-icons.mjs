import fs from 'fs';
import path from 'path';

const pairs = [
  ['ri-shopping-bag-add-line', 'ri-shopping-bag-3-line'],
  ['ri-delete-bin-6-line3', 'ri-delete-bin-6-line'],
  ['ri-briefcase-4-line-heart', 'ri-shopping-bag-3-line'],
  ['ri-home-5-line-door', 'ri-home-smile-2-line'],
  ['ri-heart-pulse-line-fill', 'ri-heart-pulse-fill'],
  ['ri-exclamation-circle', 'ri-error-warning-line'],
  ['ri-chat-quote', 'ri-chat-quote-line'],
  ['ri-arrow-clockwise', 'ri-refresh-line'],
  ['ri-chevron-left', 'ri-arrow-left-s-line'],
  ['ri-chevron-right', 'ri-arrow-right-s-line'],
  ['ri-bookmark-star', 'ri-bookmark-3-line'],
  ['ri-link-45deg', 'ri-link'],
  ['ri-journal-x', 'ri-file-forbid-line'],
  ['ri-telephone-fill', 'ri-phone-fill'],
  ['ri-geo-alt-fill', 'ri-map-pin-2-fill'],
  ['ri-play-circle me', 'ri-play-circle-line me'],
  // standalone tokens (word-boundary style replacements via spaced forms)
  ['ri ri-quote"', 'ri ri-double-quotes-l"'],
  ['ri ri-quote<', 'ri ri-double-quotes-l<'],
  ['ri ri-youtube ', 'ri ri-youtube-line '],
  ['ri ri-youtube"', 'ri ri-youtube-line"'],
  ['ri ri-inbox ', 'ri ri-inbox-2-line '],
  ['ri ri-inbox"', 'ri ri-inbox-2-line"'],
  ['ri ri-download ', 'ri ri-download-2-line '],
  ['ri ri-download"', 'ri ri-download-2-line"'],
  ['ri ri-clock ', 'ri ri-time-line '],
  ['ri ri-clock"', 'ri ri-time-line"'],
  ['ri ri-instagram"', 'ri ri-instagram-line"'],
  ['ri ri-facebook"', 'ri ri-facebook-circle-fill"'],
  ['ri ri-linkedin"', 'ri ri-linkedin-box-fill"'],
  ['ri ri-telephone"', 'ri ri-phone-line"'],
  ['ri ri-arrow-right ', 'ri ri-arrow-right-line '],
  ['ri ri-arrow-right"', 'ri ri-arrow-right-line"'],
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (/\.(html|ts|scss)$/.test(e.name)) out.push(f);
  }
  return out;
}

const roots = [
  'src/app/main/components/internal/End-user',
  'src/app/main/components/main/end-user',
];

let n = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    let t = fs.readFileSync(file, 'utf8');
    const before = t;
    for (const [from, to] of pairs) {
      t = t.split(from).join(to);
    }
    if (t !== before) {
      fs.writeFileSync(file, t);
      n++;
      console.log('updated', file);
    }
  }
}
console.log('fixed files', n);
