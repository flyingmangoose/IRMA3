&lt;template>
  &lt;div class="user-management">
    &lt;v-card>
      &lt;v-card-title>
        User Management
        &lt;v-spacer>&lt;/v-spacer>
        &lt;v-btn
          color="primary"
          @click="createUserDialog = true"
          v-if="isAdmin"
        >
          &lt;v-icon left>mdi-account-plus&lt;/v-icon>
          Add User
        &lt;/v-btn>
      &lt;/v-card-title>
      
      &lt;v-card-text>
        &lt;v-row>
          &lt;v-col cols="12" md="4">
            &lt;v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
              clearable
            >&lt;/v-text-field>
          &lt;/v-col>
          
          &lt;v-col cols="12" md="4">
            &lt;v-select
              v-model="roleFilter"
              :items="roles"
              label="Filter by Role"
              clearable
              hide-details
            >&lt;/v-select>
          &lt;/v-col>
          
          &lt;v-col cols="12" md="4">
            &lt;v-select
              v-model="departmentFilter"
              :items="departments"
              label="Filter by Department"
              clearable
              hide-details
            >&lt;/v-select>
          &lt;/v-col>
        &lt;/v-row>
        
        &lt;v-data-table
          :headers="headers"
          :items="filteredUsers"
          :search="search"
          :items-per-page="10"
          class="mt-4"
        >
          &lt;template v-slot:item.fullName="{ item }">
            {{ item.firstName }} {{ item.lastName }}
          &lt;/template>
          
          &lt;template v-slot:item.role="{ item }">
            &lt;v-chip
              small
              :color="getRoleColor(item.role)"
            >
              {{ formatRole(item.role) }}
            &lt;/v-chip>
          &lt;/template>
          
          &lt;template v-slot:item.twoFactorEnabled="{ item }">
            &lt;v-icon
              small
              :color="item.twoFactorEnabled ? 'success' : 'grey'"
            >
              {{ item.twoFactorEnabled ? 'mdi-shield-check' : 'mdi-shield-off-outline' }}
            &lt;/v-icon>
            {{ item.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
          &lt;/template>
          
          &lt;template v-slot:item.actions="{ item }">
            &lt;v-btn
              small
              icon
              color="info"
              @click="viewUser(item)"
              title="View User"
            >
              &lt;v-icon>mdi-eye&lt;/v-icon>
            &lt;/v-btn>
            
            &lt;v-btn
              small
              icon
              color="primary"
              @click="editUser(item)"
              title="Edit User"
              v-if="canEditUser(item)"
            >
              &lt;v-icon>mdi-pencil&lt;/v-icon>
            &lt;/v-btn>
            
            &lt;v-btn
              small
              icon
              color="error"
              @click="deleteUser(item)"
              title="Delete User"
              v-if="isAdmin"
            >
              &lt;v-icon>mdi-delete&lt;/v-icon>
            &lt;/v-btn>
          &lt;/template>
        &lt;/v-data-table>
      &lt;/v-card-text>
    &lt;/v-card>
    
    <!-- Create/Edit User Dialog -->
    &lt;v-dialog
      v-model="createUserDialog"
      max-width="600px"
    >
      &lt;v-card>
        &lt;v-card-title>
          {{ editMode ? 'Edit User' : 'Create New User' }}
        &lt;/v-card-title>
        
        &lt;v-card-text>
          &lt;v-form ref="userForm">
            &lt;v-row>
              &lt;v-col cols="12" md="6">
                &lt;v-text-field
                  v-model="userForm.firstName"
                  label="First Name"
                  required
                  :rules="[v => !!v || 'First name is required']"
                >&lt;/v-text-field>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-text-field
                  v-model="userForm.lastName"
                  label="Last Name"
                  required
                  :rules="[v => !!v || 'Last name is required']"
                >&lt;/v-text-field>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-text-field
                  v-model="userForm.email"
                  label="Email"
                  type="email"
                  required
                  :rules="[
                    v => !!v || 'Email is required',
                    v => /.+@.+\..+/.test(v) || 'Email must be valid'
                  ]"
                >&lt;/v-text-field>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-text-field
                  v-model="userForm.phone"
                  label="Phone"
                >&lt;/v-text-field>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-select
                  v-model="userForm.department"
                  :items="departments"
                  label="Department"
                  required
                  :rules="[v => !!v || 'Department is required']"
                  :disabled="!isAdmin"
                >&lt;/v-select>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-select
                  v-model="userForm.role"
                  :items="roles"
                  label="Role"
                  required
                  :rules="[v => !!v || 'Role is required']"
                  :disabled="!isAdmin"
                >&lt;/v-select>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6" v-if="isAdmin">
                &lt;v-text-field
                  v-model="userForm.hourlyRate"
                  label="Hourly Rate"
                  type="number"
                  prefix="$"
                >&lt;/v-text-field>
              &lt;/v-col>
              
              &lt;template v-if="!editMode">
                &lt;v-col cols="12" md="6">
                  &lt;v-text-field
                    v-model="userForm.password"
                    label="Password"
                    type="password"
                    required
                    :rules="[v => !!v || 'Password is required', v => v.length >= 6 || 'Password must be at least 6 characters']"
                  >&lt;/v-text-field>
                &lt;/v-col>
                
                &lt;v-col cols="12" md="6">
                  &lt;v-text-field
                    v-model="userForm.confirmPassword"
                    label="Confirm Password"
                    type="password"
                    required
                    :rules="[
                      v => !!v || 'Confirm password is required',
                      v => v === userForm.password || 'Passwords must match'
                    ]"
                  >&lt;/v-text-field>
                &lt;/v-col>
              &lt;/template>
            &lt;/v-row>
          &lt;/v-form>
        &lt;/v-card-text>
        
        &lt;v-card-actions>
          &lt;v-spacer>&lt;/v-spacer>
          &lt;v-btn
            color="blue darken-1"
            text
            @click="createUserDialog = false"
          >
            Cancel
          &lt;/v-btn>
          &lt;v-btn
            color="blue darken-1"
            text
            @click="saveUser"
          >
            Save
          &lt;/v-btn>
        &lt;/v-card-actions>
      &lt;/v-card>
    &lt;/v-dialog>
    
    <!-- View User Dialog -->
    &lt;v-dialog
      v-model="viewUserDialog"
      max-width="800px"
    >
      &lt;v-card v-if="selectedUser">
        &lt;v-card-title>
          {{ selectedUser.firstName }} {{ selectedUser.lastName }}
          &lt;v-spacer>&lt;/v-spacer>
          &lt;v-chip
            :color="getRoleColor(selectedUser.role)"
          >
            {{ formatRole(selectedUser.role) }}
          &lt;/v-chip>
        &lt;/v-card-title>
        
        &lt;v-card-text>
          &lt;v-row>
            &lt;v-col cols="12" md="6">
              &lt;v-list>
                &lt;v-list-item>
                  &lt;v-list-item-icon>
                    &lt;v-icon>mdi-email&lt;/v-icon>
                  &lt;/v-list-item-icon>
                  &lt;v-list-item-content>
                    &lt;v-list-item-title>Email&lt;/v-list-item-title>
                    &lt;v-list-item-subtitle>{{ selectedUser.email }}&lt;/v-list-item-subtitle>
                  &lt;/v-list-item-content>
                &lt;/v-list-item>
                
                &lt;v-list-item>
                  &lt;v-list-item-icon>
                    &lt;v-icon>mdi-phone&lt;/v-icon>
                  &lt;/v-list-item-icon>
                  &lt;v-list-item-content>
                    &lt;v-list-item-title>Phone&lt;/v-list-item-title>
                    &lt;v-list-item-subtitle>{{ selectedUser.phone || 'Not provided' }}&lt;/v-list-item-subtitle>
                  &lt;/v-list-item-content>
                &lt;/v-list-item>
                
                &lt;v-list-item>
                  &lt;v-list-item-icon>
                    &lt;v-icon>mdi-domain&lt;/v-icon>
                  &lt;/v-list-item-icon>
                  &lt;v-list-item-content>
                    &lt;v-list-item-title>Department&lt;/v-list-item-title>
                    &lt;v-list-item-subtitle>{{ selectedUser.department }}&lt;/v-list-item-subtitle>
                  &lt;/v-list-item-content>
                &lt;/v-list-item>
              &lt;/v-list>
            &lt;/v-col>
            
            &lt;v-col cols="12" md="6">
              &lt;v-list>
                &lt;v-list-item v-if="isAdmin">
                  &lt;v-list-item-icon>
                    &lt;v-icon>mdi-currency-usd&lt;/v-icon>
                  &lt;/v-list-item-icon>
                  &lt;v-list-item-content>
                    &lt;v-list-item-title>Hourly Rate&lt;/v-list-item-title>
                    &lt;v-list-item-subtitle>${{ selectedUser.hourlyRate || '0.00' }}/hour&lt;/v-list-item-subtitle>
                  &lt;/v-list-item-content>
                &lt;/v-list-item>
                
                &lt;v-list-item>
                  &lt;v-list-item-icon>
                    &lt;v-icon>mdi-shield&lt;/v-icon>
                  &lt;/v-list-item-icon>
                  &lt;v-list-item-content>
                    &lt;v-list-item-title>Two-Factor Authentication&lt;/v-list-item-title>
                    &lt;v-list-item-subtitle>
                      &lt;v-chip
                        small
                        :color="selectedUser.twoFactorEnabled ? 'success' : 'grey'"
                      >
                        {{ selectedUser.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                      &lt;/v-chip>
                    &lt;/v-list-item-subtitle>
                  &lt;/v-list-item-content>
                  &lt;v-list-item-action v-if="isCurrentUser">
                    &lt;v-btn
                      small
                      text
                      color="primary"
                      @click="manage2FA"
                    >
                      {{ selectedUser.twoFactorEnabled ? 'Disable' : 'Enable' }}
                    &lt;/v-btn>
                  &lt;/v-list-item-action>
                &lt;/v-list-item>
                
                &lt;v-list-item>
                  &lt;v-list-item-icon>
                    &lt;v-icon>mdi-calendar-check&lt;/v-icon>
                  &lt;/v-list-item-icon>
                  &lt;v-list-item-content>
                    &lt;v-list-item-title>Created&lt;/v-list-item-title>
                    &lt;v-list-item-subtitle>{{ formatDate(selectedUser.createdAt) }}&lt;/v-list-item-subtitle>
                  &lt;/v-list-item-content>
                &lt;/v-list-item>
              &lt;/v-list>
            &lt;/v-col>
          &lt;/v-row>
          
          &lt;v-divider class="my-4">&lt;/v-divider>
          
          &lt;v-tabs v-model="userTab">
            &lt;v-tab>Projects&lt;/v-tab>
            &lt;v-tab>Timesheets&lt;/v-tab>
            &lt;v-tab>Permissions&lt;/v-tab>
          &lt;/v-tabs>
          
          &lt;v-tabs-items v-model="userTab">
            &lt;v-tab-item>
              &lt;v-data-table
                :headers="projectHeaders"
                :items="userProjects"
                :items-per-page="5"
                class="mt-4"
              >
                &lt;template v-slot:item.status="{ item }">
                  &lt;v-chip
                    small
                    :color="getStatusColor(item.status)"
                  >
                    {{ item.status }}
                  &lt;/v-chip>
                &lt;/template>
              &lt;/v-data-table>
            &lt;/v-tab-item>
            
            &lt;v-tab-item>
              &lt;v-data-table
                :headers="timesheetHeaders"
                :items="userTimesheets"
                :items-per-page="5"
                class="mt-4"
              >
                &lt;template v-slot:item.status="{ item }">
                  &lt;v-chip
                    small
                    :color="getTimesheetStatusColor(item.status)"
                  >
                    {{ item.status }}
                  &lt;/v-chip>
                &lt;/template>
              &lt;/v-data-table>
            &lt;/v-tab-item>
            
            &lt;v-tab-item>
              &lt;v-list class="mt-4">
                &lt;v-subheader>Role Permissions&lt;/v-subheader>
                &lt;v-list-item
                  v-for="permission in rolePermissions"
                  :key="permission"
                >
                  &lt;v-list-item-icon>
                    &lt;v-icon color="success">mdi-check-circle&lt;/v-icon>
                  &lt;/v-list-item-icon>
                  &lt;v-list-item-content>
                    &lt;v-list-item-title>{{ formatPermission(permission) }}&lt;/v-list-item-title>
                  &lt;/v-list-item-content>
                &lt;/v-list-item>
              &lt;/v-list>
            &lt;/v-tab-item>
          &lt;/v-tabs-items>
        &lt;/v-card-text>
        
        &lt;v-card-actions>
          &lt;v-btn
            color="primary"
            text
            @click="changePassword"
            v-if="isCurrentUser"
          >
            Change Password
          &lt;/v-btn>
          
          &lt;v-spacer>&lt;/v-spacer>
          
          &lt;v-btn
            color="primary"
            text
            @click="editUser(selectedUser)"
            v-if="canEditUser(selectedUser)"
          >
            Edit
          &lt;/v-btn>
          
          &lt;v-btn
            color="blue darken-1"
            text
            @click="viewUserDialog = false"
          >
            Close
          &lt;/v-btn>
        &lt;/v-card-actions>
      &lt;/v-card>
    &lt;/v-dialog>
    
    <!-- Change Password Dialog -->
    &lt;v-dialog
      v-model="passwordDialog"
      max-width="500px"
    >
      &lt;v-card>
        &lt;v-card-title>
          Change Password
        &lt;/v-card-title>
        
        &lt;v-card-text>
          &lt;v-form ref="passwordForm">
            &lt;v-text-field
              v-model="passwordForm.currentPassword"
              label="Current Password"
              type="password"
              required
              :rules="[v => !!v || 'Current password is required']"
            >&lt;/v-text-field>
            
            &lt;v-text-field
              v-model="passwordForm.newPassword"
              label="New Password"
              type="password"
              required
              :rules="[
                v => !!v || 'New password is required',
                v => v.length >= 6 || 'Password must be at least 6 characters'
              ]"
            >&lt;/v-text-field>
            
            &lt;v-text-field
              v-model="passwordForm.confirmPassword"
              label="Confirm New Password"
              type="password"
              required
              :rules="[
                v => !!v || 'Confirm password is required',
                v => v === passwordForm.newPassword || 'Passwords must match'
              ]"
            >&lt;/v-text-field>
          &lt;/v-form>
        &lt;/v-card-text>
        
        &lt;v-card-actions>
          &lt;v-spacer>&lt;/v-spacer>
          &lt;v-btn
            color="blue darken-1"
            text
            @click="passwordDialog = false"
          >
            Cancel
          &lt;/v-btn>
          &lt;v-btn
            color="blue darken-1"
            text
            @click="updatePassword"
          >
            Update
          &lt;/v-btn>
        &lt;/v-card-actions>
      &lt;/v-card>
    &lt;/v-dialog>
    
    <!-- 2FA Setup Dialog -->
    &lt;v-dialog
      v-model="twoFactorDialog"
      max-width="500px"
    >
      &lt;v-card>
        &lt;v-card-title>
          {{ selectedUser && selectedUser.twoFactorEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication' }}
        &lt;/v-card-title>
        
        &lt;v-card-text>
          &lt;template v-if="selectedUser && !selectedUser.twoFactorEnabled">
            &lt;v-alert
              type="info"
              outlined
            >
              Scan the QR code below with your authenticator app (like Google Authenticator or Authy), then enter the verification code to enable two-factor authentication.
            &lt;/v-alert>
            
            &lt;div class="text-center my-4" v-if="twoFactorQR">
              &lt;img :src="twoFactorQR" alt="QR Code" class="qr-code">
            &lt;/div>
            
            &lt;v-form ref="twoFactorForm">
              &lt;v-text-field
                v-model="twoFactorCode"
                label="Verification Code"
                required
                :rules="[v => !!v || 'Verification code is required']"
              >&lt;/v-text-field>
            &lt;/v-form>
          &lt;/template>
          
          &lt;template v-else-if="selectedUser && selectedUser.twoFactorEnabled">
            &lt;v-alert
              type="warning"
              outlined
            >
              Are you sure you want to disable two-factor authentication? This will make your account less secure.
            &lt;/v-alert>
          &lt;/template>
        &lt;/v-card-text>
        
        &lt;v-card-actions>
          &lt;v-spacer>&lt;/v-spacer>
          &lt;v-btn
            color="blue darken-1"
            text
            @click="twoFactorDialog = false"
          >
            Cancel
          &lt;/v-btn>
          &lt;v-btn
            color="blue darken-1"
            text
            @click="updateTwoFactor"
          >
            {{ selectedUser && selectedUser.twoFactorEnabled ? 'Disable' : 'Enable' }}
          &lt;/v-btn>
        &lt;/v-card-actions>
      &lt;/v-card>
    &lt;/v-dialog>
  &lt;/div>
&lt;/template>

&lt;script>
export default {
  name: 'UserManagement',
  data() {
    return {
      search: '',
      roleFilter: null,
      departmentFilter: null,
      
      // Dialogs
      createUserDialog: false,
      viewUserDialog: false,
      passwordDialog: false,
      twoFactorDialog: false,
      
      // Selected user
      selectedUser: null,
      editMode: false,
      userTab: 0,
      
      // Forms
      userForm: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        role: 'employee',
        hourlyRate: 0,
        password: '',
        confirmPassword: ''
      },
      
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      
      // 2FA
      twoFactorQR: null,
      twoFactorSecret: null,
      twoFactorCode: '',
      
      // Table headers
      headers: [
        { text: 'Name', value: 'fullName', sort: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`) },
        { text: 'Email', value: 'email' },
        { text: 'Department', value: 'department' },
        { text: 'Role', value: 'role' },
        { text: '2FA', value: 'twoFactorEnabled' },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      
      projectHeaders: [
        { text: 'Project', value: 'name' },
        { text: 'Client', value: 'client' },
        { text: 'Role', value: 'role' },
        { text: 'Status', value: 'status' }
      ],
      
      timesheetHeaders: [
        { text: 'Period', value: 'period' },
        { text: 'Hours', value: 'hours' },
        { text: 'Status', value: 'status' },
        { text: 'Submitted', value: 'submitted' }
      ],
      
      // Mock data (would come from API)
      users: [
        {
          id: 'user1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          phone: '555-1234',
          department: 'Development',
          role: 'employee',
          hourlyRate: 75,
          twoFactorEnabled: false,
          createdAt: '2025-01-15T08:30:00Z'
        },
        {
          id: 'user2',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          phone: '555-5678',
          department: 'Design',
          role: 'employee',
          hourlyRate: 65,
          twoFactorEnabled: true,
          createdAt: '2025-01-20T10:15:00Z'
        },
        {
          id: 'user3',
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          phone: '555-9012',
          department: 'Development',
          role: 'supervisor',
          hourlyRate: 85,
          twoFactorEnabled: false,
          createdAt: '2025-02-05T14:45:00Z'
        },
        {
          id: 'user4',
          firstName: 'Alice',
          lastName: 'Williams',
          email: 'alice@example.com',
          phone: '555-3456',
          department: 'QA',
          role: 'manager',
          hourlyRate: 95,
          twoFactorEnabled: true,
          createdAt: '2025-02-10T09:20:00Z'
        },
        {
          id: 'user5',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          phone: '555-7890',
          department: 'Management',
          role: 'admin',
          hourlyRate: 120,
          twoFactorEnabled: true,
          createdAt: '2025-01-01T00:00:00Z'
        }
      ],
      
      // Options
      roles: ['employee', 'supervisor', 'manager', 'admin'],
      departments: ['Development', 'Design', 'QA', 'Management', 'Sales', 'Finance', 'HR'],
      
      // Role permissions (would come from API)
      rolePermissionsMap: {
        employee: [
          'view_own_profile',
          'edit_own_profile',
          'view_own_timesheets',
          'create_own_timesheets',
          'edit_own_timesheets',
          'view_assigned_projects',
          'view_own_reports'
        ],
        supervisor: [
          'view_own_profile',
          'edit_own_profile',
          'view_own_timesheets',
          'create_own_timesheets',
          'edit_own_timesheets',
          'view_assigned_projects',
          'view_own_reports',
          'view_team_timesheets',
          'approve_team_timesheets'
        ],
        manager: [
          'view_own_profile',
          'edit_own_profile',
          'view_own_timesheets',
          'create_own_timesheets',
          'edit_own_timesheets',
          'view_assigned_projects',
          'view_own_reports',
          'view_team_timesheets',
          'approve_team_timesheets',
          'view_all_projects',
          'create_projects',
          'edit_projects',
          'view_all_clients',
          'create_clients',
          'edit_clients',
          'view_all_reports',
          'create_reports',
          'view_invoices',
          'create_invoices'
        ],
        admin: [
          'view_own_profile',
          'edit_own_profile',
          'view_own_timesheets',
          'create_own_timesheets',
          'edit_own_timesheets',
          'view_assigned_projects',
          'view_own_reports',
          'view_team_timesheets',
          'approve_team_timesheets',
          'view_all_projects',
          'create_projects',
          'edit_projects',
          'delete_projects',
          'view_all_clients',
          'create_clients',
          'edit_clients',
          'delete_clients',
          'view_all_reports',
          'create_reports',
          'edit_reports',
          'delete_reports',
          'view_invoices',
          'create_invoices',
          'edit_invoices',
          'delete_invoices',
          'view_all_users',
          'create_users',
          'edit_users',
          'delete_users',
          'manage_system_settings'
        ]
      }
    };
  },
  
  computed: {
    // In a real app, these would be based on the current user's role
    isAdmin() {
      return true; // For demo purposes
    },
    
    isManager() {
      return true; // For demo purposes
    },
    
    isCurrentUser() {
      return this.selectedUser && this.selectedUser.id === 'user5'; // For demo purposes
    },
    
    filteredUsers() {
      let filtered = [...this.users];
      
      if (this.roleFilter) {
        filtered = filtered.filter(user => user.role === this.roleFilter);
      }
      
      if (this.departmentFilter) {
        filtered = filtered.filter(user => user.department === this.departmentFilter);
      }
      
      return filtered;
    },
    
    userProjects() {
      if (!this.selectedUser) return [];
      
      // In a real app, this would fetch from the API
      // For now, return mock data
      return [
        {
          id: 'proj1',
          name: 'Project Alpha',
          client: 'Test Client',
          role: 'Developer',
          status: 'Active'
        },
        {
          id: 'proj2',
          name: 'Project Beta',
          client: 'Test Client',
          role: 'Tester',
          status: 'Active'
        }
      ];
    },
    
    userTimesheets() {
      if (!this.selectedUser) return [];
      
      // In a real app, this would fetch from the API
      // For now, return mock data
      return [
        {
          id: 'ts1',
          period: 'Apr 1 - Apr 7, 2025',
          hours: 40,
          status: 'Approved',
          submitted: '2025-04-08'
        },
        {
          id: 'ts2',
          period: 'Apr 8 - Apr 14, 2025',
          hours: 38,
          status: 'Pending',
          submitted: '2025-04-15'
        },
        {
          id: 'ts3',
          period: 'Apr 15 - Apr 21, 2025',
          hours: 42,
          status: 'Draft',
          submitted: '-'
        }
      ];
    },
    
    rolePermissions() {
      if (!this.selectedUser) return [];
      return this.rolePermissionsMap[this.selectedUser.role] || [];
    }
  },
  
  methods: {
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    
    formatRole(role) {
      return role.charAt(0).toUpperCase() + role.slice(1);
    },
    
    formatPermission(permission) {
      return permission
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    
    getRoleColor(role) {
      switch (role) {
        case 'admin': return 'purple';
        case 'manager': return 'primary';
        case 'supervisor': return 'success';
        case 'employee': return 'info';
        default: return 'grey';
      }
    },
    
    getStatusColor(status) {
      switch (status) {
        case 'Active': return 'success';
        case 'On Hold': return 'warning';
        case 'Completed': return 'info';
        case 'Cancelled': return 'error';
        default: return 'grey';
      }
    },
    
    getTimesheetStatusColor(status) {
      switch (status) {
        case 'Approved': return 'success';
        case 'Pending': return 'warning';
        case 'Rejected': return 'error';
        case 'Draft': return 'grey';
        default: return 'grey';
      }
    },
    
    canEditUser(user) {
      // In a real app, this would check permissions
      // For demo purposes, admin can edit anyone, users can edit themselves
      return this.isAdmin || (this.isCurrentUser && user.id === 'user5');
    },
    
    viewUser(user) {
      this.selectedUser = user;
      this.viewUserDialog = true;
    },
    
    editUser(user) {
      this.editMode = true;
      this.selectedUser = user;
      this.userForm = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        department: user.department,
        role: user.role,
        hourlyRate: user.hourlyRate
      };
      this.createUserDialog = true;
      this.viewUserDialog = false;
    },
    
    deleteUser(user) {
      if (confirm(`Are you sure you want to delete user ${user.firstName} ${user.lastName}?`)) {
        // In a real app, this would call the API to delete the user
        // For now, just remove from the local array
        this.users = this.users.filter(u => u.id !== user.id);
      }
    },
    
    saveUser() {
      if (!this.$refs.userForm.validate()) {
        return;
      }
      
      // In a real app, this would call the API to save the user
      // For now, just update the local array
      if (this.editMode) {
        const index = this.users.findIndex(u => u.id === this.userForm.id);
        if (index !== -1) {
          this.users[index] = {
            ...this.users[index],
            firstName: this.userForm.firstName,
            lastName: this.userForm.lastName,
            email: this.userForm.email,
            phone: this.userForm.phone,
            department: this.userForm.department,
            role: this.userForm.role,
            hourlyRate: this.userForm.hourlyRate
          };
        }
      } else {
        this.users.push({
          id: `user${Date.now()}`,
          firstName: this.userForm.firstName,
          lastName: this.userForm.lastName,
          email: this.userForm.email,
          phone: this.userForm.phone,
          department: this.userForm.department,
          role: this.userForm.role,
          hourlyRate: this.userForm.hourlyRate,
          twoFactorEnabled: false,
          createdAt: new Date().toISOString()
        });
      }
      
      this.createUserDialog = false;
      this.resetUserForm();
    },
    
    resetUserForm() {
      this.userForm = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        role: 'employee',
        hourlyRate: 0,
        password: '',
        confirmPassword: ''
      };
      this.editMode = false;
    },
    
    changePassword() {
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.passwordDialog = true;
    },
    
    updatePassword() {
      if (!this.$refs.passwordForm.validate()) {
        return;
      }
      
      // In a real app, this would call the API to update the password
      alert('Password updated successfully');
      this.passwordDialog = false;
    },
    
    manage2FA() {
      if (this.selectedUser.twoFactorEnabled) {
        // Disable 2FA
        this.twoFactorDialog = true;
      } else {
        // Enable 2FA - generate QR code
        // In a real app, this would call the API to get a QR code
        this.twoFactorQR = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/IRMA:' + this.selectedUser.email + '?secret=JBSWY3DPEHPK3PXP&issuer=IRMA';
        this.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
        this.twoFactorCode = '';
        this.twoFactorDialog = true;
      }
    },
    
    updateTwoFactor() {
      if (this.selectedUser.twoFactorEnabled) {
        // Disable 2FA
        // In a real app, this would call the API to disable 2FA
        const index = this.users.findIndex(u => u.id === this.selectedUser.id);
        if (index !== -1) {
          this.users[index].twoFactorEnabled = false;
          this.selectedUser.twoFactorEnabled = false;
        }
        alert('Two-factor authentication disabled successfully');
        this.twoFactorDialog = false;
      } else {
        // Enable 2FA
        if (!this.$refs.twoFactorForm.validate()) {
          return;
        }
        
        // In a real app, this would call the API to verify the code and enable 2FA
        // For demo purposes, any code is accepted
        const index = this.users.findIndex(u => u.id === this.selectedUser.id);
        if (index !== -1) {
          this.users[index].twoFactorEnabled = true;
          this.selectedUser.twoFactorEnabled = true;
        }
        alert('Two-factor authentication enabled successfully');
        this.twoFactorDialog = false;
      }
    }
  }
};
&lt;/script>

&lt;style scoped>
.qr-code {
  max-width: 200px;
  max-height: 200px;
}
&lt;/style>
