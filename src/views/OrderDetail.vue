<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/orders" />
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ order?.id ?? 'Order' }}</ion-title>
        <ion-buttons v-if="order && orderActions.length" slot="end">
          <ion-button @click="openOrderActions">Actions</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-progress-bar v-if="orderStore.detailLoading" type="indeterminate" />
    </ion-header>

    <ion-content v-if="order">
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>{{ orderContext }}</ion-card-subtitle>
          <ion-card-title>{{ order.externalId || order.id }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="full">
            <ion-item>
              <ion-label>
                <h2>{{ order.id }}</h2>
                <p>{{ orderDate }}</p>
              </ion-label>
              <ion-badge slot="end">{{ readableValue(order.status) || 'Status unavailable' }}</ion-badge>
            </ion-item>
            <ion-item v-if="order.customerId" :router-link="`/customers/${order.customerId}`">
              <ion-label>Customer</ion-label>
              <ion-note slot="end">{{ order.customerId }}</ion-note>
            </ion-item>
            <ion-item v-for="detail in orderHeaderDetails" :key="detail.label">
              <ion-label>{{ detail.label }}</ion-label>
              <ion-note slot="end">{{ detail.value }}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Fulfillment</ion-label>
              <ion-note slot="end">{{ readableValue(order.fulfillmentStatus) || 'Unavailable' }}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Payment</ion-label>
              <ion-note slot="end">{{ readableValue(order.paymentStatus) || 'Unavailable' }}</ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-accordion-group>
        <ion-accordion value="customer">
          <ion-item slot="header">
            <ion-label>Customer and contact</ion-label>
            <ion-badge slot="end">{{ order.contactInfo?.length || 0 }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-if="order.customerId" :router-link="`/customers/${order.customerId}`">
              <ion-label>
                <h2>{{ order.customerId }}</h2>
                <p>Customer profile</p>
              </ion-label>
            </ion-item>
            <ion-item v-for="contact in order.contactInfo" :key="contact.label">
              <ion-label>
                <h2>{{ contact.label }}</h2>
                <p v-for="line in contact.lines" :key="line">{{ line }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="!order.customerId && !order.contactInfo?.length">
              <ion-label>No contact information found</ion-label>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="payments">
          <ion-item slot="header">
            <ion-label>Payments</ion-label>
            <ion-badge slot="end">{{ order.payments?.length || 0 }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-for="payment in order.payments" :key="payment.id || payment.status">
              <ion-label>
                <h2>{{ payment.method || 'Payment' }}</h2>
                <p>{{ payment.gatewayResponse || payment.id }}</p>
              </ion-label>
              <ion-note slot="end">{{ payment.status || money(payment.amount, order.currency) }}</ion-note>
            </ion-item>
            <ion-item v-if="!order.payments?.length">
              <ion-label>No payments found</ion-label>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="terms">
          <ion-item slot="header">
            <ion-label>Terms</ion-label>
            <ion-badge slot="end">{{ order.terms?.length || 0 }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-for="term in order.terms" :key="term.id || term.type">
              <ion-label>
                <h2>{{ term.type || 'Term' }}</h2>
                <p>{{ term.description || term.value }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="!order.terms?.length">
              <ion-label>No terms found</ion-label>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="roles">
          <ion-item slot="header">
            <ion-label>Order roles</ion-label>
            <ion-badge slot="end">{{ order.roles?.length || 0 }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-if="orderStore.detailSectionErrors.roles">
              <ion-label>{{ orderStore.detailSectionErrors.roles }}</ion-label>
            </ion-item>
            <ion-item v-for="role in order.roles" :key="`${role.partyId}-${role.roleTypeId}`">
              <ion-label>
                <h2>{{ role.roleTypeId }}</h2>
                <p>{{ role.name || role.partyId }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="!order.roles?.length && !orderStore.detailSectionErrors.roles">
              <ion-label>No roles found</ion-label>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="shipping">
          <ion-item slot="header">
            <ion-label>Shipping</ion-label>
            <ion-badge slot="end">{{ order.shipGroups?.length || orderShipments.length }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-if="orderStore.detailSectionErrors.shipments">
              <ion-label>{{ orderStore.detailSectionErrors.shipments }}</ion-label>
            </ion-item>
            <ion-card v-for="shipGroup in order.shipGroups" :key="shipGroup.id || shipGroup.shipmentId">
              <ion-card-header>
                <ion-card-subtitle>{{ shipGroup.facilityName || shipGroup.facilityId || 'Facility unavailable' }}</ion-card-subtitle>
                <ion-card-title>{{ shipGroup.method || shipGroup.id || 'Ship group' }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list lines="full">
                  <ion-item>
                    <ion-label>
                      <h2>{{ shipGroup.id || 'Ship group' }}</h2>
                      <p>{{ shipGroup.shipmentId || 'No shipment created' }}</p>
                    </ion-label>
                    <ion-badge slot="end">{{ readableValue(shipGroup.status) || 'Status unavailable' }}</ion-badge>
                  </ion-item>
                  <ion-item v-for="detail in shipGroupDetails(shipGroup)" :key="detail.label">
                    <ion-label>{{ detail.label }}</ion-label>
                    <ion-note slot="end">{{ detail.value }}</ion-note>
                  </ion-item>
                  <ion-item>
                    <ion-label>
                      <h2>Items</h2>
                      <p>{{ shipGroupItems(shipGroup).length }} item{{ shipGroupItems(shipGroup).length === 1 ? '' : 's' }} in this ship group</p>
                    </ion-label>
                  </ion-item>
                  <ion-item v-for="item in shipGroupItems(shipGroup)" :key="item.id">
                    <ion-label>
                      <h2>{{ item.name }}</h2>
                      <p>{{ item.sku }} · {{ readableValue(item.status) || item.status }}</p>
                      <p>Ordered {{ item.quantity }} · Shipped {{ item.shippedQuantity || 0 }} · Cancelled {{ item.cancelledQuantity || 0 }}</p>
                    </ion-label>
                    <ion-note slot="end">{{ money(item.unitPrice, order.currency) }}</ion-note>
                    <ion-button v-if="canUpdate" slot="end" @click="openItemActions(item)">Actions</ion-button>
                  </ion-item>
                  <ion-item v-if="!shipGroupItems(shipGroup).length">
                    <ion-label>No items found for this ship group</ion-label>
                  </ion-item>
                  <ion-item v-if="canUpdate">
                    <ion-label>Ship group actions</ion-label>
                    <ion-button slot="end" @click="openShipGroupActions(shipGroup)">Actions</ion-button>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>
            <ion-item v-for="shipment in orderShipments" :key="shipment.id" :router-link="`/shipments/${shipment.id}`">
              <ion-label>
                <h2>{{ shipment.id }}</h2>
                <p>{{ shipment.carrier }} {{ shipment.trackingCode }}</p>
                <p>{{ shipment.origin }} to {{ shipment.destination }}</p>
              </ion-label>
              <ion-note slot="end">{{ shipment.status }}</ion-note>
              <ion-button slot="end" @click.prevent="openShipmentDocumentActions(shipment)">Docs</ion-button>
            </ion-item>
            <ion-item v-if="!order.shipGroups?.length && !orderShipments.length && !orderStore.detailSectionErrors.shipments">
              <ion-label>No shipping records found</ion-label>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="items">
          <ion-item slot="header">
            <ion-label>Items</ion-label>
            <ion-badge slot="end">{{ order.items.length }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-for="item in order.items" :key="item.id">
              <ion-label>
                <h2>{{ item.name }}</h2>
                <p>{{ item.sku }} · {{ item.facility }}</p>
                <p>Ordered {{ item.quantity }} · Shipped {{ item.shippedQuantity || 0 }} · Cancelled {{ item.cancelledQuantity || 0 }} · Returned {{ item.returnedQuantity || 0 }}</p>
                <p>{{ item.status }} · {{ money(item.unitPrice, order.currency) }}</p>
              </ion-label>
              <ion-buttons v-if="canUpdate" slot="end">
                <ion-button @click="openItemActions(item)">Actions</ion-button>
              </ion-buttons>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="returns">
          <ion-item slot="header">
            <ion-label>Returns</ion-label>
            <ion-badge slot="end">{{ orderReturns.length }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-if="orderStore.detailSectionErrors.returns">
              <ion-label>{{ orderStore.detailSectionErrors.returns }}</ion-label>
            </ion-item>
            <ion-item v-for="returnRecord in orderReturns" :key="returnRecord.id" :router-link="`/returns/${returnRecord.id}`">
              <ion-label>
                <h2>{{ returnRecord.id }}</h2>
                <p>{{ returnRecord.reason }}</p>
              </ion-label>
              <ion-note slot="end">{{ returnRecord.status }}</ion-note>
            </ion-item>
            <ion-item v-if="!orderReturns.length && !orderStore.detailSectionErrors.returns">
              <ion-label>No returns found</ion-label>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="notes">
          <ion-item slot="header">
            <ion-label>Notes</ion-label>
            <ion-badge slot="end">{{ order.notes.length }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-if="orderStore.detailSectionErrors.notes">
              <ion-label>{{ orderStore.detailSectionErrors.notes }}</ion-label>
            </ion-item>
            <ion-item v-for="note in order.notes" :key="note.id">
              <ion-label>
                <h2>{{ note.author }}</h2>
                <p>{{ note.createdAt }} · {{ note.internal ? 'Internal' : 'Customer-visible' }}</p>
                <p>{{ note.body }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="!order.notes.length && !orderStore.detailSectionErrors.notes">
              <ion-label>No notes found</ion-label>
            </ion-item>
            <ion-item v-if="canUpdate">
              <ion-input v-model="noteName" label="Title" label-placement="stacked" />
            </ion-item>
            <ion-item v-if="canUpdate">
              <ion-textarea v-model="noteInfo" label="Note" label-placement="stacked" auto-grow />
            </ion-item>
            <ion-item v-if="canUpdate">
              <ion-toggle v-model="internalNote">Internal note</ion-toggle>
              <ion-button slot="end" :disabled="!noteInfo.trim()" @click="saveNote">Add</ion-button>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="activity">
          <ion-item slot="header">
            <ion-label>Activity</ion-label>
            <ion-badge slot="end">{{ order.history.length }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-if="orderStore.detailSectionErrors.activity">
              <ion-label>{{ orderStore.detailSectionErrors.activity }}</ion-label>
            </ion-item>
            <ion-item v-for="entry in order.history" :key="entry.id">
              <ion-label>
                <h2>{{ entry.label }}</h2>
                <p>{{ entry.at }}</p>
                <p>{{ entry.detail }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="!order.history.length && !orderStore.detailSectionErrors.activity">
              <ion-label>No activity found</ion-label>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="communications">
          <ion-item slot="header">
            <ion-label>Communications</ion-label>
            <ion-badge slot="end">{{ order.communicationEvents?.length || 0 }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-if="communicationActions.length">
              <ion-label>Communication actions</ion-label>
              <ion-button slot="end" @click="openCommunicationActions">Actions</ion-button>
            </ion-item>
            <ion-item v-if="orderStore.detailSectionErrors.communications">
              <ion-label>{{ orderStore.detailSectionErrors.communications }}</ion-label>
            </ion-item>
            <ion-item v-for="event in order.communicationEvents" :key="event.id">
              <ion-label>
                <h2>{{ event.subject || event.typeId }}</h2>
                <p>{{ event.entryDate }}</p>
              </ion-label>
              <ion-note slot="end">{{ event.statusId }}</ion-note>
            </ion-item>
            <ion-item v-if="!order.communicationEvents?.length && !orderStore.detailSectionErrors.communications">
              <ion-label>No communications found</ion-label>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="attributes">
          <ion-item slot="header">
            <ion-label>Attributes</ion-label>
            <ion-badge slot="end">{{ order.attributes?.length || 0 }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-if="orderStore.detailSectionErrors.attributes">
              <ion-label>{{ orderStore.detailSectionErrors.attributes }}</ion-label>
            </ion-item>
            <ion-item v-for="attribute in order.attributes" :key="attribute.name">
              <ion-label>{{ attribute.name }}</ion-label>
              <ion-note slot="end">{{ attribute.value }}</ion-note>
            </ion-item>
            <ion-item v-if="!order.attributes?.length && !orderStore.detailSectionErrors.attributes">
              <ion-label>No attributes found</ion-label>
            </ion-item>
          </ion-list>
        </ion-accordion>

        <ion-accordion value="transitions">
          <ion-item slot="header">
            <ion-label>Transitions</ion-label>
            <ion-badge slot="end">{{ transitionCount }}</ion-badge>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-for="item in itemsWithTransitions" :key="item.item.id">
              <ion-label>
                <h2>{{ item.item.name }}</h2>
                <p>{{ item.item.status }}</p>
              </ion-label>
              <ion-buttons v-if="canUpdate" slot="end">
                <ion-button
                  v-for="transition in item.transitions"
                  :key="transition.toStatusId"
                  @click="changeItemStatus(item.item.id, transition.toStatusId)"
                >
                  {{ transition.toStatusDescription || transition.toStatusId }}
                </ion-button>
              </ion-buttons>
            </ion-item>
            <ion-item v-if="!transitionCount">
              <ion-label>No transitions found</ion-label>
            </ion-item>
          </ion-list>
        </ion-accordion>
      </ion-accordion-group>
    </ion-content>

    <ion-content v-else-if="orderStore.detailLoading">
      <ion-list>
        <ion-item>
          <ion-label>Loading order</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>

    <ion-content v-else-if="orderStore.detailError">
      <ErrorState
        title="Order failed to load"
        :message="orderStore.detailError"
      />
    </ion-content>

    <ion-content v-else>
      <EmptyState
        title="Order not found"
        message="The selected order is not available in this workspace."
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  IonAccordion,
  IonAccordionGroup,
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
  IonMenuButton,
  IonNote,
  IonPage,
  IonProgressBar,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  actionSheetController,
  alertController
} from '@ionic/vue';
import { useOrderStore } from '@/store/orders';
import { useUserStore } from '@/store/user';
import { useUtilStore } from '@/store/util';
import {
  getCallableOrderActionsByGroup,
  legacySalesOrderActions
} from '@/services/orderActions';
import EmptyState from '@/components/EmptyState.vue';
import ErrorState from '@/components/ErrorState.vue';
import { showToast } from '@/utils';
import type { Order, OrderItem, Shipment } from '@/types/order';

const props = defineProps<{
  orderId: string;
}>();

const orderStore = useOrderStore();
const userStore = useUserStore();
const utilStore = useUtilStore();
const noteName = ref('');
const noteInfo = ref('');
const internalNote = ref(true);

const order = computed(() => orderStore.getOrder(props.orderId));
const orderShipments = computed(() => orderStore.getOrderShipments(order.value?.id || props.orderId));
const orderReturns = computed(() => orderStore.getOrderReturns(order.value?.id || props.orderId));
const canUpdate = computed(() => userStore.hasPermission('ORDERMGR_UPDATE OR ORD_SALES_ORDER_EDIT OR ORD_SALES_ORDER_ADMIN OR ORDERMGR_ADMIN'));
const canSendEmail = computed(() => userStore.hasPermission('ORDERMGR_SEND_CONFIRMATION OR COMM_EVNT_MENU_VIEW OR ORD_SALES_ORDER_ADMIN OR ORDERMGR_ADMIN'));
const actionContext = computed(() => ({
  permissions: userStore.getPermissions,
  orderStatus: order.value?.status
}));
const orderActions = computed(() => [
  ...getCallableOrderActionsByGroup('fulfillment', actionContext.value),
  ...getCallableOrderActionsByGroup('communications', actionContext.value),
]);
const communicationActions = computed(() => getCallableOrderActionsByGroup('communications', actionContext.value));
const itemsWithTransitions = computed(() => (order.value?.items || []).map((item) => ({
  item,
  transitions: utilStore.getAllowedTransitions(item.status)
})).filter((entry) => entry.transitions.length));
const transitionCount = computed(() => itemsWithTransitions.value.reduce((count, entry) => count + entry.transitions.length, 0));
const orderDate = computed(() => formatDateTime(order.value?.orderDate || order.value?.entryDate));
const orderContext = computed(() => {
  const channel = readableValue(order.value?.channel || order.value?.productStoreId) || 'Sales order';
  const priority = order.value?.priority && order.value.priority !== order.value.status ? readableValue(order.value.priority) : '';

  return [channel, priority].filter(Boolean).join(' · ');
});
const orderHeaderDetails = computed(() => {
  if (!order.value) return [];

  return [
    {
      label: 'Channel',
      value: readableValue(order.value.channel || order.value.productStoreId) || 'Unavailable'
    },
    {
      label: 'Product store',
      value: order.value.productStoreId || 'Unavailable'
    },
    {
      label: 'Total',
      value: money(order.value.total, order.value.currency)
    },
    {
      label: 'Items',
      value: String(order.value.items.length)
    },
    {
      label: 'Shipments',
      value: String(order.value.shipmentIds.length || orderShipments.value.length || order.value.shipGroups?.length || 0)
    },
    {
      label: 'Returns',
      value: String(order.value.returnIds.length || orderReturns.value.length || 0)
    }
  ];
});

onMounted(loadOrder);

watch(() => props.orderId, loadOrder);

async function loadOrder() {
  await Promise.allSettled([
    orderStore.loadOrder(props.orderId),
    utilStore.fetchStatusFlowTransitions()
  ]);
}

async function saveNote() {
  if (!order.value || !canUpdate.value || !noteInfo.value.trim()) return;

  await orderStore.addOrderNote(order.value.id, {
    noteName: noteName.value,
    noteInfo: noteInfo.value.trim(),
    internalNote: internalNote.value
  });
  noteName.value = '';
  noteInfo.value = '';
  internalNote.value = true;
  await showToast('Note added');
}

async function sendEmail(emailType: 'PRDS_ODR_CONFIRM' | 'PRDS_ODR_COMPLETE') {
  if (!order.value || !canSendEmail.value) return;

  await runAction(() => orderStore.sendOrderEmail(order.value!.id, emailType), 'Email request sent');
}

async function changeItemStatus(orderItemSeqId: string, statusId: string) {
  if (!order.value || !canUpdate.value) return;

  await orderStore.changeOrderItemStatus(order.value.id, orderItemSeqId, statusId);
  await showToast('Item status updated');
}

async function openOrderActions() {
  if (!order.value) return;

  await presentActionSheet('Order actions', [
    actionButton('reserve-soft-allocations', () => runAction(() => orderStore.reserveSoftAllocatedInventory(order.value!.id), 'Soft allocations reserved')),
    actionButton('allocate-order', () => openInventoryAction('Allocate order', (payload) => orderStore.processOrderFacilityAllocation(order.value!.id, payload))),
    actionButton('ship-to-store', openShipToStoreAction),
    actionButton('send-order-email', openEmailActions),
    actionButton('pickup-scheduled-notification', () => runAction(() => orderStore.sendPickupScheduledNotification(order.value!.id), 'Pickup scheduled notification sent')),
    actionButton('pickup-ready-notification', () => runAction(() => orderStore.sendPickupNotification(order.value!.id), 'Pickup notification sent')),
  ]);
}

async function openItemActions(item: OrderItem) {
  if (!order.value || !canUpdate.value) return;

  const transitionButtons = utilStore.getAllowedTransitions(item.status).map((transition) => ({
    text: transition.toStatusDescription || transition.toStatusId,
    handler: () => changeItemStatus(item.id, transition.toStatusId)
  }));

  await presentActionSheet(item.name, [
    actionButton('update-item', () => openUpdateItemAction(item)),
    actionButton('cancel-item', () => openReasonAction('Cancel item', 'Cancellation reason', (reason) => orderStore.cancelOrderItem(order.value!.id, item.id, reason))),
    actionButton('reject-item', () => openReasonAction('Reject item', 'Rejection reason', (reason) => orderStore.rejectOrderItem(order.value!.id, item.id, reason))),
    actionButton('reserve-item-inventory', () => openInventoryAction('Reserve inventory', (payload) => orderStore.createOrderItemReservation(order.value!.id, item.id, payload))),
    actionButton('cancel-item-reservation', () => openQuantityAction('Cancel reservation', (quantity) => orderStore.cancelOrderItemReservation(order.value!.id, item.id, quantity))),
    actionButton('allocate-item', () => openInventoryAction('Allocate item', (payload) => orderStore.processOrderItemAllocation(order.value!.id, item.id, payload))),
    actionButton('delete-item', () => confirmAction('Delete item', 'Delete this item from the order?', () => orderStore.deleteOrderItem(order.value!.id, item.id))),
    ...transitionButtons
  ]);
}

async function openShipGroupActions(shipGroup: NonNullable<Order['shipGroups']>[number]) {
  if (!order.value || !canUpdate.value) return;
  if (!shipGroup.id) {
    await showToast('Ship group id is unavailable');
    return;
  }

  await presentActionSheet(shipGroup.method || shipGroup.id, [
    actionButton('update-ship-group', () => openShipGroupUpdateAction(shipGroup.id)),
    actionButton('allow-split', () => runAction(() => orderStore.updateOrderShipGroup(order.value!.id, shipGroup.id, { maySplit: 'Y' }), 'Split allowed')),
    actionButton('set-gift-message', () => openShipGroupTextAction('Gift message', 'giftMessage', shipGroup.id)),
    actionButton('set-shipping-instructions', () => openShipGroupTextAction('Shipping instructions', 'shippingInstructions', shipGroup.id)),
    actionButton('update-ship-by-date', () => openShipGroupTextAction('Ship by date', 'shipByDate', shipGroup.id, 'YYYY-MM-DD')),
    actionButton('update-ship-after-date', () => openShipGroupTextAction('Ship after date', 'shipAfterDate', shipGroup.id, 'YYYY-MM-DD')),
    actionButton('ship-to-store', () => openShipToStoreAction(shipGroup.id)),
  ]);
}

async function openCommunicationActions() {
  await presentActionSheet('Communication actions', [
    actionButton('send-order-email', openEmailActions),
    actionButton('pickup-scheduled-notification', () => runAction(() => orderStore.sendPickupScheduledNotification(order.value!.id), 'Pickup scheduled notification sent')),
    actionButton('pickup-ready-notification', () => runAction(() => orderStore.sendPickupNotification(order.value!.id), 'Pickup notification sent')),
  ]);
}

async function openShipmentDocumentActions(shipment: Shipment) {
  await presentActionSheet(shipment.id, [
    actionButton('print-packing-slip', () => runAction(() => orderStore.getPoortiDocument('PackingSlip.pdf', { shipmentId: shipment.id }), 'Packing slip requested')),
    actionButton('print-shipping-label', () => runAction(() => orderStore.getPoortiDocument('Label.pdf', { shipmentId: shipment.id }), 'Shipping label requested')),
  ]);
}

async function openEmailActions() {
  await presentActionSheet('Send email', [
    {
      text: 'Confirmation',
      handler: () => sendEmail('PRDS_ODR_CONFIRM')
    },
    {
      text: 'Completion',
      handler: () => sendEmail('PRDS_ODR_COMPLETE')
    }
  ]);
}

async function openUpdateItemAction(item: OrderItem) {
  await presentAlert('Update item', [
    { name: 'quantity', type: 'number', label: 'Quantity', value: String(item.quantity) },
    { name: 'unitPrice', type: 'number', label: 'Unit price', value: String(item.unitPrice) },
  ], async (data) => {
    const quantity = numberValue(data.quantity);
    const unitPrice = numberValue(data.unitPrice);
    await runAction(() => orderStore.updateOrderItem(order.value!.id, item.id, { quantity, unitPrice }), 'Item updated');
  });
}

async function openReasonAction(header: string, label: string, handler: (reason: string) => Promise<unknown>) {
  await presentAlert(header, [
    { name: 'reason', type: 'textarea', label, placeholder: label },
  ], async (data) => {
    const reason = String(data.reason || '').trim();
    if (!reason) return;
    await runAction(() => handler(reason), `${header} submitted`);
  });
}

async function openInventoryAction(header: string, handler: (payload: { facilityId?: string; quantity?: number }) => Promise<unknown>) {
  await presentAlert(header, [
    { name: 'facilityId', type: 'text', label: 'Facility', placeholder: 'Facility ID' },
    { name: 'quantity', type: 'number', label: 'Quantity', placeholder: 'Quantity' },
  ], async (data) => {
    await runAction(() => handler({
      facilityId: String(data.facilityId || '').trim() || undefined,
      quantity: numberValue(data.quantity)
    }), `${header} submitted`);
  });
}

async function openQuantityAction(header: string, handler: (quantity?: number) => Promise<unknown>) {
  await presentAlert(header, [
    { name: 'quantity', type: 'number', label: 'Quantity', placeholder: 'Quantity' },
  ], async (data) => {
    await runAction(() => handler(numberValue(data.quantity)), `${header} submitted`);
  });
}

async function openShipGroupUpdateAction(shipGroupSeqId: string) {
  await presentAlert('Update ship group', [
    { name: 'shipmentMethodTypeId', type: 'text', label: 'Method', placeholder: 'Shipment method type ID' },
    { name: 'carrierPartyId', type: 'text', label: 'Carrier', placeholder: 'Carrier party ID' },
    { name: 'facilityId', type: 'text', label: 'Facility', placeholder: 'Facility ID' },
  ], async (data) => {
    await runAction(() => orderStore.updateOrderShipGroup(order.value!.id, shipGroupSeqId, compactPayload(data)), 'Ship group updated');
  });
}

async function openShipGroupTextAction(header: string, fieldName: string, shipGroupSeqId: string, placeholder = '') {
  await presentAlert(header, [
    { name: 'value', type: 'textarea', label: header, placeholder },
  ], async (data) => {
    await runAction(() => orderStore.updateOrderShipGroup(order.value!.id, shipGroupSeqId, { [fieldName]: String(data.value || '').trim() }), `${header} updated`);
  });
}

async function openShipToStoreAction(shipGroupSeqId = '') {
  await presentAlert('Convert to ship-to-store', [
    { name: 'shipGroupSeqId', type: 'text', label: 'Ship group', value: shipGroupSeqId },
    { name: 'facilityId', type: 'text', label: 'Facility', placeholder: 'Facility ID' },
  ], async (data) => {
    const selectedShipGroupSeqId = String(data.shipGroupSeqId || '').trim();
    if (!selectedShipGroupSeqId) return;
    await runAction(() => orderStore.convertOrderShipToStore(order.value!.id, {
      shipGroupSeqId: selectedShipGroupSeqId,
      facilityId: String(data.facilityId || '').trim() || undefined
    }), 'Ship-to-store conversion submitted');
  });
}

async function confirmAction(header: string, message: string, handler: () => Promise<unknown>) {
  const alert = await alertController.create({
    header,
    message,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Continue',
        role: 'destructive',
        handler: () => runAction(handler, `${header} submitted`)
      }
    ]
  });
  await alert.present();
}

async function presentActionSheet(header: string, buttons: Array<{ text: string; role?: string; handler?: () => void } | undefined>) {
  const availableButtons = buttons.filter(Boolean) as Array<{ text: string; role?: string; handler?: () => void }>;
  if (!availableButtons.length) {
    await showToast('No actions available');
    return;
  }

  const actionSheet = await actionSheetController.create({
    header,
    buttons: [
      ...availableButtons,
      { text: 'Cancel', role: 'cancel' }
    ]
  });
  await actionSheet.present();
}

async function presentAlert(
  header: string,
  inputs: Array<{ name: string; type: 'text' | 'number' | 'textarea'; label: string; value?: string; placeholder?: string }>,
  submit: (data: Record<string, string>) => Promise<void>
) {
  const alert = await alertController.create({
    header,
    inputs,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Save',
        handler: (data) => submit(data)
      }
    ]
  });
  await alert.present();
}

function actionButton(actionId: string, handler: () => void) {
  const action = legacySalesOrderActions.find((entry) => entry.id === actionId);
  if (!action || !actionAvailable(actionId)) return undefined;

  return {
    text: action.label,
    handler
  };
}

function actionAvailable(actionId: string) {
  const action = legacySalesOrderActions.find((entry) => entry.id === actionId);
  if (!action || action.implementationStatus !== 'callable') return false;
  if (action.permission && !userStore.hasPermission(action.permission)) return false;
  if (order.value?.status && action.hiddenForStatuses?.includes(order.value.status)) return false;
  return true;
}

async function runAction(handler: () => Promise<unknown>, successMessage: string) {
  try {
    await handler();
    await showToast(successMessage);
  } catch (error: any) {
    await showToast(error?.message || 'Action failed');
  }
}

function numberValue(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function compactPayload(data: Record<string, string>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => String(value || '').trim()));
}

function shipGroupItems(shipGroup: NonNullable<Order['shipGroups']>[number]) {
  if (!order.value) return [];

  return order.value.items.filter((item) => item.shipGroupSeqId === shipGroup.id);
}

function shipGroupDetails(shipGroup: NonNullable<Order['shipGroups']>[number]) {
  return [
    {
      label: 'Facility',
      value: shipGroup.facilityName || shipGroup.facilityId
    },
    {
      label: 'Carrier',
      value: [shipGroup.carrier, shipGroup.trackingCode].filter(Boolean).join(' ')
    },
    {
      label: 'Shipping instructions',
      value: shipGroup.shippingInstructions
    },
    {
      label: 'Gift message',
      value: shipGroup.giftMessage
    },
    {
      label: 'May split',
      value: yesNoValue(shipGroup.maySplit)
    },
    {
      label: 'Gift',
      value: yesNoValue(shipGroup.isGift)
    },
    {
      label: 'Ship after',
      value: formatDateTime(shipGroup.shipAfterDate)
    },
    {
      label: 'Ship by',
      value: formatDateTime(shipGroup.shipByDate)
    },
    {
      label: 'Estimated ship',
      value: formatDateTime(shipGroup.estimatedShipDate)
    },
    {
      label: 'Estimated delivery',
      value: formatDateTime(shipGroup.estimatedDeliveryDate)
    }
  ].filter((detail) => detail.value && detail.value !== 'Order date unavailable');
}

function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) return 'Order date unavailable';

  const numericValue = Number(value);
  const date = Number.isFinite(numericValue) ? new Date(numericValue) : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function readableValue(value?: string) {
  if (!value) return '';

  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function yesNoValue(value?: string) {
  if (!value) return '';
  if (value === 'Y') return 'Yes';
  if (value === 'N') return 'No';
  return readableValue(value);
}
</script>
