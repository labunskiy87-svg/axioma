import { z } from 'zod';
export const uuid = z.string().uuid();
export const format = z.enum(['article','news','post','longread']);
export const url = z.string().url().max(2048).refine(v => ['http:','https:'].includes(new URL(v).protocol), 'HTTP(S) URL required');
export const credentials = z.object({ email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), password: z.string().min(12).max(128) }).strict();
export const materialInput = z.object({
  advertiserId: uuid, projectId: uuid.nullable().default(null),
  title: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(100000), format,
  metadata: z.object({ tags: z.string().max(500).optional(), title: z.string().max(200).optional(), description: z.string().max(1000).optional(), desiredUrl: z.string().max(2048).optional(), notes: z.string().max(10000).optional(), attachments:z.array(uuid).max(50).refine(v=>new Set(v).size===v.length).optional() }).strict().default({}),
}).strict();
export const outletInput = z.object({
  name: z.string().trim().min(1).max(200), url,
  kind: z.enum(['media','telegram','vk','max','dzen']), geography: z.string().trim().min(1).max(100),
  details: z.object({
    logoFileId:uuid.optional(),
    logoUrl: url.optional(), topics: z.array(z.string().max(100)).max(30).default([]),
    goals: z.array(z.enum(['pr','seo','serm'])).max(3).default([]),
    aggregators: z.array(z.enum(['google_news','dzen','mail_news'])).max(3).default([]),
    subscribers:z.number().int().min(0).max(1000000000).optional(),
    publicationDaysByFormat:z.partialRecord(format,z.number().int().min(1).max(365)).optional(),
    responseHours:z.number().int().min(1).max(168).optional(),
    storageIndefinite:z.boolean().default(false),
    dailyAudience: z.number().int().min(0).max(1000000000).optional(),
    metrikaUrl: url.optional(), medialogiaRank: z.number().int().min(1).max(10000).optional(),
    requirements: z.string().max(20000).default(''),
    publicationDays: z.number().int().min(1).max(365).default(2),
    storageMonths: z.number().int().min(1).max(1200).default(24),
  }).strict(),
  prices: z.partialRecord(format,z.number().int().min(100).max(100000000)).refine(v => Object.keys(v).length > 0),
  coefficientBps: z.number().int().min(1000).max(30000).default(10000),
  discountBps: z.number().int().min(0).max(9000).default(0),
  discountUntil: z.iso.date().nullable().default(null),
}).strict().refine(v => !v.discountBps || v.discountUntil, 'Discount end date required');
