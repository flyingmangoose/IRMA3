<template>
  <div class="invoices-container">
    <h1>Invoices</h1>
    <div class="invoice-controls">
      <button class="primary-button">Create Invoice</button>
      <button class="secondary-button">View Paid Invoices</button>
    </div>
    <div class="invoice-list">
      <p>Your invoices will appear here.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InvoicesPage',
  data() {
    return {
      // Invoice data would be loaded here
    }
  },
  methods: {
    // Invoice methods would go here
  }
}
</script>

<style scoped>
.invoices-container {
  padding: 20px;
}
.invoice-controls {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}
.primary-button {
  background-color: #1976D2;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}
.secondary-button {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}
.invoice-list {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  min-height: 200px;
}
</style>
