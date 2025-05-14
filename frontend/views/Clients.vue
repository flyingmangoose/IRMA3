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
    <v-dialog v-model="dialogClient" max-width="700px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        
        <v-card-text>
          <v-container>
            <v-form ref="form" v-model="valid">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.name"
                    label="Client Name*"
                    :rules="[v => !!v || 'Name is required']"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.contactPerson"
                    label="Contact Person*"
                    :rules="[v => !!v || 'Contact person is required']"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.email"
                    label="Email*"
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
                  <v-divider class="mb-3"></v-divider>
                  <div class="text-subtitle-1 mb-2">Address</div>
                </v-col>
                
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.address.street"
                    label="Street Address"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field
                    v-model="editedItem.address.city"
                    label="City"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field
                    v-model="editedItem.address.state"
                    label="State/Province"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field
                    v-model="editedItem.address.zipCode"
                    label="Postal Code"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.address.country"
                    label="Country"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.totalBudget"
                    label="Total Budget"
                    type="number"
                    prefix="$"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
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
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="blue darken-1" text @click="saveClient" :disabled="!valid">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- View Client Dialog -->
    <v-dialog v-model="dialogViewClient" max-width="700px">
      <v-card v-if="viewedClient">
        <v-card-title>
          <span class="text-h5">{{ viewedClient.name }}</span>
          <v-spacer></v-spacer>
          <v-chip
            :color="viewedClient.isActive ? 'green' : 'grey'"
            text-color="white"
            small
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
                    <v-list-item-subtitle v-if="viewedClient.address.street">
                      {{ viewedClient.address.street }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-if="cityStateZip">
                      {{ cityStateZip }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-if="viewedClient.address.country">
                      {{ viewedClient.address.country }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-cash</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Total Budget</v-list-item-title>
                    <v-list-item-subtitle>{{ formatCurrency(viewedClient.totalBudget) }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item v-if="viewedClient.notes">
                  <v-list-item-icon>
                    <v-icon>mdi-note-text</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Notes</v-list-item-title>
                    <v-list-item-subtitle>{{ viewedClient.notes }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
          
          <v-divider class="my-3"></v-divider>
          
          <v-row>
            <v-col cols="12">
              <div class="text-h6 mb-3">Projects</div>
              <v-data-table
                :headers="[
                  { text: 'Project Name', value: 'name', sortable: true },
                  { text: 'Status', value: 'status', sortable: true },
                  { text: 'Budget', value: 'budget', sortable: true }
                ]"
                :items="clientProjects"
                :items-per-page="5"
                class="elevation-1"
                :no-data-text="'No projects found for this client'"
              >
                <template v-slot:[`item.status`]="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    text-color="white"
                    small
                  >
                    {{ item.status }}
                  </v-chip>
                </template>
                
                <template v-slot:[`item.budget`]="{ item }">
                  {{ formatCurrency(item.budget) }}
                </template>
              </v-data-table>
              
              <div class="d-flex justify-end mt-3">
                <v-btn 
                  color="primary" 
                  outlined 
                  @click="createProject(viewedClient)"
                >
                  <v-icon left>mdi-plus</v-icon>
                  Create Project
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-btn color="error" text @click="confirmDelete(viewedClient)">
            <v-icon left>mdi-delete</v-icon>
            Delete
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogViewClient = false">
            Close
          </v-btn>
          <v-btn color="primary" @click="editClient(viewedClient)">
            <v-icon left>mdi-pencil</v-icon>
            Edit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDeleteConfirm" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Delete Client</v-card-title>
        <v-card-text>
          Are you sure you want to delete the client "{{ viewedClient ? viewedClient.name : '' }}"?<br><br>
          <span class="warning-text">This action cannot be undone.</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="error" text @click="deleteClient">Delete</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { clientService, projectService } from '@/services';

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
      
      clients: [],
      projects: [],
      
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
  
  created() {
    this.fetchClients();
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
    // Fetch clients from API
    async fetchClients() {
      this.loading = true;
      try {
        const response = await clientService.getAllClients();
        this.clients = response.data;
        
        // Fetch projects data for the clients
        this.fetchProjects();
      } catch (error) {
        console.error('Error fetching clients:', error);
        // Use mock data as fallback if API fails
        this.loadMockData();
      } finally {
        this.loading = false;
      }
    },
    
    // Fetch projects data
    async fetchProjects() {
      try {
        const response = await projectService.getAllProjects();
        this.projects = response.data;
      } catch (error) {
        console.error('Error fetching projects:', error);
        // Keep mock projects data as fallback
      }
    },
    
    // Load mock data (as fallback if API fails)
    loadMockData() {
      // This is only used if the API call fails
      this.clients = [
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
        // Add other mock clients as needed
      ];
    },
    
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
    async viewClient(item) {
      this.viewedClient = Object.assign({}, item);
      
      // Get client projects if not loaded yet
      if (this.projects.length === 0) {
        try {
          const response = await clientService.getClientProjects(item.id);
          const clientProjects = response.data;
          if (clientProjects.length) {
            // Add to existing projects
            this.projects = [...this.projects, ...clientProjects.filter(p => 
              !this.projects.some(existing => existing.id === p.id)
            )];
          }
        } catch (error) {
          console.error('Error fetching client projects:', error);
        }
      }
      
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
    async deleteClient() {
      try {
        await clientService.deleteClient(this.viewedClient.id);
        // Remove from local array after successful API call
        this.clients.splice(this.editedIndex, 1);
      } catch (error) {
        console.error('Error deleting client:', error);
        // Show error notification
      } finally {
        this.closeDeleteDialog();
      }
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
    async saveClient() {
      if (!this.$refs.form.validate()) return;
      
      try {
        if (this.editedIndex > -1) {
          // Update existing client
          const response = await clientService.updateClient(
            this.editedItem.id, 
            this.editedItem
          );
          // Update in the array
          Object.assign(this.clients[this.editedIndex], response.data);
        } else {
          // Create new client
          const response = await clientService.createClient(this.editedItem);
          // Add to array
          this.clients.push(response.data);
        }
        this.closeDialog();
      } catch (error) {
        console.error('Error saving client:', error);
        // Show error notification
      }
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
