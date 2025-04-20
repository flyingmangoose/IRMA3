<template>
  <div class="projects-container">
    <v-card class="mb-4">
      <v-card-title>
        Projects
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search projects"
          single-line
          hide-details
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="dialogProject = true" class="ml-2">
          <v-icon left>mdi-plus</v-icon>
          New Project
        </v-btn>
        <v-btn outlined class="ml-2">
          <v-icon left>mdi-filter</v-icon>
          Filter
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="projects"
        :search="search"
        :loading="loading"
        class="elevation-1"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20],
          'items-per-page-text': 'Projects per page'
        }"
      >
        <!-- Client column -->
        <template v-slot:item.client="{ item }">
          {{ item.client }}
        </template>

        <!-- Status column -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            text-color="white"
            small
          >
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Budget column -->
        <template v-slot:item.budget="{ item }">
          ${{ item.budget.toLocaleString() }}
        </template>

        <!-- Budget used column with progress bar -->
        <template v-slot:item.budgetUsedPercentage="{ item }">
          <v-progress-linear
            :value="item.budgetUsedPercentage"
            height="15"
            :color="getBudgetColor(item.budgetUsedPercentage)"
          >
            <template v-slot:default>
              <span class="white--text">{{ item.budgetUsedPercentage }}%</span>
            </template>
          </v-progress-linear>
        </template>

        <!-- Actions column -->
        <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click="viewProject(item)">
            mdi-eye
          </v-icon>
          <v-icon small class="mr-2" @click="editProject(item)">
            mdi-pencil
          </v-icon>
          <v-icon small @click="confirmDelete(item)">
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <!-- New/Edit Project Dialog -->
    <v-dialog v-model="dialogProject" max-width="600px">
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
                    label="Project Name"
                    :rules="[v => !!v || 'Project name is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-select
                    v-model="editedItem.clientId"
                    :items="clients"
                    item-text="name"
                    item-value="id"
                    label="Client"
                    :rules="[v => !!v || 'Client is required']"
                    required
                  ></v-select>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="editedItem.description"
                    label="Description"
                    rows="3"
                  ></v-textarea>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-menu
                    v-model="startDateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    min-width="290px"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        v-model="editedItem.startDateFormatted"
                        label="Start Date"
                        readonly
                        v-bind="attrs"
                        v-on="on"
                        :rules="[v => !!v || 'Start date is required']"
                        required
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="editedItem.startDate"
                      @input="formatStartDate(); startDateMenu = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-menu
                    v-model="endDateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    min-width="290px"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        v-model="editedItem.endDateFormatted"
                        label="End Date"
                        readonly
                        v-bind="attrs"
                        v-on="on"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="editedItem.endDate"
                      @input="formatEndDate(); endDateMenu = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.budget"
                    label="Budget"
                    prefix="$"
                    type="number"
                    :rules="[
                      v => !!v || 'Budget is required',
                      v => v > 0 || 'Budget must be greater than 0'
                    ]"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editedItem.status"
                    :items="statusOptions"
                    label="Status"
                    required
                  ></v-select>
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
            @click="saveProject"
            :disabled="!valid"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Project Dialog -->
    <v-dialog v-model="dialogViewProject" max-width="800px">
      <v-card v-if="viewedProject">
        <v-card-title class="headline">
          {{ viewedProject.name }}
          <v-spacer></v-spacer>
          <v-chip
            :color="getStatusColor(viewedProject.status)"
            text-color="white"
          >
            {{ viewedProject.status }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-list>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-account-group</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Client</v-list-item-title>
                    <v-list-item-subtitle>{{ viewedProject.client }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-calendar-range</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Timeline</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ viewedProject.startDateFormatted }} - 
                      {{ viewedProject.endDateFormatted || 'Ongoing' }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-currency-usd</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Budget</v-list-item-title>
                    <v-list-item-subtitle>
                      ${{ viewedProject.budget.toLocaleString() }}
                      ({{ viewedProject.budgetUsedPercentage }}% used)
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12">
              <v-card outlined>
                <v-card-title>Description</v-card-title>
                <v-card-text>
                  <p v-if="viewedProject.description">{{ viewedProject.description }}</p>
                  <p v-else class="text-caption">No description provided</p>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12">
              <v-card outlined>
                <v-card-title>Team Members</v-card-title>
                <v-card-text>
                  <v-chip
                    v-for="member in viewedProject.team"
                    :key="member.id"
                    class="ma-1"
                  >
                    <v-avatar left>
                      <v-icon>mdi-account</v-icon>
                    </v-avatar>
                    {{ member.name }} ({{ member.role }})
                  </v-chip>
                  <p v-if="!viewedProject.team || viewedProject.team.length === 0" class="text-caption">
                    No team members assigned
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="editProject(viewedProject)">
            Edit
          </v-btn>
          <v-btn color="blue darken-1" text @click="dialogViewProject = false">
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
          Are you sure you want to delete this project? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogDeleteConfirm = false">
            Cancel
          </v-btn>
          <v-btn color="red darken-1" text @click="deleteProject">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'ProjectsPage',
  data() {
    return {
      search: '',
      loading: false,
      dialogProject: false,
      dialogViewProject: false,
      dialogDeleteConfirm: false,
      valid: true,
      
      startDateMenu: false,
      endDateMenu: false,
      
      headers: [
        { text: 'Project Name', value: 'name', sortable: true },
        { text: 'Client', value: 'client', sortable: true },
        { text: 'Status', value: 'status', sortable: true },
        { text: 'Start Date', value: 'startDateFormatted', sortable: true },
        { text: 'Budget', value: 'budget', sortable: true },
        { text: 'Budget Used', value: 'budgetUsedPercentage', sortable: true },
        { text: 'Actions', value: 'actions', sortable: false, align: 'center' }
      ],
      
      projects: [
        {
          id: '1',
          name: 'Website Redesign',
          clientId: '1',
          client: 'Acme Corporation',
          description: 'Complete redesign of corporate website with new branding',
          startDate: '2023-01-15',
          startDateFormatted: 'Jan 15, 2023',
          endDate: '2023-05-30',
          endDateFormatted: 'May 30, 2023',
          budget: 45000,
          budgetRemaining: 15000,
          budgetUsedPercentage: 67,
          status: 'Active',
          team: [
            { id: '1', name: 'John Smith', role: 'Lead' },
            { id: '2', name: 'Sarah Johnson', role: 'Designer' },
            { id: '3', name: 'Mike Wilson', role: 'Developer' }
          ]
        },
        {
          id: '2',
          name: 'Mobile App Development',
          clientId: '2',
          client: 'Globex Industries',
          description: 'Create iOS and Android apps for customer portal',
          startDate: '2023-02-10',
          startDateFormatted: 'Feb 10, 2023',
          endDate: '2023-08-15',
          endDateFormatted: 'Aug 15, 2023',
          budget: 120000,
          budgetRemaining: 80000,
          budgetUsedPercentage: 33,
          status: 'Active',
          team: [
            { id: '4', name: 'Emily Chen', role: 'Lead' },
            { id: '5', name: 'David Park', role: 'Developer' }
          ]
        },
        {
          id: '3',
          name: 'Brand Strategy',
          clientId: '3',
          client: 'Initech',
          description: 'Develop new brand strategy and guidelines',
          startDate: '2022-11-01',
          startDateFormatted: 'Nov 1, 2022',
          endDate: '2023-03-15',
          endDateFormatted: 'Mar 15, 2023',
          budget: 35000,
          budgetRemaining: 0,
          budgetUsedPercentage: 100,
          status: 'Completed',
          team: [
            { id: '1', name: 'John Smith', role: 'Consultant' },
            { id: '6', name: 'Lisa Brown', role: 'Brand Strategist' }
          ]
        },
        {
          id: '4',
          name: 'Data Migration',
          clientId: '1',
          client: 'Acme Corporation',
          description: 'Migrate legacy CRM data to new platform',
          startDate: '2023-03-01',
          startDateFormatted: 'Mar 1, 2023',
          endDate: null,
          endDateFormatted: null,
          budget: 28000,
          budgetRemaining: 5000,
          budgetUsedPercentage: 82,
          status: 'On Hold',
          team: [
            { id: '7', name: 'Tom Jackson', role: 'Data Specialist' },
            { id: '8', name: 'Rachel Kim', role: 'Analyst' }
          ]
        },
        {
          id: '5',
          name: 'E-commerce Integration',
          clientId: '2',
          client: 'Globex Industries',
          description: 'Integrate payment gateway and shipping services',
          startDate: '2023-04-15',
          startDateFormatted: 'Apr 15, 2023',
          endDate: '2023-06-30',
          endDateFormatted: 'Jun 30, 2023',
          budget: 18000,
          budgetRemaining: 12000,
          budgetUsedPercentage: 33,
          status: 'Active',
          team: [
            { id: '5', name: 'David Park', role: 'Developer' }
          ]
        }
      ],
      
      editedIndex: -1,
      editedItem: {
        name: '',
        clientId: '',
        description: '',
        startDate: '',
        startDateFormatted: '',
        endDate: '',
        endDateFormatted: '',
        budget: 0,
        status: 'Active'
      },
      defaultItem: {
        name: '',
        clientId: '',
        description: '',
        startDate: '',
        startDateFormatted: '',
        endDate: '',
        endDateFormatted: '',
        budget: 0,
        status: 'Active'
      },
      
      viewedProject: null,
      
      clients: [
        { id: '1', name: 'Acme Corporation' },
        { id: '2', name: 'Globex Industries' },
        { id: '3', name: 'Initech' },
        { id: '4', name: 'Umbrella Corp' },
        { id: '5', name: 'Stark Industries' }
      ],
      
      statusOptions: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled']
    }
  },
  
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? 'New Project' : 'Edit Project'
    }
  },
  
  methods: {
    // Get appropriate color for status chip
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
    
    // Get appropriate color for budget progress bar
    getBudgetColor(percentage) {
      if (percentage < 50) return 'green';
      if (percentage < 75) return 'orange';
      return 'red';
    },
    
    // Format the dates for display
    formatStartDate() {
      if (!this.editedItem.startDate) return;
      const date = new Date(this.editedItem.startDate);
      this.editedItem.startDateFormatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    },
    
    formatEndDate() {
      if (!this.editedItem.endDate) {
        this.editedItem.endDateFormatted = null;
        return;
      }
      const date = new Date(this.editedItem.endDate);
      this.editedItem.endDateFormatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    },
    
    // View project details
    viewProject(item) {
      this.viewedProject = Object.assign({}, item);
      this.dialogViewProject = true;
    },
    
    // Edit project
    editProject(item) {
      this.editedIndex = this.projects.findIndex(p => p.id === item.id);
      this.editedItem = Object.assign({}, item);
      this.dialogViewProject = false;
      this.dialogProject = true;
    },
    
    // Confirm deletion
    confirmDelete(item) {
      this.editedIndex = this.projects.findIndex(p => p.id === item.id);
      this.editedItem = Object.assign({}, item);
      this.dialogDeleteConfirm = true;
    },
    
    // Delete project
    deleteProject() {
      // In a real app, you would call the API to delete the project
      this.projects.splice(this.editedIndex, 1);
      this.closeDeleteDialog();
    },
    
    // Close delete dialog
    closeDeleteDialog() {
      this.dialogDeleteConfirm = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    
    // Close edit dialog
    closeDialog() {
      this.dialogProject = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        if (this.$refs.form) {
          this.$refs.form.reset();
        }
      });
    },
    
    // Save project
    saveProject() {
      if (!this.$refs.form.validate()) return;
      
      // In a real app, you would call the API to save the project
      if (this.editedIndex > -1) {
        // Update existing project
        const updatedProject = Object.assign({}, this.editedItem);
        // Add client name from id
        const client = this.clients.find(c => c.id === updatedProject.clientId);
        updatedProject.client = client ? client.name : '';
        
        // Update project in array
        Object.assign(this.projects[this.editedIndex], updatedProject);
      } else {
        // Create new project
        const newProject = Object.assign({}, this.editedItem);
        // Generate a simple ID (in a real app, this would come from the backend)
        newProject.id = Math.random().toString(36).substring(2, 9);
        
        // Add client name from id
        const client = this.clients.find(c => c.id === newProject.clientId);
        newProject.client = client ? client.name : '';
        
        // Set default values
        newProject.budgetRemaining = newProject.budget;
        newProject.budgetUsedPercentage = 0;
        
        // Add to array
        this.projects.push(newProject);
      }
      
      this.closeDialog();
    }
  }
}
</script>

<style scoped>
.projects-container {
  padding: 20px;
}
</style>
