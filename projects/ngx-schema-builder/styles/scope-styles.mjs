import { readFileSync, writeFileSync } from 'node:fs';
import postcss from 'postcss';
import prefixSelector from 'postcss-prefix-selector';

const SCOPE = '.jsonjoy';
const file = process.argv[2];

// postcss-prefix-selector handles the rule walk and skips @keyframes steps.
// The transform keeps our policy: leave already-scoped rules alone, collapse
// :root/:host onto the scope root, prefix everything else.
const scoped = postcss([
  prefixSelector({
    prefix: SCOPE,
    transform: (prefix, selector, prefixedSelector) => {
      if (selector.includes(SCOPE)) return selector;
      if (selector === ':root' || selector === ':host') return prefix;
      return prefixedSelector;
    },
  }),
]).process(readFileSync(file, 'utf8'), { from: file }).css;

writeFileSync(file, scoped);
