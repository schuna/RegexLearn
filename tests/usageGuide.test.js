const assert = require('assert');
const steps = require('../src/data/usageGuideSteps.json');

assert.strictEqual(steps.length, 4);
assert.strictEqual(new Set(steps.map(([title]) => title)).size, steps.length);
for (const [title, description] of steps) {
  assert.ok(title && description, 'Every guide step needs a title and description');
}
assert.ok(steps.some(([, description]) => description.includes('치환')));
assert.ok(steps.some(([, description]) => description.includes('북마크')));

console.log('Usage guide content tests passed');
