<template>
  <WorkflowOrderList
    bucket="unallocated"
    title="Unallocated orders"
    search-placeholder="Order, external ID, customer"
    empty-title="No unallocated orders"
    empty-message="Approved orders that haven't been brokered to a physical facility will appear here."
  />
</template>

<script setup lang="ts">
import WorkflowOrderList from '@/components/WorkflowOrderList.vue';
</script>
