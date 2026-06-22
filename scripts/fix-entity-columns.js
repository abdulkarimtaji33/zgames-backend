const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (entry.name.endsWith('.entity.ts')) files.push(fullPath);
  }
  return files;
}

const root = path.join(__dirname, '..', 'src');
const files = walk(root);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  content = content.replace(
    /@Column\(\{\s*nullable:\s*true,\s*length:\s*(\d+)\s*\}\)/g,
    (_match, length) => {
      changed = true;
      return `@Column({ type: 'varchar', length: ${length}, nullable: true })`;
    },
  );

  content = content.replace(
    /@Column\(\{\s*nullable:\s*true\s*\}\)/g,
    () => {
      changed = true;
      return `@Column({ type: 'varchar', length: 36, nullable: true })`;
    },
  );

  content = content.replace(
    /(@Column\(\{ type: 'varchar', length: \d+, nullable: true \}\)\s*\n\s*\w+: )string;/g,
    '$1string | null;',
  );

  content = content.replace(
    /(@Column\(\{ nullable: true, type: 'text' \}\)\s*\n\s*\w+: )string;/g,
    '$1string | null;',
  );

  if (changed || content.includes("type: 'varchar'")) {
    fs.writeFileSync(file, content);
    console.log('Updated', path.relative(root, file));
  }
}

console.log('Entity column metadata fixed');
