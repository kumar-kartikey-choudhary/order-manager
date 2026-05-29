import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useOperationsStore } from './operations';

describe('operations store actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('loads dashboard WorkEffort queues', async () => {
    const store = useOperationsStore();

    await store.loadDashboard();

    expect(store.summary?.transactionsWithWork).toBe(4);
    expect(store.workItems).toHaveLength(4);
    expect(store.activeWorkEfforts).toHaveLength(4);
  });

  it('assigns WorkEfforts and records assignment history', async () => {
    const store = useOperationsStore();
    await store.loadWorkItems({ status: 'active' });

    store.assignWorkEffort('WE-1001', 'Taylor Brooks');

    const workEffort = store.getWorkEffort('WE-1001');
    expect(workEffort?.owner).toBe('Taylor Brooks');
    expect(workEffort?.statusId).toBe('in-progress');
    expect(workEffort?.activity.at(-1)).toMatchObject({
      event: 'Assigned',
      actor: 'Taylor Brooks',
    });
  });

  it('completes WorkEfforts and moves them into transaction history', async () => {
    const store = useOperationsStore();
    await store.loadWorkItems({ status: 'active' });

    store.completeWorkEffort('WE-1002', 'Address normalized and requeued');

    const transaction = store.getWorkEffortItem('WE-1002');
    expect(transaction?.activeWorkEfforts.find((workEffort) => workEffort.workEffortId === 'WE-1002')).toBeUndefined();
    expect(transaction?.completedWorkEfforts[0]).toMatchObject({
      workEffortId: 'WE-1002',
      statusId: 'completed',
      resolution: 'Address normalized and requeued',
    });
  });

  it('toggles incident mode without calling live services', () => {
    const store = useOperationsStore();

    store.activateIncidentMode('Carrier outage in Northeast');
    expect(store.incidentMode.active).toBe(true);
    expect(store.incidentMode.reason).toBe('Carrier outage in Northeast');

    store.deactivateIncidentMode();
    expect(store.incidentMode.active).toBe(false);
  });
});
