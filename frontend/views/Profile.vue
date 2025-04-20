<template>
  <div class="profile-container">
    <h1>User Profile</h1>
    <div class="profile-form">
      <div class="form-group">
        <label>Name</label>
        <input type="text" placeholder="Enter your name" />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" placeholder="Enter your email" />
      </div>
      <div class="form-group">
        <label>Change Password</label>
        <input type="password" placeholder="Enter new password" />
      </div>
      <button class="primary-button">Update Profile</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfilePage',
  data() {
    return {
      // Profile data would be loaded here
    }
  },
  methods: {
    // Profile methods would go here
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}
.profile-form {
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
.form-group input {
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
