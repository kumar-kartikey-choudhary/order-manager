export type TransactionType = 'ORDER' | 'RETURN' | 'REFUND' | 'SHIPMENT';
export type WorkEffortPurpose = 'grace-period' | 'repair' | 'inventory' | 'manual';
export type WorkEffortStatus = 'open' | 'in-progress' | 'completed' | 'cancelled';
export type OperationsPriority = 'critical' | 'high' | 'medium' | 'low';
export type BlockingState = 'blocked' | 'action-required' | 'ready';

export interface WorkEffortActivity {
  id: string;
  at: string;
  actor: string;
  event: string;
  note: string;
}

export interface WorkEffortSummary {
  workEffortId: string;
  workEffortName: string;
  workEffortTypeId: string;
  purpose: WorkEffortPurpose;
  statusId: WorkEffortStatus;
  owner: string;
  team: string;
  priority: OperationsPriority;
  dueAt: string;
  blocksRelease: boolean;
  blocksRefund: boolean;
  blocksExport: boolean;
  nextStep: string;
  activity: WorkEffortActivity[];
  resolution?: string;
}

export interface TransactionWorkItem {
  transactionType: TransactionType;
  transactionId: string;
  displayId: string;
  customerName: string;
  channel: string;
  brand: string;
  status: string;
  facilityName?: string;
  total?: number;
  currency?: string;
  blockingState: BlockingState;
  activeWorkEfforts: WorkEffortSummary[];
  completedWorkEfforts: WorkEffortSummary[];
}

export interface IncidentMode {
  active: boolean;
  reason: string;
  activatedAt: string;
}

export interface OperationsSummary {
  transactionsWithWork: number;
  activeWorkEfforts: number;
  gracePeriod: number;
  repairs: number;
  inventory: number;
  manual: number;
  readyToRelease: number;
}

export interface WorkItemSearchParams {
  query?: string;
  purpose?: WorkEffortPurpose | 'all';
  status?: WorkEffortStatus | 'active' | 'all';
  owner?: string;
  transactionType?: TransactionType | 'all';
}
