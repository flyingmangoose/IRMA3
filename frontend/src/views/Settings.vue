<template>
  <div class="settings-container">
    <h1>System Settings</h1>
    <div class="settings-form">
      <div class="form-group">
        <label>Company Name</label>
        <input type="text" placeholder="Enter company name" />
      </div>
      <div class="form-group">
        <label>Default Currency</label>
        <select>
          <option>USD</option>
          <option>EUR</option>
          <option>GBP</option>
        </select>
      </div>
      <div class="form-group">
        <label>Email Notifications</label>
        <input type="checkbox" /> Enable email notifications
      </div>
      <button class="primary-button">Save Settings</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Settings',
  data() {
    return {
      // Settings data would be loaded here
    }
  },
  methods: {
    // Settings methods would go here
  }
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
}
.settings-form {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  max-width: 600px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input[type="text"],
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.primary-button {
  background-color: #1976D2;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}
</style>
