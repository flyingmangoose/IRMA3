<template>
  <div class="login-container">
    <div class="login-form">
      <h1>IRMA Login</h1>
      <div class="form-group">
        <label>Email</label>
        <input type="email" placeholder="Enter your email" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" placeholder="Enter your password" />
      </div>
      <button class="primary-button">Login</button>
      <p class="forgot-password">Forgot your password?</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
  data() {
    return {
      // Login data would be loaded here
    }
  },
  methods: {
    // Login methods would go here
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}
.login-form {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.primary-button {
  background-color: #1976D2;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
}
.forgot-password {
  text-align: center;
  margin-top: 15px;
  color: #1976D2;
  cursor: pointer;
}
</style>
