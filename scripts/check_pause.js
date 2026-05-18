/**
 * pause() 検知チェッカー
 * npm run pretest_s から自動で呼ばれる。
 * tests/shimamura/ 配下のテストファイルに pause() が残っていれば
 * 場所を表示して exit 1 で止める。
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '..', 'tests', 'shimamura');
const PAUSE_PATTERN = /\bpause\s*\(\s*\)/;

const found = [];

const files = fs.readdirSync(TARGET_DIR).filter((f) => f.endsWith('.js'));
for (const file of files) {
  const filePath = path.join(TARGET_DIR, file);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const trimmed = line.trimStart();
    if (PAUSE_PATTERN.test(line) && !trimmed.startsWith('//')) {
      const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
      found.push(`  ${rel}:${i + 1}  →  ${trimmed.trimEnd()}`);
    }
  });
}

if (found.length > 0) {
  console.error('\n❌ pause() が残っています。削除してから再実行してください:\n');
  found.forEach((line) => console.error(line));
  console.error('');
  process.exit(1);
} else {
  console.log('✅ pause() チェック OK');
}
