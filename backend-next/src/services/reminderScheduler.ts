import { Transaction } from '../models/Transaction';
import { Entity } from '../models/Entity';
import { DueBookSettings } from '../models/DueBookSettings';
import { ReminderSettings, IReminderSettings } from '../models/ReminderSettings';
import { ReminderQueue } from '../models/ReminderQueue';

const DHAKA_OFFSET_MIN = 6 * 60;

const dhakaNow = (): Date => new Date(Date.now() + DHAKA_OFFSET_MIN * 60_000);

const dhakaHour = (): number => dhakaNow().getUTCHours();

const dhakaDayKey = (d: Date = new Date()): string => {
  const local = new Date(d.getTime() + DHAKA_OFFSET_MIN * 60_000);
  return local.toISOString().slice(0, 10);
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

interface PendingTx {
  amount: number;
  transactionDate: Date;
  notes?: string;
}

const buildMessage = (
  entityName: string,
  totalDue: number,
  shopName: string,
  daysOverdue: number,
  txs: PendingTx[],
): string => {
  const header = shopName?.trim() || 'DueBook';
  const line = '━━━━━━━━━━━━━━━━━━';
  const amount = `Tk ${totalDue.toLocaleString('en-IN')}`;
  const sorted = [...txs].sort(
    (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime(),
  );
  const parts: string[] = [
    `🔔 *Payment Reminder*`,
    line,
    `Hello *${entityName}*,`,
    ``,
    `This is a friendly reminder from *${header}*.`,
    ``,
    `💰 Total due: *${amount}*`,
    `📊 Unpaid entries: *${sorted.length}*`,
    `📅 Pending since: ${fmtDate(sorted[0].transactionDate)}${
      daysOverdue > 0 ? ` (${daysOverdue} day${daysOverdue === 1 ? '' : 's'})` : ''
    }`,
  ];
  const recent = sorted.slice(-3).reverse();
  parts.push(``, `*Recent unpaid:*`);
  for (const t of recent) {
    const note = t.notes?.trim();
    parts.push(
      `• ${fmtDate(t.transactionDate)} — Tk ${t.amount.toLocaleString('en-IN')}${
        note ? ` (${note})` : ''
      }`,
    );
  }
  parts.push(
    line,
    sorted.length > 1
      ? `Your balance has been growing. Kindly clear at your earliest convenience.`
      : `Kindly clear at your earliest convenience.`,
    ``,
    `Thank you! 🙏`,
  );
  return parts.join('\n');
};

const daysBetween = (from: Date, to: Date): number =>
  Math.floor((to.getTime() - from.getTime()) / 86_400_000);

const pickTriggerBand = (daysOverdue: number, bands: number[]): number | null => {
  const sorted = [...bands].filter((n) => n >= 0).sort((a, b) => a - b);
  let match: number | null = null;
  for (const b of sorted) {
    if (daysOverdue >= b) match = b;
  }
  return match;
};

export interface GenerateResult {
  tenantId: string;
  generated: number;
  skipped: number;
  reason?: string;
}

export const generateForTenant = async (
  tenantId: string,
  opts: { force?: boolean } = {},
): Promise<GenerateResult> => {
  const settings = (await ReminderSettings.findOne({ tenantId }).lean()) as
    | IReminderSettings
    | null;
  if (!settings || !settings.enabled) {
    return { tenantId, generated: 0, skipped: 0, reason: 'disabled' };
  }

  const dayKey = dhakaDayKey();
  const now = new Date();

  const pendingIncome = await Transaction.find({
    tenantId,
    direction: 'INCOME',
    status: 'Pending',
  })
    .select('entityId amount transactionDate dueDate notes')
    .lean();

  const byEntity = new Map<
    string,
    { total: number; oldest: Date; txs: PendingTx[] }
  >();

  for (const tx of pendingIncome) {
    const anchor = tx.dueDate ? new Date(tx.dueDate) : new Date(tx.transactionDate);
    const overdueAnchor = anchor.getTime();
    if (overdueAnchor > now.getTime()) continue;

    const key = String(tx.entityId);
    const bucket = byEntity.get(key) || {
      total: 0,
      oldest: new Date(anchor),
      txs: [],
    };
    bucket.total += tx.amount;
    if (anchor.getTime() < bucket.oldest.getTime()) bucket.oldest = new Date(anchor);
    bucket.txs.push({
      amount: tx.amount,
      transactionDate: new Date(tx.transactionDate),
      notes: tx.notes,
    });
    byEntity.set(key, bucket);
  }

  if (byEntity.size === 0) {
    return { tenantId, generated: 0, skipped: 0, reason: 'no-overdue' };
  }

  const entityIds = Array.from(byEntity.keys());
  const entities = await Entity.find({
    _id: { $in: entityIds },
    tenantId,
  })
    .select('name phone')
    .lean();

  const shopDoc = await DueBookSettings.findOne({ tenantId }).select('shopName').lean();
  const shopName = shopDoc?.shopName || '';

  const cooldownMs = settings.cooldownDays * 86_400_000;
  const recentlySent = await ReminderQueue.find({
    tenantId,
    entityId: { $in: entityIds },
    status: 'sent',
    sentAt: { $gte: new Date(Date.now() - cooldownMs) },
  })
    .select('entityId')
    .lean();
  const cooling = new Set(recentlySent.map((r) => String(r.entityId)));

  let generated = 0;
  let skipped = 0;
  const cap = settings.maxRemindersPerRun;

  for (const ent of entities) {
    if (generated >= cap) break;
    const bucket = byEntity.get(String(ent._id));
    if (!bucket) continue;

    if (!ent.phone || !ent.phone.trim()) {
      skipped++;
      continue;
    }
    if (bucket.total < settings.minAmount) {
      skipped++;
      continue;
    }
    if (cooling.has(String(ent._id))) {
      skipped++;
      continue;
    }
    const overdue = daysBetween(bucket.oldest, now);
    const band = pickTriggerBand(overdue, settings.triggerDaysOverdue);
    if (band === null) {
      skipped++;
      continue;
    }

    const message = buildMessage(
      ent.name,
      bucket.total,
      shopName,
      overdue,
      bucket.txs,
    );

    try {
      await ReminderQueue.create({
        tenantId,
        entityId: ent._id,
        entityName: ent.name,
        phone: ent.phone,
        totalDue: bucket.total,
        oldestTxDate: bucket.oldest,
        daysOverdue: overdue,
        txCount: bucket.txs.length,
        triggerReason: `${overdue}d overdue (band ${band}d)`,
        message,
        status: 'pending',
        generatedDay: dayKey,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
      });
      generated++;
    } catch (err: any) {
      if (err?.code === 11000) {
        skipped++;
      } else {
        console.error('[reminders] insert failed', err);
        skipped++;
      }
    }
  }

  return { tenantId, generated, skipped };
};

const runAllDue = async (): Promise<void> => {
  const hour = dhakaHour();
  const tenants = await ReminderSettings.find({
    enabled: true,
    runHourLocal: hour,
  })
    .select('tenantId')
    .lean();

  if (tenants.length === 0) return;
  console.log(`[reminders] hour=${hour} tenants=${tenants.length} — generating`);

  for (const t of tenants) {
    try {
      const result = await generateForTenant(t.tenantId);
      if (result.generated > 0 || result.skipped > 0) {
        console.log(
          `[reminders] tenant=${t.tenantId} generated=${result.generated} skipped=${result.skipped}`,
        );
      }
    } catch (err) {
      console.error(`[reminders] tenant=${t.tenantId} failed`, err);
    }
  }
};

let started = false;

export const startReminderScheduler = (): void => {
  if (started) return;
  started = true;
  const HOUR_MS = 60 * 60 * 1000;
  setInterval(() => {
    runAllDue().catch((e) => console.error('[reminders] runAllDue error', e));
  }, HOUR_MS);
  setTimeout(() => {
    runAllDue().catch((e) => console.error('[reminders] initial run error', e));
  }, 60_000);
  console.log('[reminders] scheduler started (hourly)');
};
