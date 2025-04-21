<template>
  <div class="users-container">
    <h1 class="page-title">Users Management</h1>
    
    <v-card>
      <v-card-title>
        Users
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
          class="mx-4"
        ></v-text-field>
        <v-btn
          color="primary"
          @click="openCreateDialog"
        >
          <v-icon left>mdi-account-plus</v-icon>
          Add User
        </v-btn>
      </v-card-title>
      
      <v-data-table
        :headers="headers"
        :items="users"
        :search="search"
        class="elevation-1"
      >
        <template v-slot:item.fullName="{ item }">
          {{ item.firstName }} {{ item.lastName }}
        </template>
        
        <template v-slot:item.role="{ item }">
          <v-chip
            small
            :color="getRoleColor(item.role)"
          >
            {{ formatRole(item.role) }}
          </v-chip>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn
            small
            icon
            color="primary"
            @click="editUser(item)"
            title="Edit User"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          
          <v-btn
            small
            icon
            color="error"
            @click="confirmDeleteUser(item)"
            title="Delete User"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
    
    <!-- Create/Edit User Dialog -->
    <v-dialog
      v-model="userDialog"
      max-width="600px"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ editMode ? 'Edit User' : 'Create User' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="userForm" v-model="valid">
            <v-container>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userForm.firstName"
                    label="First Name"
                    required
                    :rules="[v => !!v || 'First name is required']"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userForm.lastName"
                    label="Last Name"
                    required
                    :rules="[v => !!v || 'Last name is required']"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userForm.email"
                    label="Email"
                    type="email"
                    required
                    :rules="[
                      v => !!v || 'Email is required',
                      v => /.+@.+\..+/.test(v) || 'Email must be valid'
                    ]"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-select
                    v-model="userForm.role"
                    :items="roles"
                    label="Role"
                    required
                    :rules="[v => !!v || 'Role is required']"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" md="6" v-if="!editMode">
                  <v-text-field
                    v-model="userForm.password"
                    label="Password"
                    type="password"
                    required
                    :rules="[
                      v => !!v || 'Password is required',
                      v => v.length >= 6 || 'Password must be at least 6 characters'
                    ]"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6" v-if="!editMode">
                  <v-text-field
                    v-model="userForm.confirmPassword"
                    label="Confirm Password"
                    type="password"
                    required
                    :rules="[
                      v => !!v || 'Confirm password is required',
                      v => v === userForm.password || 'Passwords must match'
                    ]"
                  ></v-text-field>
                </v-col>
              </v-row>
              
              <v-row v-if="userForm.role">
                <v-col cols="12">
                  <v-card outlined>
                    <v-card-title>Permissions</v-card-title>
                    <v-card-text>
                      <v-row>
                        <v-col cols="12" md="6" v-for="(permission, i) in availablePermissions" :key="i">
                          <v-checkbox
                            v-model="userForm.permissions"
                            :label="formatPermission(permission.name)"
                            :value="permission.id"
                            :hint="permission.description"
                            persistent-hint
                          ></v-checkbox>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              
              <v-row v-if="userForm.role === 'approver' || userForm.role === 'admin'">
                <v-col cols="12">
                  <v-card outlined>
                    <v-card-title>Approval Workflow</v-card-title>
                    <v-card-text>
                      <v-row>
                        <v-col cols="12" md="6" v-for="(workflow, i) in workflowTypes" :key="i">
                          <v-checkbox
                            v-model="userForm.workflows"
                            :label="workflow.name"
                            :value="workflow.id"
                            :hint="workflow.description"
                            persistent-hint
                          ></v-checkbox>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeUserDialog">
            Cancel
          </v-btn>
          <v-btn color="blue darken-1" text @click="saveUser" :disabled="!valid">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this user? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="red darken-1" text @click="deleteUser">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
export default {
  name: 'Users',
  data() {
    return {
      search: '',
      userDialog: false,
      deleteDialog: false,
      editMode: false,
      valid: false,
      
      // Selected user for deletion
      userToDelete: null,
      
      // User form
      userForm: {
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        password: '',
        confirmPassword: '',
        permissions: [],
        workflows: []
      },
      
      // Notification
      snackbar: {
        show: false,
        text: '',
        color: 'success'
      },
      
      headers: [
        { text: 'Name', value: 'fullName' },
        { text: 'Email', value: 'email' },
        { text: 'Role', value: 'role' },
        { text: 'Actions', value: 'actions', sortable: false, align: 'end' }
      ],
      
      // Mock data - would come from API
      users: [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'admin',
          permissions: [1, 2, 3, 4, 5],
          workflows: [1, 2]
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          role: 'user',
          permissions: [1, 2],
          workflows: []
        },
        {
          id: 3,
          firstName: 'Robert',
          lastName: 'Johnson',
          email: 'robert@example.com',
          role: 'approver',
          permissions: [1, 2, 3, 4],
          workflows: [1]
        }
      ],
      
      roles: [
        'user',
        'manager',
        'approver',
        'admin'
      ],
      
      availablePermissions: [
        { id: 1, name: 'view_projects', description: 'View all projects' },
        { id: 2, name: 'edit_own_timesheet', description: 'Edit own timesheet entries' },
        { id: 3, name: 'view_reports', description: 'View reports and analytics' },
        { id: 4, name: 'manage_users', description: 'Create and manage users' },
        { id: 5, name: 'manage_settings', description: 'Modify system settings' }
      ],
      
      workflowTypes: [
        { id: 1, name: 'Timesheet Approval', description: 'Can approve timesheets' },
        { id: 2, name: 'Project Approval', description: 'Can approve project creation and changes' }
      ]
    };
  },
  
  methods: {
    formatRole(role) {
      return role.charAt(0).toUpperCase() + role.slice(1);
    },
    
    formatPermission(permissionName) {
      return permissionName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    
    getRoleColor(role) {
      switch (role) {
        case 'admin': return 'purple';
        case 'approver': return 'success';
        case 'manager': return 'primary';
        case 'user': return 'info';
        default: return 'grey';
      }
    },
    
    openCreateDialog() {
      this.editMode = false;
      this.userForm = {
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        password: '',
        confirmPassword: '',
        permissions: [],
        workflows: []
      };
      this.userDialog = true;
    },
    
    editUser(user) {
      this.editMode = true;
      this.userForm = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: [...user.permissions],
        workflows: user.workflows ? [...user.workflows] : []
      };
      this.userDialog = true;
    },
    
    closeUserDialog() {
      this.userDialog = false;
      this.$nextTick(() => {
        this.$refs.userForm.reset();
      });
    },
    
    saveUser() {
      if (!this.$refs.userForm.validate()) {
        return;
      }
      
      // In a real app, this would call an API
      if (this.editMode) {
        // Update existing user
        const index = this.users.findIndex(u => u.id === this.userForm.id);
        if (index !== -1) {
          this.users.splice(index, 1, {
            ...this.users[index],
            firstName: this.userForm.firstName,
            lastName: this.userForm.lastName,
            email: this.userForm.email,
            role: this.userForm.role,
            permissions: [...this.userForm.permissions],
            workflows: [...this.userForm.workflows]
          });
        }
        
        this.showSnackbar('User updated successfully', 'success');
      } else {
        // Create new user
        this.users.push({
          id: this.users.length + 1,
          firstName: this.userForm.firstName,
          lastName: this.userForm.lastName,
          email: this.userForm.email,
          role: this.userForm.role,
          permissions: [...this.userForm.permissions],
          workflows: [...this.userForm.workflows]
        });
        
        this.showSnackbar('User created successfully', 'success');
      }
      
      this.closeUserDialog();
    },
    
    confirmDeleteUser(user) {
      this.userToDelete = user;
      this.deleteDialog = true;
    },
    
    deleteUser() {
      // In a real app, this would call an API
      this.users = this.users.filter(u => u.id !== this.userToDelete.id);
      this.deleteDialog = false;
      this.userToDelete = null;
      
      this.showSnackbar('User deleted successfully', 'success');
    },
    
    showSnackbar(text, color = 'success') {
      this.snackbar.text = text;
      this.snackbar.color = color;
      this.snackbar.show = true;
    }
  }
};
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
}

.users-container {
  padding: 20px;
}
</style>
