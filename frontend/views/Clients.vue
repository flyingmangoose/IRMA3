<template>
  <div class="clients-container">
    <v-card class="mb-4">
      <v-card-title>
        Clients
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search clients"
          single-line
          hide-details
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="dialogClient = true" class="ml-2">
          <v-icon left>mdi-plus</v-icon>
          Add Client
        </v-btn>
        <v-btn outlined class="ml-2">
          <v-icon left>mdi-file-import</v-icon>
          Import
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="clients"
        :search="search"
        :loading="loading"
        class="elevation-1"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20],
          'items-per-page-text': 'Clients per page'
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

        <!-- Actions column -->
        <template v-slot:[`item.actions`]="{ item }">
          <v-icon small class="mr-2" @click="viewClient(item)">
            mdi-eye
          </v-icon>
          <v-icon small class="mr-2" @click="editClient(item)">
            mdi-pencil
          </v-icon>
          <v-icon small @click="confirmDelete(item)">
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <!-- New/Edit Client Dialog -->
    <v-dialog v-model="dialogClient" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="form" v-model="valid">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.name"
                    label="Client Name"
                    :rules="[v => !!v || 'Client name is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.contactPerson"
                    label="Contact Person"
                    :rules="[v => !!v || 'Contact person is required']"
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

                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.address.street"
                    label="Street Address"
                  ></v-text-field>
                </v-col>

                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="editedItem.address.city"
                      label="City"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="3">
                    <v-text-field
                      v-model="editedItem.address.state"
                      label="State/Province"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="3">
                    <v-text-field
                      v-model="editedItem.address.zipCode"
                      label="Zip/Postal Code"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.address.country"
                    label="Country"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.totalBudget"
                    label="Total Budget"
                    prefix="$"
                    type="number"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="editedItem.isActive"
                    label="Active Client"
                    color="success"
                  ></v-switch>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="editedItem.notes"
                    label="Notes"
                    rows="3"
                  ></v-textarea>
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
            @click="saveClient"
            :disabled="!valid"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Client Dialog -->
    <v-dialog v-model="dialogViewClient" max-width="800px">
      <v-card v-if="viewedClient">
        <v-card-title class="headline">
          {{ viewedClient.name }}
          <v-spacer></v-spacer>
          <v-chip
            :color="viewedClient.isActive ? 'green' : 'grey'"
            text-color="white"
          >
            {{ viewedClient.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-list>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-account</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Contact Person</v-list-item-title>
                    <v-list-item-subtitle>{{ viewedClient.contactPerson }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-email</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Email</v-list-item-title>
                    <v-list-item-subtitle>{{ viewedClient.email }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item v-if="viewedClient.phone">
                  <v-list-item-icon>
                    <v-icon>mdi-phone</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Phone</v-list-item-title>
                    <v-list-item-subtitle>{{ viewedClient.phone }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item v-if="hasAddress">
                  <v-list-item-icon>
                    <v-icon>mdi-map-marker</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Address</v-list-item-title>
                    <v-list-item-subtitle>
                      <div v-if="viewedClient.address.street">{{ viewedClient.address.street }}</div>
                      <div v-if="cityStateZip">{{ cityStateZip }}</div>
                      <div v-if="viewedClient.address.country">{{ viewedClient.address.country }}</div>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-currency-usd</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Total Budget</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatCurrency(viewedClient.totalBudget) }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" v-if="viewedClient.notes">
              <v-card outlined>
                <v-card-title>Notes</v-card-title>
                <v-card-text>
                  <p>{{ viewedClient.notes }}</p>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12">
              <v-card outlined>
                <v-card-title>Projects ({{ clientProjects.length }})</v-card-title>
                <v-card-text>
                  <div v-if="clientProjects.length > 0">
                    <v-list dense>
                      <v-list-item v-for="project in clientProjects" :key="project.id">
                        <v-list-item-icon>
                          <v-icon :color="getStatusColor(project.status)">mdi-folder</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                          <v-list-item-title>{{ project.name }}</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ project.status }} | Budget: {{ formatCurrency(project.budget) }}
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </div>
                  <p v-else class="text-caption">No projects found for this client</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="createProject(viewedClient)">
            <v-icon left>mdi-folder-plus</v-icon>
            New Project
          </v-btn>
          <v-btn color="primary" text @click="editClient(viewedClient)">
            Edit
          </v-btn>
          <v-btn color="blue darken-1" text @click="dialogViewClient = false">
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
          Are you sure you want to delete this client? This action cannot be undone.
          <div class="warning-text mt-3" v-if="clientProjects.length > 0">
            <v-alert type="warning" text dense>
              This client has {{ clientProjects.length }} active project(s). Deleting this client will affect these projects.
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogDeleteConfirm = false">
            Cancel
          </v-btn>
          <v-btn color="red darken-1" text @click="deleteClient">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'ClientsPage',
  data() {
    return {
      search: '',
      loading: false,
      dialogClient: false,
      dialogViewClient: false,
      dialogDeleteConfirm: false,
      valid: true,
      
      headers: [
        { text: 'Client Name', value: 'name', sortable: true },
        { text: 'Contact Person', value: 'contactPerson', sortable: true },
        { text: 'Email', value: 'email', sortable: true },
        { text: 'Phone', value: 'phone', sortable: true },
        { text: 'Status', value: 'status', sortable: true },
        { text: 'Actions', value: 'actions', sortable: false, align: 'center' }
      ],
      
      clients: [
        {
          id: '1',
          name: 'Acme Corporation',
          contactPerson: 'John Smith',
          email: 'john@acmecorp.com',
          phone: '(555) 123-4567',
          address: {
            street: '123 Main St',
            city: 'Boston',
            state: 'MA',
            zipCode: '02110',
            country: 'USA'
          },
          totalBudget: 250000,
          notes: 'Key client for digital transformation initiatives',
          isActive: true,
          createdAt: '2023-01-15T12:00:00Z'
        },
        {
          id: '2',
          name: 'Globex Industries',
          contactPerson: 'Jane Miller',
          email: 'jane@globex.com',
          phone: '(555) 987-6543',
          address: {
            street: '456 Commerce Ave',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            country: 'USA'
          },
          totalBudget: 175000,
          notes: 'Expanding to international markets in Q3',
          isActive: true,
          createdAt: '2023-02-20T12:00:00Z'
        },
        {
          id: '3',
          name: 'Initech',
          contactPerson: 'Michael Bolton',
          email: 'michael@initech.com',
          phone: '(555) 456-7890',
          address: {
            street: '789 Tech Blvd',
            city: 'Austin',
            state: 'TX',
            zipCode: '73301',
            country: 'USA'
          },
          totalBudget: 85000,
          notes: 'Focus on internal software tools',
          isActive: true,
          createdAt: '2023-03-05T12:00:00Z'
        },
        {
          id: '4',
          name: 'Umbrella Corp',
          contactPerson: 'Albert Wesker',
          email: 'wesker@umbrella.com',
          phone: '(555) 789-0123',
          address: {
            street: '100 Research Dr',
            city: 'Raccoon City',
            state: 'WA',
            zipCode: '98001',
            country: 'USA'
          },
          totalBudget: 320000,
          notes: 'Pharmaceutical division projects',
          isActive: false,
          createdAt: '2022-11-12T12:00:00Z'
        },
        {
          id: '5',
          name: 'Stark Industries',
          contactPerson: 'Pepper Potts',
          email: 'pepper@stark.com',
          phone: '(555) 234-5678',
          address: {
            street: '200 Innovation Way',
            city: 'Malibu',
            state: 'CA',
            zipCode: '90265',
            country: 'USA'
          },
          totalBudget: 500000,
          notes: 'Clean energy initiatives',
          isActive: true,
          createdAt: '2023-04-10T12:00:00Z'
        }
      ],
      
      // Sample projects for clients
      projects: [
        {
          id: '1',
          clientId: '1',
          name: 'Website Redesign',
          status: 'Active',
          budget: 45000
        },
        {
          id: '2',
          clientId: '2',
          name: 'Mobile App Development',
          status: 'Active',
          budget: 120000
        },
        {
          id: '3',
          clientId: '3',
          name: 'Brand Strategy',
          status: 'Completed',
          budget: 35000
        },
        {
          id: '4',
          clientId: '1',
          name: 'Data Migration',
          status: 'On Hold',
          budget: 28000
        },
        {
          id: '5',
          clientId: '2',
          name: 'E-commerce Integration',
          status: 'Active',
          budget: 18000
        }
      ],
      
      editedIndex: -1,
      editedItem: {
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        totalBudget: 0,
        notes: '',
        isActive: true
      },
      defaultItem: {
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        totalBudget: 0,
        notes: '',
        isActive: true
      },
      
      viewedClient: null,
      
      emailRules: [
        v => !!v || 'Email is required',
        v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'Email must be valid'
      ]
    }
  },
  
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? 'New Client' : 'Edit Client'
    },
    
    hasAddress() {
      if (!this.viewedClient || !this.viewedClient.address) return false;
      
      const address = this.viewedClient.address;
      return !!(address.street || address.city || address.state || address.zipCode || address.country);
    },
    
    cityStateZip() {
      if (!this.viewedClient || !this.viewedClient.address) return '';
      
      const address = this.viewedClient.address;
      let parts = [];
      
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.zipCode) parts.push(address.zipCode);
      
      return parts.join(', ');
    },
    
    clientProjects() {
      if (!this.viewedClient) return [];
      
      return this.projects.filter(project => project.clientId === this.viewedClient.id);
    }
  },
  
  methods: {
    // Format currency
    formatCurrency(value) {
      if (!value && value !== 0) return 'N/A';
      return `$${value.toLocaleString()}`;
    },
    
    // Get appropriate color for project status chip
    getStatusColor(status) {
      switch (status) {
        case 'Active': return 'green';
        case 'Planning': return 'blue';
        case 'On Hold': return 'orange';
        case 'Completed': return 'teal';
        case 'Cancelled': return 'red';
        default: return 'grey';
      }
    },
    
    // View client details
    viewClient(item) {
      this.viewedClient = Object.assign({}, item);
      this.dialogViewClient = true;
    },
    
    // Edit client
    editClient(item) {
      this.editedIndex = this.clients.findIndex(c => c.id === item.id);
      this.editedItem = Object.assign({}, item);
      
      // Ensure address object exists
      if (!this.editedItem.address) {
        this.editedItem.address = {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        };
      }
      
      this.dialogViewClient = false;
      this.dialogClient = true;
    },
    
    // Create a new project for this client
    createProject(client) {
      // Navigate to projects page with client ID
      // In a real app, this would navigate to projects page with client pre-selected
      this.$router.push('/projects?clientId=' + client.id);
      this.dialogViewClient = false;
    },
    
    // Confirm deletion
    confirmDelete(item) {
      this.editedIndex = this.clients.findIndex(c => c.id === item.id);
      this.viewedClient = Object.assign({}, item);
      this.dialogDeleteConfirm = true;
    },
    
    // Delete client
    deleteClient() {
      // In a real app, you would call the API to delete the client
      this.clients.splice(this.editedIndex, 1);
      this.closeDeleteDialog();
    },
    
    // Close delete dialog
    closeDeleteDialog() {
      this.dialogDeleteConfirm = false;
      this.$nextTick(() => {
        this.viewedClient = null;
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    
    // Close edit dialog
    closeDialog() {
      this.dialogClient = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        if (this.$refs.form) {
          this.$refs.form.reset();
        }
      });
    },
    
    // Save client
    saveClient() {
      if (!this.$refs.form.validate()) return;
      
      // In a real app, you would call the API to save the client
      if (this.editedIndex > -1) {
        // Update existing client
        Object.assign(this.clients[this.editedIndex], this.editedItem);
      } else {
        // Create new client
        const newClient = Object.assign({}, this.editedItem);
        
        // Generate a simple ID (in a real app, this would come from the backend)
        newClient.id = Math.random().toString(36).substring(2, 9);
        
        // Set created date
        newClient.createdAt = new Date().toISOString();
        
        // Add to array
        this.clients.push(newClient);
      }
      
      this.closeDialog();
    },

    // eslint-disable-next-line no-unused-vars
    fetchResourceProjects(resourceId) {
      // Method implementation...
    }
  }
}
</script>

<style scoped>
.clients-container {
  padding: 20px;
}
.warning-text {
  font-weight: 500;
}
</style>
