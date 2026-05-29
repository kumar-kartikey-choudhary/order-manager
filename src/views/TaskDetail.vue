<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tasks" />
        </ion-buttons>
        <ion-title>{{ workEffort?.workEffortId || 'Task' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-progress-bar v-if="loading" type="indeterminate" />

      <section v-if="workEffort && transaction" class="task-detail-layout">
        <main class="task-main">
          <ion-card class="task-card">
            <ion-card-header>
              <div class="task-title-row">
                <div>
                  <ion-card-title>{{ workEffort.workEffortName }}</ion-card-title>
                  <ion-card-subtitle>{{ workEffort.workEffortTypeId }} · {{ workEffort.statusId }}</ion-card-subtitle>
                </div>
                <ion-badge>{{ workEffort.priority }}</ion-badge>
              </div>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-label>
                    <h2>Task type</h2>
                    <p>{{ taskKindLabel }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Owner</h2>
                    <p>{{ workEffort.owner }} · {{ workEffort.team }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Next action</h2>
                    <p>{{ workEffort.nextStep }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Impact</h2>
                    <p>{{ impactText }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Due</h2>
                    <p>{{ formatDateTime(workEffort.dueAt) }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <ion-card class="task-card">
            <ion-card-header>
              <ion-card-title>Resolve task</ion-card-title>
              <ion-card-subtitle>{{ resolutionSubtitle }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-list v-if="workEffort.purpose === 'repair'">
                <ion-item>
                  <ion-input v-model="addressForm.address1" label="Address line 1" label-placement="stacked" />
                </ion-item>
                <ion-item>
                  <ion-input v-model="addressForm.address2" label="Apartment, suite, unit" label-placement="stacked" />
                </ion-item>
                <ion-item>
                  <ion-input v-model="addressForm.city" label="City" label-placement="stacked" />
                </ion-item>
                <ion-item>
                  <ion-input v-model="addressForm.state" label="State" label-placement="stacked" />
                </ion-item>
                <ion-item>
                  <ion-input v-model="addressForm.postalCode" label="Postal code" label-placement="stacked" />
                </ion-item>
                <ion-item>
                  <ion-input v-model="addressForm.country" label="Country" label-placement="stacked" />
                </ion-item>
              </ion-list>

              <ion-list v-else-if="workEffort.purpose === 'inventory'">
                <ion-item>
                  <ion-select v-model="inventoryForm.decision" label="Inventory decision" label-placement="stacked" interface="popover">
                    <ion-select-option value="reserve-new-jersey">Reserve from New Jersey DC</ion-select-option>
                    <ion-select-option value="reserve-kentucky">Reserve from Kentucky 3PL</ion-select-option>
                    <ion-select-option value="split-shipment">Split shipment across facilities</ion-select-option>
                    <ion-select-option value="backorder">Backorder missing component</ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item>
                  <ion-input v-model="inventoryForm.sku" label="Replacement or component SKU" label-placement="stacked" />
                </ion-item>
                <ion-item>
                  <ion-textarea v-model="inventoryForm.note" label="Inventory note" label-placement="stacked" auto-grow />
                </ion-item>
              </ion-list>

              <ion-list v-else-if="workEffort.purpose === 'grace-period'">
                <ion-item>
                  <ion-select v-model="graceForm.decision" label="Grace period decision" label-placement="stacked" interface="popover">
                    <ion-select-option value="release">Release order</ion-select-option>
                    <ion-select-option value="cancel">Cancel order</ion-select-option>
                    <ion-select-option value="extend">Extend grace period</ion-select-option>
                    <ion-select-option value="wait">Keep waiting</ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item>
                  <ion-textarea v-model="graceForm.note" label="Decision note" label-placement="stacked" auto-grow />
                </ion-item>
              </ion-list>

              <ion-list v-else>
                <ion-item>
                  <ion-select v-model="manualForm.decision" label="Supervisor decision" label-placement="stacked" interface="popover">
                    <ion-select-option value="release">Release order</ion-select-option>
                    <ion-select-option value="keep-hold">Keep order on hold</ion-select-option>
                    <ion-select-option value="escalate">Escalate to manager</ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item>
                  <ion-textarea v-model="manualForm.note" label="Decision note" label-placement="stacked" auto-grow />
                </ion-item>
              </ion-list>

              <div class="action-row">
                <ion-button fill="outline" @click="operationsStore.assignWorkEffort(workEffort.workEffortId, 'Taylor Brooks')">
                  Assign to me
                </ion-button>
                <ion-button fill="outline" @click="operationsStore.extendWorkEffort(workEffort.workEffortId)">
                  Extend due date
                </ion-button>
                <ion-button @click="resolveTask">
                  {{ resolveButtonLabel }}
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="task-card">
            <ion-card-header>
              <ion-card-title>Assignment and activity history</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item v-for="activity in workEffort.activity" :key="activity.id">
                  <ion-label>
                    <h2>{{ activity.event }} · {{ activity.actor }}</h2>
                    <p>{{ formatDateTime(activity.at) }}</p>
                    <p>{{ activity.note }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </main>

        <aside class="order-side-panel">
          <ion-card class="task-card">
            <ion-card-header>
              <ion-card-title>Order summary</ion-card-title>
              <ion-card-subtitle>{{ transaction.displayId }} · {{ transaction.customerName }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-label>
                    <h2>Status</h2>
                    <p>{{ transaction.status }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Channel</h2>
                    <p>{{ transaction.channel }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Brand</h2>
                    <p>{{ transaction.brand }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Facility</h2>
                    <p>{{ transaction.facilityName || 'Not assigned' }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Order total</h2>
                    <p>{{ formatMoney(transaction.total, transaction.currency) }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h2>Active tasks</h2>
                    <p>{{ transaction.activeWorkEfforts.length }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>

              <ion-button expand="block" :router-link="transactionLink(transaction)">
                Open full order
              </ion-button>
            </ion-card-content>
          </ion-card>
        </aside>
      </section>

      <EmptyState
        v-if="!loading && !workEffort"
        title="Task not found"
        message="Return to the task queue to choose another item."
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/components/EmptyState.vue';
import { useOperationsStore } from '@/store/operations';
import type { TransactionWorkItem, WorkEffortPurpose } from '@/types/operations';

const props = defineProps<{
  taskId: string;
}>();

const operationsStore = useOperationsStore();
const { loading } = storeToRefs(operationsStore);
const workEffort = computed(() => operationsStore.getWorkEffort(props.taskId));
const transaction = computed(() => operationsStore.getWorkEffortItem(props.taskId));

const addressForm = ref({
  address1: '125 Market Street',
  address2: '',
  city: 'San Francisco',
  state: 'CA',
  postalCode: '94105',
  country: 'USA',
});
const inventoryForm = ref({
  decision: 'reserve-new-jersey',
  sku: 'KIT-COMP-204',
  note: 'Use available stock at the alternate facility before release.',
});
const graceForm = ref({
  decision: 'release',
  note: 'Cancellation window expired with no customer change request.',
});
const manualForm = ref({
  decision: 'release',
  note: 'Supervisor reviewed the customer note and approved release.',
});

const purposeLabels: Record<WorkEffortPurpose, string> = {
  'grace-period': 'Grace period',
  repair: 'Repair',
  inventory: 'Inventory',
  manual: 'Manual review',
};

const taskKindLabel = computed(() => workEffort.value ? purposeLabels[workEffort.value.purpose] : '');
const resolutionSubtitle = computed(() => {
  if (!workEffort.value) return '';

  const subtitles: Record<WorkEffortPurpose, string> = {
    'grace-period': 'Decide whether the order can move forward after the waiting window.',
    repair: 'Update the order data that failed validation, then requeue fulfillment.',
    inventory: 'Choose how inventory should be reserved or substituted before release.',
    manual: 'Record the supervisor decision that clears or extends the hold.',
  };
  return subtitles[workEffort.value.purpose];
});
const resolveButtonLabel = computed(() => {
  if (!workEffort.value) return 'Complete task';

  const labels: Record<WorkEffortPurpose, string> = {
    'grace-period': 'Apply decision',
    repair: 'Save address and requeue',
    inventory: 'Apply inventory decision',
    manual: 'Apply manual decision',
  };
  return labels[workEffort.value.purpose];
});
const impactText = computed(() => {
  if (!workEffort.value) return '';

  const impacts = [];
  if (workEffort.value.blocksRelease) impacts.push('Blocks release');
  if (workEffort.value.blocksRefund) impacts.push('Blocks refund');
  if (workEffort.value.blocksExport) impacts.push('Blocks export');
  return impacts.length ? impacts.join(' · ') : 'No blocking impact';
});

onMounted(async () => {
  if (!workEffort.value) await operationsStore.loadWorkItems({ status: 'all' });
});

function resolveTask() {
  if (!workEffort.value) return;

  const workEffortId = workEffort.value.workEffortId;
  if (workEffort.value.purpose === 'repair') {
    const address = [
      addressForm.value.address1,
      addressForm.value.address2,
      addressForm.value.city,
      addressForm.value.state,
      addressForm.value.postalCode,
      addressForm.value.country,
    ].filter(Boolean).join(', ');
    operationsStore.addWorkEffortNote(workEffortId, `Shipping address updated to ${address}.`);
    operationsStore.completeWorkEffort(workEffortId, 'Address normalized and order requeued for fulfillment.');
    return;
  }

  if (workEffort.value.purpose === 'inventory') {
    operationsStore.addWorkEffortNote(workEffortId, `${inventoryDecisionLabel(inventoryForm.value.decision)}. ${inventoryForm.value.note}`);
    operationsStore.completeWorkEffort(workEffortId, 'Inventory decision applied and order re-evaluated.');
    return;
  }

  if (workEffort.value.purpose === 'grace-period') {
    if (graceForm.value.decision === 'extend' || graceForm.value.decision === 'wait') {
      operationsStore.addWorkEffortNote(workEffortId, `${graceDecisionLabel(graceForm.value.decision)}. ${graceForm.value.note}`);
      operationsStore.extendWorkEffort(workEffortId);
      return;
    }

    operationsStore.addWorkEffortNote(workEffortId, `${graceDecisionLabel(graceForm.value.decision)}. ${graceForm.value.note}`);
    operationsStore.completeWorkEffort(workEffortId, `Grace period decision applied: ${graceDecisionLabel(graceForm.value.decision)}.`);
    return;
  }

  if (manualForm.value.decision === 'keep-hold' || manualForm.value.decision === 'escalate') {
    operationsStore.addWorkEffortNote(workEffortId, `${manualDecisionLabel(manualForm.value.decision)}. ${manualForm.value.note}`);
    operationsStore.extendWorkEffort(workEffortId);
    return;
  }

  operationsStore.addWorkEffortNote(workEffortId, `${manualDecisionLabel(manualForm.value.decision)}. ${manualForm.value.note}`);
  operationsStore.completeWorkEffort(workEffortId, 'Manual review completed and order released for re-evaluation.');
}

function transactionLink(item: TransactionWorkItem) {
  if (item.transactionType === 'RETURN') return `/returns/${item.transactionId}`;
  if (item.transactionType === 'ORDER') return `/orders/${item.transactionId}`;
  return '/orders';
}

function inventoryDecisionLabel(decision: string) {
  const labels: Record<string, string> = {
    'reserve-new-jersey': 'Reserve from New Jersey DC',
    'reserve-kentucky': 'Reserve from Kentucky 3PL',
    'split-shipment': 'Split shipment across facilities',
    backorder: 'Backorder missing component',
  };
  return labels[decision] || decision;
}

function graceDecisionLabel(decision: string) {
  const labels: Record<string, string> = {
    release: 'Release order',
    cancel: 'Cancel order',
    extend: 'Extend grace period',
    wait: 'Keep waiting',
  };
  return labels[decision] || decision;
}

function manualDecisionLabel(decision: string) {
  const labels: Record<string, string> = {
    release: 'Release order',
    'keep-hold': 'Keep order on hold',
    escalate: 'Escalate to manager',
  };
  return labels[decision] || decision;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMoney(value?: number, currency = 'USD') {
  if (value === undefined) return 'Not available';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}
</script>

<style scoped>
.task-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 12px;
  align-items: start;
  padding: 12px;
}

.task-main,
.order-side-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  margin: 0;
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}

@media (max-width: 900px) {
  .task-detail-layout {
    grid-template-columns: 1fr;
  }

  .action-row ion-button {
    flex: 1 1 100%;
  }
}
</style>
