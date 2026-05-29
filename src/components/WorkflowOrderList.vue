<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar v-model="filters.query" :placeholder="searchPlaceholder" />
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-list-header>
          <ion-label>Filters</ion-label>
          <ion-button fill="clear" @click="clearFilters">Clear</ion-button>
        </ion-list-header>
        <ion-item>
          <ion-select v-model="filters.productStoreId" label="Product store" interface="popover">
            <ion-select-option value="All">All stores</ion-select-option>
            <ion-select-option v-for="store in store.productStores" :key="store.id" :value="store.id">
              {{ store.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-select v-model="filters.salesChannelEnumId" label="Channel" interface="popover">
            <ion-select-option value="All">All channels</ion-select-option>
            <ion-select-option v-for="channel in store.channels" :key="channel" :value="channel">
              {{ formatChannel(channel) }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item v-if="showFacility">
          <ion-select v-model="filters.facilityId" label="Facility" interface="popover">
            <ion-select-option value="All">All facilities</ion-select-option>
            <ion-select-option v-for="facility in store.facilities" :key="facility.id" :value="facility.id">
              {{ facility.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-select v-model="filters.priority" label="Priority" interface="popover">
            <ion-select-option value="All">All priorities</ion-select-option>
            <ion-select-option v-for="priority in store.priorities" :key="priority" :value="priority">
              {{ priority }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-input v-model="filters.dateFrom" label="From" type="date" />
        </ion-item>
        <ion-item>
          <ion-input v-model="filters.dateThru" label="Thru" type="date" />
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>
            {{ orders.length }} {{ orders.length === 1 ? 'order' : 'orders' }}
            <span v-if="orders.length" class="select-all-link">
              ·
              <ion-button fill="clear" size="small" @click="toggleSelectAll">
                {{ allSelected ? 'Clear selection' : 'Select all' }}
              </ion-button>
            </span>
          </ion-label>
        </ion-list-header>
        <ion-item v-for="order in orders" :key="order.orderId">
          <ion-checkbox
            slot="start"
            :checked="selectedIds.has(order.orderId)"
            @ion-change="toggleSelection(order.orderId)"
          />
          <ion-label>
            <h2>{{ order.orderName }} · {{ order.externalId }}</h2>
            <p>{{ order.customerName }} · {{ order.productStoreName }} · {{ formatChannel(order.salesChannelEnumId) }}</p>
            <p>
              {{ formatDate(order.orderDate) }} · {{ order.itemCount }} item{{ order.itemCount === 1 ? '' : 's' }} ·
              {{ order.shipmentMethodDesc }}
              <template v-if="order.facilityName"> · {{ order.facilityName }}</template>
            </p>
          </ion-label>
          <ion-note slot="end" :color="priorityColor(order.priority)">
            <div>{{ order.priority }}</div>
            <div>{{ formatCurrency(order.grandTotal, order.currencyUomId) }}</div>
          </ion-note>
        </ion-item>
      </ion-list>

      <EmptyState
        v-if="!orders.length"
        :title="emptyTitle"
        :message="emptyMessage"
      />
    </ion-content>

    <ion-footer v-if="selectedIds.size > 0">
      <ion-toolbar color="light">
        <ion-buttons slot="start">
          <ion-button fill="clear" @click="store.clearSelection(bucket)">
            Clear ({{ selectedIds.size }})
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button
            v-for="action in actions"
            :key="action.id"
            :color="action.color || 'primary'"
            fill="solid"
            @click="runAction(action)"
          >
            {{ action.label }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>

    <ion-toast
      :is-open="!!toastMessage"
      :message="toastMessage"
      :duration="2000"
      position="top"
      @did-dismiss="toastMessage = ''"
    />
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonNote,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToast,
  IonToolbar,
  alertController
} from '@ionic/vue';
import { computed, ref } from 'vue';
import { DateTime } from 'luxon';
import { useCustomerServiceStore, BULK_ACTIONS } from '@/store/customerService';
import type { BulkActionDefinition, WorkflowBucket } from '@/types/customerService';
import EmptyState from '@/components/EmptyState.vue';

const props = defineProps<{
  bucket: WorkflowBucket;
  title: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyMessage: string;
  showFacility?: boolean;
}>();

const store = useCustomerServiceStore();
const toastMessage = ref('');

const filters = computed({
  get: () => store.filters[props.bucket],
  set: (value) => (store.filters[props.bucket] = value)
});

const orders = computed(() => store.filteredOrders(props.bucket));
const selectedIds = computed(() => new Set(store.selection[props.bucket]));
const actions = computed<BulkActionDefinition[]>(() => BULK_ACTIONS[props.bucket]);

const allSelected = computed(() => orders.value.length > 0 && orders.value.every((order) => selectedIds.value.has(order.orderId)));

function toggleSelection(orderId: string) {
  store.toggleSelection(props.bucket, orderId);
}

function toggleSelectAll() {
  if (allSelected.value) {
    store.clearSelection(props.bucket);
  } else {
    store.setSelection(props.bucket, orders.value.map((order) => order.orderId));
  }
}

function clearFilters() {
  store.clearFilters(props.bucket);
}

async function runAction(action: BulkActionDefinition) {
  if (action.confirmText) {
    const alert = await alertController.create({
      header: action.label,
      message: action.confirmText,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Confirm', role: 'confirm' }
      ]
    });
    await alert.present();
    const result = await alert.onDidDismiss();
    if (result.role !== 'confirm') return;
  }

  const count = selectedIds.value.size;
  store.runBulkAction(props.bucket, action.id);
  toastMessage.value = `${action.label} · ${count} order${count === 1 ? '' : 's'}`;
}

function formatChannel(channel: string) {
  return channel
    .replace(/_SALES_CHANNEL$/, '')
    .replace(/_CHANNEL$/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(iso: string) {
  if (!iso) return '';
  return DateTime.fromISO(iso).toFormat('LLL d, h:mma');
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function priorityColor(priority: string) {
  if (priority === 'HIGH') return 'danger';
  if (priority === 'LOW') return 'medium';
  return undefined;
}
</script>

<style scoped>
ion-note[slot='end'] {
  text-align: right;
  font-size: 0.85rem;
}
.select-all-link ion-button {
  --padding-start: 4px;
  --padding-end: 4px;
}
</style>
