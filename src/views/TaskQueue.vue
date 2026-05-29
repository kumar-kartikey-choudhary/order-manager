<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>Tasks</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar v-model="query" placeholder="Search order, return, customer, channel, brand" />
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="purpose">
          <ion-segment-button value="all">
            <ion-label>All</ion-label>
          </ion-segment-button>
          <ion-segment-button value="grace-period">
            <ion-label>Grace</ion-label>
          </ion-segment-button>
          <ion-segment-button value="repair">
            <ion-label>Repair</ion-label>
          </ion-segment-button>
          <ion-segment-button value="inventory">
            <ion-label>Inventory</ion-label>
          </ion-segment-button>
          <ion-segment-button value="manual">
            <ion-label>Manual</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ErrorState v-if="error" title="Task queue failed" :message="error" />

      <section v-if="taskCards.length" class="task-card-grid">
        <ion-card v-for="taskCard in taskCards" :key="taskCard.workEffort.workEffortId" class="task-card">
          <ion-card-header>
            <div class="task-header">
              <div>
                <ion-card-title>{{ purposeLabel(taskCard.workEffort.purpose) }}</ion-card-title>
                <ion-card-subtitle>{{ taskCard.workEffort.workEffortName }}</ion-card-subtitle>
              </div>
              <ion-badge :color="taskCard.workEffort.priority === 'critical' ? 'danger' : 'medium'">
                {{ taskCard.workEffort.priority }}
              </ion-badge>
            </div>
          </ion-card-header>

          <ion-card-content>
            <ion-list lines="full">
              <ion-item>
                <ion-label>
                  <h3>{{ taskCard.item.displayId }} · {{ taskCard.item.customerName }}</h3>
                  <p>{{ taskCard.item.transactionType }} · {{ taskCard.item.status }} · {{ taskCard.item.channel }}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Next action</h3>
                  <p>{{ taskCard.workEffort.nextStep }}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Assignment</h3>
                  <p>{{ taskCard.workEffort.owner }} · {{ taskCard.workEffort.statusId }}</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Due</h3>
                  <p>{{ formatDateTime(taskCard.workEffort.dueAt) }}</p>
                </ion-label>
                <ion-note slot="end">{{ impactLabel(taskCard.workEffort) }}</ion-note>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Context</h3>
                  <p>{{ taskCard.item.brand }}<span v-if="taskCard.item.facilityName"> · {{ taskCard.item.facilityName }}</span></p>
                </ion-label>
              </ion-item>
            </ion-list>

            <div class="card-actions">
              <ion-button fill="clear" :router-link="`/tasks/${taskCard.workEffort.workEffortId}`">
                Open task
              </ion-button>
              <ion-button fill="clear" @click="operationsStore.assignWorkEffort(taskCard.workEffort.workEffortId, 'Taylor Brooks')">
                Assign
              </ion-button>
              <ion-button fill="outline" :router-link="transactionLink(taskCard.item)">
                Open {{ taskCard.item.transactionType.toLowerCase() }}
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </section>

      <EmptyState
        v-if="!loading && !error && !workItems.length"
        title="No tasks"
        message="Active work linked to orders, returns, refunds, or shipments will appear here."
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
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
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonPage,
  IonProgressBar,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/components/EmptyState.vue';
import ErrorState from '@/components/ErrorState.vue';
import { useOperationsStore } from '@/store/operations';
import type { TransactionWorkItem, WorkEffortPurpose, WorkEffortSummary } from '@/types/operations';

const operationsStore = useOperationsStore();
const { workItems, loading, error } = storeToRefs(operationsStore);
const purpose = ref<WorkEffortPurpose | 'all'>('all');
const query = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
const taskCards = computed(() => {
  return workItems.value.flatMap((item) => {
    return item.activeWorkEfforts.map((workEffort) => ({ item, workEffort }));
  });
});

onMounted(() => {
  loadWorkItems();
});

watch(purpose, () => {
  loadWorkItems();
});

watch(query, () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadWorkItems, 300);
});

function loadWorkItems() {
  operationsStore.loadWorkItems({ purpose: purpose.value, status: 'active', query: query.value });
}

function purposeLabel(value: WorkEffortPurpose) {
  return {
    'grace-period': 'Grace period',
    repair: 'Repair',
    inventory: 'Inventory',
    manual: 'Manual',
  }[value];
}

function transactionLink(item: TransactionWorkItem) {
  if (item.transactionType === 'RETURN') return `/returns/${item.transactionId}`;
  if (item.transactionType === 'ORDER') return `/orders/${item.transactionId}`;
  return '/orders';
}

function impactLabel(workEffort: WorkEffortSummary) {
  const impacts = [];
  if (workEffort.blocksRelease) impacts.push('Blocks release');
  if (workEffort.blocksRefund) impacts.push('Blocks refund');
  if (workEffort.blocksExport) impacts.push('Blocks export');
  return impacts.length ? impacts.join(' · ') : 'No blocking impact';
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
</script>

<style scoped>
.task-card-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  padding: 12px;
}

.task-card {
  margin: 0;
}

.task-header,
.card-actions {
  align-items: center;
  display: flex;
  gap: 8px;
}

.task-header {
  justify-content: space-between;
}

.card-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-block-start: 12px;
}

@media (max-width: 520px) {
  .task-card-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    justify-content: stretch;
  }
}
</style>
