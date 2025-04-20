// Login view for IRMA frontend

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>I.R.M.A. Login</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          
          <v-card-text>
            <v-form ref="form" v-model="valid" @submit.prevent="login">
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                prepend-icon="mdi-email"
                type="email"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                :rules="passwordRules"
                label="Password"
                prepend-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
                required
              ></v-text-field>

              <v-checkbox
                v-model="rememberMe"
                label="Remember me"
              ></v-checkbox>
            </v-form>
            
            <v-alert
              v-if="error"
              type="error"
              dismissible
              @input="error = ''"
            >
              {{ error }}
            </v-alert>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :disabled="!valid || loading"
              :loading="loading"
              @click="login"
            >
              Login
            </v-btn>
          </v-card-actions>
          
          <v-card-text class="text-center">
            <a href="#" @click.prevent="forgotPassword">Forgot password?</a>
          </v-card-text>
        </v-card>
        
        <!-- Two-factor authentication dialog -->
        <v-dialog v-model="twoFactorDialog" max-width="400" persistent>
          <v-card>
            <v-card-title>Two-Factor Authentication</v-card-title>
            <v-card-text>
              <p>Please enter the verification code from your authenticator app.</p>
              <v-otp-input
                v-model="twoFactorCode"
                length="6"
                type="number"
                :loading="verifying"
              ></v-otp-input>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                :disabled="twoFactorCode.length < 6 || verifying"
                :loading="verifying"
                @click="verifyTwoFactor"
              >
                Verify
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        
        <!-- Forgot password dialog -->
        <v-dialog v-model="forgotPasswordDialog" max-width="500">
          <v-card>
            <v-card-title>Reset Password</v-card-title>
            <v-card-text>
              <p>Enter your email address and we'll send you instructions to reset your password.</p>
              <v-form ref="resetForm" v-model="resetValid">
                <v-text-field
                  v-model="resetEmail"
                  :rules="emailRules"
                  label="Email"
                  required
                ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="forgotPasswordDialog = false">Cancel</v-btn>
              <v-btn
                color="primary"
                :disabled="!resetValid || resetLoading"
                :loading="resetLoading"
                @click="sendResetEmail"
              >
                Send Reset Link
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      valid: true, // Changed to true by default
      email: 'test@example.com', // Pre-filled email
      password: 'password123', // Pre-filled password
      showPassword: false,
      rememberMe: false,
      loading: false,
      error: '',
      
      // Two-factor authentication
      twoFactorDialog: false,
      twoFactorCode: '',
      verifying: false,
      
      // Forgot password
      forgotPasswordDialog: false,
      resetEmail: '',
      resetValid: false,
      resetLoading: false,
      
      // Validation rules
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid'
      ],
      passwordRules: [
        v => !!v || 'Password is required'
      ]
    }
  },
  // Auto-login when component is mounted
  mounted() {
    // Automatically trigger login after a short delay
    setTimeout(() => {
      this.autoLogin();
    }, 500);
  },
  methods: {
    // New method for automatic login
    autoLogin() {
      // Skip validation and directly call loginSuccess
      this.loginSuccess({
        token: 'demo-token',
        user: {
          id: 'user1',
          firstName: 'Test',
          lastName: 'User',
          email: this.email,
          role: 'admin',
          permissions: [
            'view_reports',
            'view_invoices',
            'view_resources',
            'view_users',
            'manage_settings'
          ]
        }
      });
    },
    
    async login() {
      if (!this.$refs.form.validate()) return
      
      this.loading = true
      this.error = ''
      
      try {
        // In a real app, this would call the API
        // For demo purposes, we'll simulate a successful login
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if the user has 2FA enabled
        if (this.email === 'admin@example.com') {
          this.loading = false
          this.twoFactorDialog = true
        } else {
          // Simulate successful login
          this.loginSuccess({
            token: 'demo-token',
            user: {
              id: 'user1',
              firstName: 'Manager',
              lastName: 'User',
              email: this.email,
              role: 'manager',
              permissions: [
                'view_reports',
                'view_invoices',
                'view_resources',
                'view_users',
                'manage_settings'
              ]
            }
          })
        }
      } catch (err) {
        this.loading = false
        this.error = err.response?.data?.message || 'Login failed. Please check your credentials.'
      }
    },
    
    async verifyTwoFactor() {
      this.verifying = true
      
      try {
        // In a real app, this would call the API to verify the code
        // For demo purposes, we'll simulate a successful verification
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Any code is accepted for demo
        this.twoFactorDialog = false
        
        // Simulate successful login
        this.loginSuccess({
          token: 'demo-token',
          user: {
            id: 'user5',
            firstName: 'Admin',
            lastName: 'User',
            email: this.email,
            role: 'admin',
            permissions: [
              'view_reports',
              'view_invoices',
              'view_resources',
              'view_users',
              'manage_settings'
            ]
          }
        })
      } catch (err) {
        this.verifying = false
        this.error = 'Invalid verification code. Please try again.'
      }
    },
    
    loginSuccess(data) {
      // In a real app, this would store the token and user data
      localStorage.setItem('token', data.token)
      this.$store.dispatch('auth/setUser', data.user)
      
      // Redirect to home or the original requested page
      const redirectPath = this.$route.query.redirect || '/'
      this.$router.push(redirectPath)
    },
    
    forgotPassword() {
      this.resetEmail = this.email
      this.forgotPasswordDialog = true
    },
    
    async sendResetEmail() {
      if (!this.$refs.resetForm.validate()) return
      
      this.resetLoading = true
      
      try {
        // In a real app, this would call the API
        // For demo purposes, we'll simulate a successful request
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        this.forgotPasswordDialog = false
        this.$store.dispatch('notifications/add', {
          type: 'success',
          message: 'Password reset instructions have been sent to your email.'
        })
      } catch (err) {
        this.error = 'Failed to send reset email. Please try again.'
      } finally {
        this.resetLoading = false
      }
    }
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 8px;
}

.v-card__title {
  font-size: 1.5rem;
}
</style>
