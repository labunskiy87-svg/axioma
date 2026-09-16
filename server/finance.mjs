import { randomUUID } from 'node:crypto';
import { digest, fail } from './security.mjs';

export async function transfer(tx, from, to, amount, reference) {
  if (!Number.isSafeInteger(amount) || amount <= 0) fail(400, 'Invalid amount');
  // Stable lock ordering prevents opposing transfers from deadlocking.
  const accounts = (await tx.query('SELECT * FROM accounts WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE', [[from,to]])).rows;
  if (accounts.length !== 2) fail(409, 'Account unavailable');
  if (from !== 'external:clearing' && Number(accounts.find(a => a.id === from).balance) < amount) fail(409, 'Insufficient funds');
  await tx.query('UPDATE accounts SET balance=balance-$2 WHERE id=$1', [from,amount]);
  await tx.query('UPDATE accounts SET balance=balance+$2 WHERE id=$1', [to,amount]);
  await tx.query('INSERT INTO ledger(id,debit_account,credit_account,amount,reference) VALUES ($1,$2,$3,$4,$5)', [randomUUID(),from,to,amount,reference]);
}

export async function once(db, req, operation, fn) {
  const key = req.headers['idempotency-key'];
  if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(key)) fail(400, 'Idempotency-Key required (8-128 characters)');
  const hash = digest(JSON.stringify(req.body ?? {}));
  return db.transaction(async tx => {
    await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${req.user.id}:${operation}:${key}`]);
    const old = (await tx.query('SELECT * FROM idempotency WHERE actor_id=$1 AND operation=$2 AND key=$3', [req.user.id,operation,key])).rows[0];
    if (old) {
      if (old.request_hash !== hash) fail(409, 'Idempotency key reused with different payload');
      return old.response;
    }
    const result = await fn(tx);
    await tx.query('INSERT INTO idempotency(actor_id,operation,key,request_hash,response) VALUES ($1,$2,$3,$4,$5)', [req.user.id,operation,key,hash,JSON.stringify(result)]);
    return result;
  });
}

export function quote(outlet, format, today = new Date().toISOString().slice(0,10)) {
  const base = outlet.prices[format];
  if (!Number.isInteger(base) || base <= 0) fail(409, 'Format unavailable');
  const until = outlet.discount_until instanceof Date ? outlet.discount_until.toISOString().slice(0,10) : outlet.discount_until;
  const discount = until && until >= today ? outlet.discount_bps : 0;
  return Math.round(base * outlet.coefficient_bps * (10000 - discount) / 100000000);
}

export async function audit(tx, actor, action, entity, details = {}) {
  await tx.query('INSERT INTO audit(id,actor_id,action,entity_id,details) VALUES ($1,$2,$3,$4,$5)', [randomUUID(),actor,action,entity,JSON.stringify(details)]);
}
