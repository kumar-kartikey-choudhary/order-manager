import { describe, expect, it } from 'vitest';
import {
  getOperationsSummary,
  searchTransactionWorkItems
} from './operations';

describe('operations service data', () => {
  it('returns transaction work items filtered by WorkEffort purpose', async () => {
    const result = await searchTransactionWorkItems({
      purpose: 'grace-period',
      status: 'active',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      transactionId: 'M100051',
      displayId: '#A1001',
      transactionType: 'ORDER',
    });
    expect(result[0].activeWorkEfforts[0]).toMatchObject({
      workEffortId: 'WE-1001',
      purpose: 'grace-period',
      blocksRelease: true,
    });
  });

  it('searches across order, return, customer, channel, and brand context', async () => {
    const result = await searchTransactionWorkItems({
      query: 'Olivia',
      status: 'active',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      transactionType: 'ORDER',
      transactionId: 'M100053',
      customerName: 'Olivia Reed',
    });
  });

  it('builds a dashboard summary from active WorkEfforts', async () => {
    const summary = await getOperationsSummary();

    expect(summary).toMatchObject({
      transactionsWithWork: 4,
      activeWorkEfforts: 4,
      gracePeriod: 1,
      repairs: 1,
      inventory: 1,
      manual: 1,
      readyToRelease: 0,
    });
  });

  it('filters inventory work separately from other hold kinds', async () => {
    const result = await searchTransactionWorkItems({
      purpose: 'inventory',
      status: 'active',
    });

    expect(result.map((item) => item.transactionId)).toEqual(['M100053']);
    expect(result[0].activeWorkEfforts[0]).toMatchObject({
      workEffortId: 'WE-1003',
      purpose: 'inventory',
    });
  });
});
