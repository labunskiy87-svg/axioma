import { z } from 'zod';
import { fail } from './security.mjs';

const keyInput = z.object({ key:z.string().min(1).max(160).regex(/^[a-z]+:[0-9a-f-]{36}:[a-z0-9_-]+$/) }).strict();

export function registerNotifications(app,db) {
  app.get('/api/notifications/read',async req => {
    if(!req.user)fail(401,'Authentication required');
    const rows=(await db.query('SELECT notification_key FROM notification_reads WHERE user_id=$1',[req.user.actorId])).rows;
    return rows.map(row=>row.notification_key);
  });
  app.post('/api/notifications/read',async req => {
    if(!req.user)fail(401,'Authentication required');
    const {key}=keyInput.parse(req.body);
    await db.query('INSERT INTO notification_reads(user_id,notification_key) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.user.actorId,key]);
    return {ok:true};
  });
}
