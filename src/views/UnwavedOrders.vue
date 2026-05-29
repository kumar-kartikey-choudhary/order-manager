<template>
  <WorkflowOrderList
    bucket="unwaved"
    title="Unwaved orders"
    search-placeholder="Order, external ID, customer"
    empty-title="No unwaved orders"
    empty-message="Orders brokered to a warehouse but not yet received or waved onto a picklist will appear here."
    show-facility
  />
</template>

<script setup lang="ts">
import WorkflowOrderList from '@/components/WorkflowOrderList.vue';
</script>
