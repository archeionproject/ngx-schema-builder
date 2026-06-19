import { accessSync, constants, readFileSync, writeFileSync } from 'node:fs';
import postcss from 'postcss';
import prefixSelector from 'postcss-prefix-selector';

const SCOPE = '.jsonjoy';
const file = process.argv[2];

function fail(message) {
  console.error(`scope-styles: ${message}`);
  process.exit(1);
}

if (!file) {
  fail('missing CSS file argument (usage: node scope-styles.mjs <file.css>)');
}

try {
  accessSync(file, constants.R_OK | constants.W_OK);
} catch {
  fail(`cannot read/write file: ${file}`);
}

let source;
try {
  source = readFileSync(file, 'utf8');
} catch (error) {
  fail(`failed to read ${file}: ${error.message}`);
}

// Leave already-scoped rules alone, collapse :root/:host onto the scope, prefix the rest.
let scoped;
try {
  scoped = postcss([
    prefixSelector({
      prefix: SCOPE,
      transform: (prefix, selector, prefixedSelector) => {
        if (selector.includes(SCOPE)) return selector;
        if (selector === ':root' || selector === ':host') return prefix;
        return prefixedSelector;
      },
    }),
  ]).process(source, { from: file }).css;
} catch (error) {
  fail(`failed to transform ${file}: ${error.message}`);
}

try {
  writeFileSync(file, scoped);
} catch (error) {
  fail(`failed to write ${file}: ${error.message}`);
}
