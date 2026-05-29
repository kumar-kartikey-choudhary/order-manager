import type {
  OperationsSummary,
  TransactionWorkItem,
  WorkEffortPurpose,
  WorkEffortStatus,
  WorkItemSearchParams
} from '@/types/operations';

const transactionWorkItems: TransactionWorkItem[] = [
  {
    transactionType: 'ORDER',
    transactionId: 'M100051',
    displayId: '#A1001',
    customerName: 'Maya Chen',
    channel: 'Shopify',
    brand: 'Laura Geller',
    status: 'ORDER_APPROVED',
    facilityName: 'New Jersey DC',
    total: 86.5,
    currency: 'USD',
    blockingState: 'blocked',
    activeWorkEfforts: [
      {
        workEffortId: 'WE-1001',
        workEffortName: 'Cancellation grace period',
        workEffortTypeId: 'ORDER_GRACE_PERIOD',
        purpose: 'grace-period',
        statusId: 'open',
        owner: 'Unassigned',
        team: 'Order Ops',
        priority: 'high',
        dueAt: '2026-05-29T12:30:00+05:30',
        blocksRelease: true,
        blocksRefund: false,
        blocksExport: false,
        nextStep: 'Wait for the cancellation window to expire, then release or cancel.',
        activity: [
          {
            id: 'WEA-1001-1',
            at: '2026-05-29T09:00:00+05:30',
            actor: 'System',
            event: 'Created',
            note: 'Grace period started before warehouse release.',
          },
          {
            id: 'WEA-1001-2',
            at: '2026-05-29T09:05:00+05:30',
            actor: 'Order Ops',
            event: 'Assigned team',
            note: 'Assigned to Order Ops for release review.',
          },
        ],
      },
    ],
    completedWorkEfforts: [],
  },
  {
    transactionType: 'ORDER',
    transactionId: 'M100052',
    displayId: '#A1002',
    customerName: 'Priya Shah',
    channel: 'Amazon',
    brand: 'Julep',
    status: 'ORDER_CREATED',
    facilityName: 'Kentucky 3PL',
    total: 24,
    currency: 'USD',
    blockingState: 'blocked',
    activeWorkEfforts: [
      {
        workEffortId: 'WE-1002',
        workEffortName: 'Fix shipping address',
        workEffortTypeId: 'ORDER_REPAIR',
        purpose: 'repair',
        statusId: 'in-progress',
        owner: 'Sam Rivera',
        team: 'CSR',
        priority: 'critical',
        dueAt: '2026-05-29T11:30:00+05:30',
        blocksRelease: true,
        blocksRefund: false,
        blocksExport: false,
        nextStep: 'Collect suite number, normalize address, then requeue the order.',
        activity: [
          {
            id: 'WEA-1002-1',
            at: '2026-05-29T09:20:00+05:30',
            actor: 'System',
            event: 'Created',
            note: 'Carrier validation failed because suite number is missing.',
          },
          {
            id: 'WEA-1002-2',
            at: '2026-05-29T09:25:00+05:30',
            actor: 'Sam Rivera',
            event: 'Started',
            note: 'Customer contact attempt started.',
          },
        ],
      },
    ],
    completedWorkEfforts: [],
  },
  {
    transactionType: 'ORDER',
    transactionId: 'M100053',
    displayId: '#A1003',
    customerName: 'Olivia Reed',
    channel: 'Shopify',
    brand: 'Mally Beauty',
    status: 'ORDER_APPROVED',
    facilityName: 'New Jersey DC',
    total: 59,
    currency: 'USD',
    blockingState: 'action-required',
    activeWorkEfforts: [
      {
        workEffortId: 'WE-1003',
        workEffortName: 'Find inventory for kit component',
        workEffortTypeId: 'ORDER_INVENTORY_HOLD',
        purpose: 'inventory',
        statusId: 'open',
        owner: 'Inventory Ops',
        team: 'Inventory',
        priority: 'high',
        dueAt: '2026-05-29T14:00:00+05:30',
        blocksRelease: true,
        blocksRefund: false,
        blocksExport: false,
        nextStep: 'Confirm whether the missing kit component can ship from another facility.',
        activity: [
          {
            id: 'WEA-1003-1',
            at: '2026-05-29T10:10:00+05:30',
            actor: 'System',
            event: 'Created',
            note: 'Primary facility does not have enough available inventory.',
          },
        ],
      },
    ],
    completedWorkEfforts: [],
  },
  {
    transactionType: 'ORDER',
    transactionId: 'M100054',
    displayId: '#A1004',
    customerName: 'Nora Patel',
    channel: 'TikTok Shop',
    brand: 'Laura Geller',
    status: 'ORDER_APPROVED',
    facilityName: 'New Jersey DC',
    total: 112,
    currency: 'USD',
    blockingState: 'action-required',
    activeWorkEfforts: [
      {
        workEffortId: 'WE-1004',
        workEffortName: 'Supervisor release review',
        workEffortTypeId: 'ORDER_MANUAL_HOLD',
        purpose: 'manual',
        statusId: 'open',
        owner: 'Order Ops Lead',
        team: 'Order Ops',
        priority: 'medium',
        dueAt: '2026-05-29T15:00:00+05:30',
        blocksRelease: true,
        blocksRefund: false,
        blocksExport: false,
        nextStep: 'Review customer note and decide whether to release or keep the order paused.',
        activity: [
          {
            id: 'WEA-1004-1',
            at: '2026-05-29T10:35:00+05:30',
            actor: 'Taylor Brooks',
            event: 'Created',
            note: 'CSR requested a manual pause after customer asked to change the order.',
          },
        ],
      },
    ],
    completedWorkEfforts: [],
  },
];

export async function searchTransactionWorkItems(params: WorkItemSearchParams = {}) {
  const query = params.query?.trim().toLowerCase() || '';

  return clone(transactionWorkItems)
    .map((item) => filterWorkEfforts(item, params))
    .filter((item) => {
      const hasMatchingWork = item.activeWorkEfforts.length || item.completedWorkEfforts.length;
      const transactionMatches = !query || [
        item.transactionId,
        item.displayId,
        item.customerName,
        item.channel,
        item.brand,
        item.status,
      ].some((value) => value.toLowerCase().includes(query));

      return hasMatchingWork && transactionMatches;
    });
}

export async function getOperationsSummary(): Promise<OperationsSummary> {
  const activeEfforts = transactionWorkItems.flatMap((item) => item.activeWorkEfforts);

  return {
    transactionsWithWork: transactionWorkItems.filter((item) => item.activeWorkEfforts.length).length,
    activeWorkEfforts: activeEfforts.length,
    gracePeriod: countPurpose(activeEfforts, 'grace-period'),
    repairs: countPurpose(activeEfforts, 'repair'),
    inventory: countPurpose(activeEfforts, 'inventory'),
    manual: countPurpose(activeEfforts, 'manual'),
    readyToRelease: transactionWorkItems.filter((item) => item.blockingState === 'ready').length,
  };
}

function filterWorkEfforts(item: TransactionWorkItem, params: WorkItemSearchParams) {
  const clonedItem = clone(item);
  const status = params.status || 'active';

  const filterEffort = (statusId: WorkEffortStatus) => {
    const statusMatches = status === 'all' || (status === 'active' ? statusId !== 'completed' && statusId !== 'cancelled' : statusId === status);
    return statusMatches;
  };

  const effortMatches = (effort: TransactionWorkItem['activeWorkEfforts'][number]) => {
    const purposeMatches = !params.purpose || params.purpose === 'all' || effort.purpose === params.purpose;
    const ownerMatches = !params.owner || params.owner === 'All' || effort.owner === params.owner;
    return purposeMatches && ownerMatches && filterEffort(effort.statusId);
  };

  const transactionTypeMatches = !params.transactionType || params.transactionType === 'all' || clonedItem.transactionType === params.transactionType;

  if (!transactionTypeMatches) {
    clonedItem.activeWorkEfforts = [];
    clonedItem.completedWorkEfforts = [];
    return clonedItem;
  }

  clonedItem.activeWorkEfforts = clonedItem.activeWorkEfforts.filter(effortMatches);
  clonedItem.completedWorkEfforts = clonedItem.completedWorkEfforts.filter(effortMatches);
  return clonedItem;
}

function countPurpose(efforts: Array<{ purpose: WorkEffortPurpose }>, purpose: WorkEffortPurpose) {
  return efforts.filter((effort) => effort.purpose === purpose).length;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
