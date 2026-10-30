import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:3000/api/contacts';
const ids = [];
async function create(name) {
  const response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, notes: 'Disposable deletion test' }) });
  assert.equal(response.status, 201);
  const contact = await response.json();
  ids.push(contact.id);
  return contact.id;
}
try {
  const target = await create('Deletion integration target');
  const survivor = await create('Deletion integration survivor');
  assert.equal((await fetch(`${base}/invalid`, {method:'DELETE'})).status, 400);
  assert.equal((await fetch(`${base}/00000000-0000-4000-8000-000000000000`, {method:'DELETE'})).status, 404);
  const results = await Promise.all([fetch(`${base}/${target}`, {method:'DELETE'}), fetch(`${base}/${target}`, {method:'DELETE'})]);
  assert.deepEqual(results.map(r=>r.status).sort(), [204,404]);
  const remaining = await (await fetch(base, {cache:'no-store'})).json();
  assert.equal(remaining.some(c=>c.id===target),false);
  assert.equal(remaining.some(c=>c.id===survivor),true);
  console.log('PASS: invalid ID, missing contact, concurrent deletion, persistence, unrelated contact preserved');
} finally {
  for (const id of ids) await fetch(`${base}/${id}`, {method:'DELETE'});
}
