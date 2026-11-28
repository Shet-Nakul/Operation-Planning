import { test } from 'node:test';
import assert from 'node:assert/strict';
import { organizationUpdate } from '../src/lib/organizationForm';
import { displayName } from '../src/lib/displayName';

test('omits an unset contact email instead of sending an invalid empty string', () => {
  assert.deepEqual(organizationUpdate({ name: ' Hospital ', location: ' City ', contact_number: ' 123 ', contact_email: '  ' }, null), {
    name: 'Hospital', location: 'City', contact_number: '123',
  });
});

test('reports when an existing contact email cannot be cleared', () => {
  assert.throws(() => organizationUpdate({ name: 'Hospital', location: '', contact_number: '', contact_email: '' }, 'contact@example.test'), /does not support clearing/);
});

test('formats uppercase names without changing mixed-case names', () => {
  assert.equal(displayName('ALICE SMITH'), 'Alice Smith');
  assert.equal(displayName("MARY-JANE O'NEIL"), "Mary-Jane O'Neil");
  assert.equal(displayName('McDonald'), 'McDonald');
});
