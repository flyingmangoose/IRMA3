<template>
  <div class="home-container">
    <h1>IRMA Dashboard</h1>
    <div class="dashboard-summary">
      <div class="summary-card">
        <h3>Active Projects</h3>
        <p class="summary-value">12</p>
      </div>
      <div class="summary-card">
        <h3>Pending Timesheets</h3>
        <p class="summary-value">5</p>
      </div>
      <div class="summary-card">
        <h3>Upcoming Deadlines</h3>
        <p class="summary-value">3</p>
      </div>
      <div class="summary-card">
        <h3>Recent Invoices</h3>
        <p class="summary-value">8</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
  data() {
    return {
      // Dashboard data would be loaded here
    }
  }
}
</script>

<style scoped>
.home-container {
  padding: 20px;
}
.dashboard-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}
.summary-card {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  min-width: 200px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #1976D2;
}
</style>
