// Main App.vue file for IRMA frontend

<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>I.R.M.A.</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggleDarkMode">
        <v-icon>{{ darkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
      <v-menu left bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="viewProfile">
            <v-list-item-icon>
              <v-icon>mdi-account</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="logout">
            <v-list-item-icon>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h6">
            Integrated Resource Management Application
          </v-list-item-title>
          <v-list-item-subtitle>
            Welcome, {{ currentUser.firstName }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item link to="/" exact>
          <v-list-item-icon>
            <v-icon>mdi-home</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/timesheets">
          <v-list-item-icon>
            <v-icon>mdi-calendar-clock</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Timesheets</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/projects">
          <v-list-item-icon>
            <v-icon>mdi-folder</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Projects</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/clients">
          <v-list-item-icon>
            <v-icon>mdi-account-group</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Clients</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/reports" v-if="hasPermission('view_reports')">
          <v-list-item-icon>
            <v-icon>mdi-chart-bar</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Reports</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/invoices" v-if="hasPermission('view_invoices')">
          <v-list-item-icon>
            <v-icon>mdi-file-document</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Invoices</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/resources" v-if="hasPermission('view_resources')">
          <v-list-item-icon>
            <v-icon>mdi-account-multiple</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Resources</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/users" v-if="hasPermission('view_users')">
          <v-list-item-icon>
            <v-icon>mdi-account-cog</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>User Management</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/settings" v-if="hasPermission('manage_settings')">
          <v-list-item-icon>
            <v-icon>mdi-cog</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>

    <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }} IRMA - Integrated Resource Management Application</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data: () => ({
    drawer: null,
    darkMode: false,
    currentUser: {
      id: 'user1',
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager@example.com',
      role: 'manager',
      permissions: [
        'view_reports',
        'view_invoices',
        'view_resources',
        'view_users',
        'manage_settings'
      ]
    }
  }),
  methods: {
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      this.$vuetify.theme.dark = this.darkMode;
    },
    viewProfile() {
      // Navigate to profile page
      this.$router.push('/profile');
    },
    logout() {
      // Handle logout logic
      // In a real app, this would clear auth tokens and redirect to login
      alert('Logout functionality would be implemented here');
    },
    hasPermission(permission) {
      return this.currentUser.permissions.includes(permission);
    }
  }
};
</script>

<style>
/* Global styles */
.v-application {
  font-family: 'Roboto', sans-serif;
}

.v-main {
  background-color: #f5f5f5;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
