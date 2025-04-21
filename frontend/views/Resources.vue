<template>
  <div class="resources-container">
    <v-card class="mb-4">
      <v-card-title>
        Resources
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search resources"
          single-line
          hide-details
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="dialogResource = true" class="ml-2">
          <v-icon left>mdi-account-plus</v-icon>
          Add Resource
        </v-btn>
        <v-btn outlined class="ml-2">
          <v-icon left>mdi-filter</v-icon>
          Filter
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="resources"
        :search="search"
        :loading="loading"
        class="elevation-1"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20],
          'items-per-page-text': 'Resources per page'
        }"
      >
        <!-- Status column -->
        <template v-slot:[`item.status`]="{ item }">
          <v-chip
            :color="item.isActive ? 'green' : 'grey'"
            text-color="white"
            small
          >
            {{ item.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <!-- Role column -->
        <template v-slot:[`item.role`]="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            text-color="white"
            small
          >
            {{ item.role }}
          </v-chip>
        </template>

        <!-- Utilization column -->
        <template v-slot:[`item.utilization`]="{ item }">
          <v-progress-linear
            :value="item.utilization"
            height="15"
            :color="getUtilizationColor(item.utilization)"
          >
            <template v-slot:default>
              <span class="white--text">{{ item.utilization }}%</span>
            </template>
          </v-progress-linear>
        </template>

        <!-- Actions column -->
        <template v-slot:[`item.actions`]="{ item }">
          <v-icon small class="mr-2" @click="viewResource(item)">
            mdi-eye
          </v-icon>
          <v-icon small class="mr-2" @click="editResource(item)">
            mdi-pencil
          </v-icon>
          <v-icon small @click="confirmDelete(item)">
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <!-- New/Edit Resource Dialog -->
    <v-dialog v-model="dialogResource" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="form" v-model="valid">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.firstName"
                    label="First Name"
                    :rules="[v => !!v || 'First name is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.lastName"
                    label="Last Name"
                    :rules="[v => !!v || 'Last name is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.email"
                    label="Email"
                    :rules="emailRules"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.phone"
                    label="Phone"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editedItem.role"
                    :items="roleOptions"
                    label="Role"
                    :rules="[v => !!v || 'Role is required']"
                    required
                  ></v-select>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editedItem.department"
                    :items="departmentOptions"
                    label="Department"
                    :rules="[v => !!v || 'Department is required']"
                    required
                  ></v-select>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.hourlyRate"
                    label="Hourly Rate"
                    prefix="$"
                    type="number"
                    :rules="[v => v >= 0 || 'Hourly rate must be positive']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="editedItem.isActive"
                    label="Active Resource"
                    color="success"
                  ></v-switch>
                </v-col>

                <v-col cols="12">
                  <v-combobox
                    v-model="editedItem.skills"
                    :items="skillOptions"
                    label="Skills"
                    multiple
                    chips
                    small-chips
                    deletable-chips
                  ></v-combobox>
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="saveResource"
            :disabled="!valid"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Resource Dialog -->
    <v-dialog v-model="dialogViewResource" max-width="800px">
      <v-card v-if="viewedResource">
        <v-card-title class="headline">
          {{ viewedResource.firstName }} {{ viewedResource.lastName }}
          <v-spacer></v-spacer>
          <v-chip
            :color="viewedResource.isActive ? 'green' : 'grey'"
            text-color="white"
          >
            {{ viewedResource.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-list>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-email</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Email</v-list-item-title>
                    <v-list-item-subtitle>{{ viewedResource.email }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item v-if="viewedResource.phone">
                  <v-list-item-icon>
                    <v-icon>mdi-phone</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Phone</v-list-item-title>
                    <v-list-item-subtitle>{{ viewedResource.phone }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-badge-account</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Role</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getRoleColor(viewedResource.role)"
                        text-color="white"
                        small
                      >
                        {{ viewedResource.role }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-domain</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Department</v-list-item-title>
                    <v-list-item-subtitle>{{ viewedResource.department }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-currency-usd</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Hourly Rate</v-list-item-title>
                    <v-list-item-subtitle>{{ formatCurrency(viewedResource.hourlyRate) }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-chart-timeline-variant</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Current Utilization</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-progress-linear
                        :value="viewedResource.utilization"
                        height="20"
                        :color="getUtilizationColor(viewedResource.utilization)"
                      >
                        <template v-slot:default>
                          <strong>{{ viewedResource.utilization }}%</strong>
                        </template>
                      </v-progress-linear>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12">
              <v-card outlined>
                <v-card-title>Skills</v-card-title>
                <v-card-text>
                  <v-chip
                    v-for="skill in viewedResource.skills"
                    :key="skill"
                    class="ma-1"
                    color="primary"
                    small
                  >
                    {{ skill }}
                  </v-chip>
                  <p v-if="!viewedResource.skills || viewedResource.skills.length === 0" class="text-caption">
                    No skills listed
                  </p>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12">
              <v-card outlined>
                <v-card-title>Current Projects</v-card-title>
                <v-card-text>
                  <div v-if="resourceProjects.length > 0">
                    <v-list dense>
                      <v-list-item v-for="project in resourceProjects" :key="project.id">
                        <v-list-item-icon>
                          <v-icon :color="getStatusColor(project.status)">mdi-folder</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                          <v-list-item-title>{{ project.name }}</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ project.status }} | Role: {{ project.resourceRole }}
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </div>
                  <p v-else class="text-caption">Not assigned to any projects</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="editResource(viewedResource)">
            Edit
          </v-btn>
          <v-btn color="blue darken-1" text @click="dialogViewResource = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDeleteConfirm" max-width="500px">
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this resource? This action cannot be undone.
          <div class="warning-text mt-3" v-if="resourceProjects.length > 0">
            <v-alert type="warning" text dense>
              This resource is assigned to {{ resourceProjects.length }} project(s). Deleting this resource will affect these projects.
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogDeleteConfirm = false">
            Cancel
          </v-btn>
          <v-btn color="red darken-1" text @click="deleteResource">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ResourcesPage',
  
  data() {
    return {
      search: '',
      loading: false,
      resources: [],
      headers: [
        { text: 'Name', value: 'fullName', sortable: true },
        { text: 'Email', value: 'email' },
        { text: 'Role', value: 'role' },
        { text: 'Department', value: 'department' },
        { text: 'Status', value: 'status' },
        { text: 'Utilization', value: 'utilization' },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      dialogResource: false,
      dialogViewResource: false,
      dialogDeleteConfirm: false,
      valid: false,
      editedIndex: -1,
      viewedResource: null,
      resourceProjects: [],
      editedItem: {
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        hourlyRate: 0,
        isActive: true,
        utilization: 0,
        skills: []
      },
      defaultItem: {
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        hourlyRate: 0,
        isActive: true,
        utilization: 0,
        skills: []
      },
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid'
      ],
      roleOptions: ['Developer', 'Designer', 'Project Manager', 'Business Analyst', 'QA Engineer', 'DevOps', 'Admin'],
      departmentOptions: ['Engineering', 'Design', 'Product', 'Marketing', 'Operations', 'Sales', 'HR'],
      skillOptions: [
        'JavaScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'C#',
        'UI/UX Design', 'Product Design', 'Database Design', 'SQL', 'MongoDB', 
        'Project Management', 'Agile', 'Scrum', 'DevOps', 'AWS', 'Azure', 'GCP'
      ]
    };
  },

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? 'New Resource' : 'Edit Resource';
    }
  },

  watch: {
    dialogResource(val) {
      val || this.closeDialog();
    }
  },

  created() {
    this.fetchResources();
  },

  methods: {
    fetchResources() {
      this.loading = true;
      axios.get('/api/users')
        .then(response => {
          this.resources = response.data.map(user => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            department: user.department,
            hourlyRate: user.hourlyRate || 0,
            isActive: user.isActive !== undefined ? user.isActive : true,
            utilization: this.calculateUtilization(user),
            skills: user.skills || []
          }));
        })
        .catch(error => {
          console.error('Error fetching resources:', error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Error loading resources. Please try again.',
            color: 'error'
          });
        })
        .finally(() => {
          this.loading = false;
        });
    },

    calculateUtilization(user) {
      // This would ideally be calculated based on project assignments
      // For now, return a random value between 0-100 for demonstration
      return user.utilization || Math.floor(Math.random() * 100);
    },

    getRoleColor(role) {
      const colorMap = {
        'Developer': 'indigo',
        'Designer': 'purple',
        'Project Manager': 'blue',
        'Business Analyst': 'cyan',
        'QA Engineer': 'teal',
        'DevOps': 'green',
        'Admin': 'red'
      };
      return colorMap[role] || 'grey';
    },

    getUtilizationColor(utilization) {
      if (utilization < 40) return 'green';
      if (utilization < 75) return 'amber';
      return 'red';
    },

    getStatusColor(status) {
      const colorMap = {
        'Active': 'green',
        'On Hold': 'orange',
        'Completed': 'blue',
        'Cancelled': 'red'
      };
      return colorMap[status] || 'grey';
    },

    formatCurrency(value) {
      return `$${value.toFixed(2)}`;
    },

    viewResource(item) {
      this.viewedResource = Object.assign({}, item);
      this.fetchResourceProjects(item.id);
      this.dialogViewResource = true;
    },
    
    fetchResourceProjects(resourceId) {
      // This would fetch projects assigned to this resource
      // For now, use mock data for demonstration
      this.resourceProjects = [
        { id: 1, name: 'Website Redesign', status: 'Active', resourceRole: 'Developer' },
        { id: 2, name: 'Mobile App Development', status: 'On Hold', resourceRole: 'Lead Developer' }
      ];
      
      // Real implementation would be:
      /*
      axios.get(`/api/projects/resource/${resourceId}`)
        .then(response => {
          this.resourceProjects = response.data;
        })
        .catch(error => {
          console.error('Error fetching resource projects:', error);
          this.resourceProjects = [];
        });
      */
    },

    editResource(item) {
      this.editedIndex = this.resources.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialogViewResource = false;
      this.dialogResource = true;
    },

    confirmDelete(item) {
      this.editedIndex = this.resources.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.fetchResourceProjects(item.id);
      this.dialogDeleteConfirm = true;
    },

    deleteResource() {
      axios.delete(`/api/users/${this.editedItem.id}`)
        .then(() => {
          this.resources.splice(this.editedIndex, 1);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Resource deleted successfully',
            color: 'success'
          });
        })
        .catch(error => {
          console.error('Error deleting resource:', error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Error deleting resource. Please try again.',
            color: 'error'
          });
        })
        .finally(() => {
          this.closeDelete();
        });
    },

    closeDelete() {
      this.dialogDeleteConfirm = false;
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    },

    closeDialog() {
      this.dialogResource = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        this.$refs.form.resetValidation();
      });
    },

    saveResource() {
      if (!this.$refs.form.validate()) return;

      const isNewResource = this.editedIndex === -1;
      const resourceData = {
        firstName: this.editedItem.firstName,
        lastName: this.editedItem.lastName,
        email: this.editedItem.email,
        phone: this.editedItem.phone,
        role: this.editedItem.role,
        department: this.editedItem.department,
        hourlyRate: this.editedItem.hourlyRate,
        isActive: this.editedItem.isActive,
        skills: this.editedItem.skills
      };

      // For a new resource, we need to include password for user creation
      if (isNewResource) {
        // For demo purposes, set a default password
        resourceData.password = 'tempPassword123';
        // In production, you might generate a random password or
        // implement a separate flow to set passwords
      }

      const request = isNewResource
        ? axios.post('/api/users', resourceData)
        : axios.put(`/api/users/${this.editedItem.id}`, resourceData);

      request
        .then(response => {
          if (isNewResource) {
            // Format the response data to match our resource structure
            const newResource = {
              id: response.data._id,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              fullName: `${response.data.firstName} ${response.data.lastName}`,
              email: response.data.email,
              phone: response.data.phone || '',
              role: response.data.role,
              department: response.data.department,
              hourlyRate: response.data.hourlyRate || 0,
              isActive: response.data.isActive !== undefined ? response.data.isActive : true,
              utilization: 0, // New resources start with 0 utilization
              skills: response.data.skills || []
            };
            this.resources.push(newResource);
          } else {
            // Update the existing resource
            const updatedResource = {
              ...this.resources[this.editedIndex],
              firstName: resourceData.firstName,
              lastName: resourceData.lastName,
              fullName: `${resourceData.firstName} ${resourceData.lastName}`,
              email: resourceData.email,
              phone: resourceData.phone,
              role: resourceData.role,
              department: resourceData.department,
              hourlyRate: resourceData.hourlyRate,
              isActive: resourceData.isActive,
              skills: resourceData.skills
            };
            Object.assign(this.resources[this.editedIndex], updatedResource);
          }

          this.$store.dispatch('setSnackbar', {
            show: true,
            text: `Resource ${isNewResource ? 'added' : 'updated'} successfully`,
            color: 'success'
          });
          this.closeDialog();
        })
        .catch(error => {
          console.error(`Error ${isNewResource ? 'adding' : 'updating'} resource:`, error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: `Error ${isNewResource ? 'adding' : 'updating'} resource. Please try again.`,
            color: 'error'
          });
        });
    }
  }
};
</script>

<style scoped>
.resources-container {
  padding: 20px;
}

.resources-title {
  color: #333;
  font-weight: 500;
}

.search-field {
  max-width: 300px;
}

.resource-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.resource-details h3 {
  margin-bottom: 8px;
  font-size: 1.2rem;
  color: #333;
}

.resource-details p {
  margin-bottom: 4px;
  color: #666;
}

.resource-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.projects-assigned {
  margin-top: 24px;
}

.projects-table {
  margin-top: 8px;
}

.resource-dialog .v-card__title {
  padding-bottom: 8px;
}

.utilization-meter {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
}

.v-chip {
  margin: 2px;
}

.resource-details-section {
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.filter-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.actions-column {
  width: 120px;
}

.dialog-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}

.v-card__subtitle {
  font-size: 14px;
  color: #666;
  padding-top: 0;
}
</style>
