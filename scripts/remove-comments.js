/*
  Removes comments from all .js files under src/ and .html files under public/.
  CSS files are intentionally excluded.
*/

const fs = require('fs');
const path = require('path');
const fsp = fs.promises;
const fg = require('fast-glob');
const stripComments = require('strip-comments');

async function removeCommentsFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const original = await fsp.readFile(filePath, 'utf8');
  let updated = original;

  if (ext === '.js') {
    // Strip JS/JSX comments safely using parser-aware library
    updated = stripComments(original);
  } else if (ext === '.html') {
    // Remove HTML comments: <!-- ... -->
    updated = original.replace(/<!--([\s\S]*?)-->/g, '');
  }

  if (updated !== original) {
    await fsp.writeFile(filePath, updated, 'utf8');
    return true;
  }
  return false;
}

async function main() {
  // Find all target files
  const patterns = [
    'src/**/*.js',
    'public/**/*.html',
  ];

  const files = await fg(patterns, {
    ignore: ['**/node_modules/**', '**/build/**', '**/dist/**'],
    absolute: false,
  });

  let changedCount = 0;
  for (const file of files) {
    const changed = await removeCommentsFromFile(file);
    if (changed) changedCount += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Processed ${files.length} files; modified ${changedCount}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


