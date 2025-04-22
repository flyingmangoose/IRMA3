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
        <template v-slot:[`item.client`]="{ item }">
          {{ item.client }}
        </template>

        <!-- Project Manager column -->
        <template v-slot:[`item.projectManagerName`]="{ item }">
          {{ item.projectManagerName }}
        </template>

        <!-- Status column -->
        <template v-slot:[`item.status`]="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            text-color="white"
            small
          >
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Budget column -->
        <template v-slot:[`item.budget`]="{ item }">
          ${{ item.budget.toLocaleString() }}
        </template>

        <!-- Budget used column with progress bar -->
        <template v-slot:[`item.budgetUsedPercentage`]="{ item }">
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
        <template v-slot:[`item.actions`]="{ item }">
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
                  <v-select
                    v-model="editedItem.projectManagerId"
                    :items="projectManagers"
                    item-text="name"
                    item-value="id"
                    label="Project Manager"
                    :rules="[v => !!v || 'Project Manager is required']"
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
    <v-dialog v-model="dialogViewProject" max-width="900px">
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

        <v-tabs v-model="activeTab">
          <v-tab>Overview</v-tab>
          <v-tab>Team</v-tab>
          <v-tab>Budget</v-tab>
          <v-tab>Timeline</v-tab>
        </v-tabs>
        
        <v-tabs-items v-model="activeTab">
          <!-- Overview Tab -->
          <v-tab-item>
            <v-card flat>
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
                          <v-icon>mdi-account-tie</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                          <v-list-item-title>Project Manager</v-list-item-title>
                          <v-list-item-subtitle>{{ viewedProject.projectManagerName }}</v-list-item-subtitle>
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
                </v-row>
              </v-card-text>
            </v-card>
          </v-tab-item>

          <!-- Team Tab -->
          <v-tab-item>
            <v-card flat>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-data-table
                      :headers="teamHeaders"
                      :items="viewedProject.team || []"
                      hide-default-footer
                    >
                      <template v-slot:top>
                        <v-toolbar flat>
                          <v-toolbar-title>Project Team</v-toolbar-title>
                          <v-spacer></v-spacer>
                          <v-btn
                            color="primary"
                            small
                            @click="openAddTeamMemberDialog"
                          >
                            <v-icon small left>mdi-account-plus</v-icon>
                            Add Team Member
                          </v-btn>
                        </v-toolbar>
                      </template>

                      <template v-slot:item.actions="{ item }">
                        <v-icon small @click="openEditTeamMemberDialog(item)">
                          mdi-pencil
                        </v-icon>
                        <v-icon small class="ml-2" @click="removeTeamMember(item)">
                          mdi-account-remove
                        </v-icon>
                      </template>
                      
                      <template v-slot:item.hourlyRate="{ item }">
                        ${{ item.hourlyRate.toFixed(2) }}
                      </template>
                      
                      <template v-slot:item.allocation="{ item }">
                        {{ item.allocation }}%
                      </template>
                      
                      <template v-slot:item.utilization="{ item }">
                        <v-progress-linear
                          :value="item.utilization || 0"
                          height="15"
                          :color="getUtilizationColor(item.utilization || 0)"
                        >
                          <template v-slot:default>
                            <span class="white--text">{{ item.utilization || 0 }}%</span>
                          </template>
                        </v-progress-linear>
                      </template>
                      
                      <template v-slot:no-data>
                        <p class="text-center">No team members assigned</p>
                      </template>
                    </v-data-table>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-tab-item>

          <!-- Budget Tab -->
          <v-tab-item>
            <v-card flat>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card outlined>
                      <v-card-title>Budget Summary</v-card-title>
                      <v-card-text>
                        <v-list>
                          <v-list-item>
                            <v-list-item-content>
                              <v-list-item-title>Total Budget</v-list-item-title>
                            </v-list-item-content>
                            <v-list-item-action>
                              ${{ viewedProject.budget.toLocaleString() }}
                            </v-list-item-action>
                          </v-list-item>
                          
                          <v-list-item>
                            <v-list-item-content>
                              <v-list-item-title>Used Budget</v-list-item-title>
                            </v-list-item-content>
                            <v-list-item-action>
                              ${{ (viewedProject.budget - viewedProject.budgetRemaining).toLocaleString() }}
                            </v-list-item-action>
                          </v-list-item>
                          
                          <v-list-item>
                            <v-list-item-content>
                              <v-list-item-title>Remaining Budget</v-list-item-title>
                            </v-list-item-content>
                            <v-list-item-action>
                              ${{ viewedProject.budgetRemaining.toLocaleString() }}
                            </v-list-item-action>
                          </v-list-item>
                        </v-list>
                        
                        <v-progress-linear
                          :value="viewedProject.budgetUsedPercentage"
                          height="20"
                          :color="getBudgetColor(viewedProject.budgetUsedPercentage)"
                          class="mt-4"
                        >
                          <template v-slot:default>
                            <strong>{{ viewedProject.budgetUsedPercentage }}% Used</strong>
                          </template>
                        </v-progress-linear>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <v-card outlined>
                      <v-card-title>Billing Settings</v-card-title>
                      <v-card-text>
                        <v-radio-group v-model="viewedProject.billingType" disabled>
                          <v-radio
                            label="Fixed Price"
                            value="fixed"
                          ></v-radio>
                          <v-radio
                            label="Time & Materials"
                            value="time-materials"
                          ></v-radio>
                        </v-radio-group>
                        
                        <v-text-field
                          v-if="viewedProject.billingType === 'time-materials'"
                          label="Default Hourly Rate"
                          prefix="$"
                          type="number"
                          v-model="viewedProject.defaultRate"
                          disabled
                        ></v-text-field>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <v-col cols="12">
                    <v-card outlined>
                      <v-card-title>Budget Breakdown</v-card-title>
                      <v-card-text>
                        <v-data-table
                          :headers="budgetHeaders"
                          :items="viewedProject.budgetItems || []"
                          hide-default-footer
                        >
                          <template v-slot:no-data>
                            <p class="text-center">No budget items available</p>
                          </template>
                        </v-data-table>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-tab-item>

          <!-- Timeline Tab -->
          <v-tab-item>
            <v-card flat>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-card outlined>
                      <v-card-title>Project Timeline</v-card-title>
                      <v-card-text>
                        <v-timeline dense>
                          <v-timeline-item
                            color="green"
                            small
                          >
                            <template v-slot:opposite>
                              {{ viewedProject.startDateFormatted }}
                            </template>
                            <div>
                              <div class="font-weight-bold">Project Start</div>
                              <div>Project kickoff</div>
                            </div>
                          </v-timeline-item>
                          
                          <v-timeline-item
                            v-for="(milestone, i) in viewedProject.milestones || []"
                            :key="i"
                            :color="milestone.completed ? 'green' : 'grey'"
                            small
                          >
                            <template v-slot:opposite>
                              {{ milestone.date }}
                            </template>
                            <div>
                              <div class="font-weight-bold">{{ milestone.title }}</div>
                              <div>{{ milestone.description }}</div>
                            </div>
                          </v-timeline-item>
                          
                          <v-timeline-item
                            v-if="viewedProject.endDateFormatted"
                            color="red"
                            small
                          >
                            <template v-slot:opposite>
                              {{ viewedProject.endDateFormatted }}
                            </template>
                            <div>
                              <div class="font-weight-bold">Project End</div>
                              <div>Planned completion date</div>
                            </div>
                          </v-timeline-item>
                        </v-timeline>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-tab-item>
        </v-tabs-items>

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

    <!-- Team Member Dialog -->
    <v-dialog v-model="dialogTeamMember" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editingExistingMember ? 'Edit Team Member' : 'Add Team Member' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="teamMemberForm" v-model="teamMemberValid">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="teamMemberForm.userId"
                    :items="availableUsers"
                    item-text="name"
                    item-value="id"
                    label="User"
                    :rules="[v => !!v || 'User is required']"
                    required
                    :disabled="editingExistingMember"
                  ></v-select>
                </v-col>
                
                <v-col cols="12">
                  <v-select
                    v-model="teamMemberForm.role"
                    :items="teamRoles"
                    label="Role on Project"
                    :rules="[v => !!v || 'Role is required']"
                    required
                  ></v-select>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="teamMemberForm.allocation"
                    label="Allocation (%)"
                    type="number"
                    min="1"
                    max="100"
                    :rules="[
                      v => !!v || 'Allocation is required',
                      v => v > 0 && v <= 100 || 'Allocation must be between 1-100%'
                    ]"
                    required
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="teamMemberForm.hourlyRate"
                    label="Hourly Rate"
                    prefix="$"
                    type="number"
                    min="0"
                    :rules="[
                      v => !!v || 'Hourly rate is required',
                      v => v >= 0 || 'Hourly rate cannot be negative'
                    ]"
                    required
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="teamMemberForm.notes"
                    label="Notes"
                    rows="3"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeTeamMemberDialog">
            Cancel
          </v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="saveTeamMember"
            :disabled="!teamMemberValid"
          >
            Save
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
        { text: 'Project Manager', value: 'projectManagerName', sortable: true },
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
          projectManagerId: '1',
          projectManagerName: 'John Smith',
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
          projectManagerId: '4',
          projectManagerName: 'Emily Chen',
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
          projectManagerId: '6',
          projectManagerName: 'Lisa Brown',
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
          projectManagerId: '7',
          projectManagerName: 'Tom Jackson',
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
          projectManagerId: '4',
          projectManagerName: 'Emily Chen',
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
        projectManagerId: '',
        description: '',
        startDate: '',
        startDateFormatted: '',
        endDate: '',
        endDateFormatted: '',
        budget: 0,
        status: 'Active',
        billingType: 'fixed',
        defaultRate: 125,
        team: [],
        budgetItems: [],
        milestones: []
      },
      defaultItem: {
        name: '',
        clientId: '',
        projectManagerId: '',
        description: '',
        startDate: '',
        startDateFormatted: '',
        endDate: '',
        endDateFormatted: '',
        budget: 0,
        status: 'Active',
        billingType: 'fixed',
        defaultRate: 125,
        team: [],
        budgetItems: [],
        milestones: []
      },
      
      viewedProject: null,
      
      clients: [
        { id: '1', name: 'Acme Corporation' },
        { id: '2', name: 'Globex Industries' },
        { id: '3', name: 'Initech' },
        { id: '4', name: 'Umbrella Corp' },
        { id: '5', name: 'Stark Industries' }
      ],
      
      // Project managers (users with PM role)
      projectManagers: [
        { id: '1', name: 'John Smith', role: 'Project Manager', department: 'Digital' },
        { id: '4', name: 'Emily Chen', role: 'Project Manager', department: 'Mobile' },
        { id: '6', name: 'Lisa Brown', role: 'Project Manager', department: 'Brand' },
        { id: '7', name: 'Tom Jackson', role: 'Project Manager', department: 'Data' },
        { id: '9', name: 'Michael Rodriguez', role: 'Project Manager', department: 'Enterprise' }
      ],
      
      statusOptions: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'],
      
      activeTab: 0,
      
      // Team member management
      dialogTeamMember: false,
      teamMemberValid: true,
      teamMemberForm: {
        userId: '',
        name: '',
        role: '',
        allocation: 100,
        hourlyRate: 0,
        notes: ''
      },
      editingExistingMember: false,
      teamMemberIndex: -1,
      
      // Team headers
      teamHeaders: [
        { text: 'Name', value: 'name' },
        { text: 'Role', value: 'role' },
        { text: 'Allocation', value: 'allocation' },
        { text: 'Hourly Rate', value: 'hourlyRate' },
        { text: 'Utilization', value: 'utilization' },
        { text: 'Actions', value: 'actions', sortable: false, align: 'center' }
      ],
      
      // Budget headers
      budgetHeaders: [
        { text: 'Category', value: 'category' },
        { text: 'Description', value: 'description' },
        { text: 'Amount', value: 'amount' },
        { text: 'Utilized', value: 'utilized' }
      ],
      
      // Team roles
      teamRoles: [
        'Project Manager',
        'Developer',
        'Designer',
        'QA Tester',
        'Business Analyst',
        'DevOps Engineer',
        'Consultant'
      ],
      
      // All available users that can be added to a project
      availableUsers: [
        { id: '1', name: 'John Smith', department: 'Digital', baseRate: 125 },
        { id: '2', name: 'Sarah Johnson', department: 'Design', baseRate: 115 },
        { id: '3', name: 'Mike Wilson', department: 'Development', baseRate: 130 },
        { id: '4', name: 'Emily Chen', department: 'Mobile', baseRate: 135 },
        { id: '5', name: 'David Park', department: 'Development', baseRate: 125 },
        { id: '6', name: 'Lisa Brown', department: 'Brand', baseRate: 115 },
        { id: '7', name: 'Tom Jackson', department: 'Data', baseRate: 140 },
        { id: '8', name: 'Rachel Kim', department: 'Analytics', baseRate: 120 },
        { id: '9', name: 'Michael Rodriguez', department: 'Enterprise', baseRate: 145 }
      ]
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
      
      // Initialize tabs-related data if not present
      if (!this.viewedProject.team) {
        this.viewedProject.team = [];
      }
      
      if (!this.viewedProject.budgetItems) {
        this.viewedProject.budgetItems = [];
      }
      
      if (!this.viewedProject.milestones) {
        this.viewedProject.milestones = [];
      }
      
      if (!this.viewedProject.billingType) {
        this.viewedProject.billingType = 'fixed';
      }
      
      if (!this.viewedProject.defaultRate) {
        this.viewedProject.defaultRate = 125;
      }
      
      this.dialogViewProject = true;
      this.activeTab = 0;
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
        
        // Add project manager name from id
        const projectManager = this.projectManagers.find(pm => pm.id === updatedProject.projectManagerId);
        updatedProject.projectManagerName = projectManager ? projectManager.name : '';
        
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
        
        // Add project manager name from id
        const projectManager = this.projectManagers.find(pm => pm.id === newProject.projectManagerId);
        newProject.projectManagerName = projectManager ? projectManager.name : '';
        
        // Set default values
        newProject.budgetRemaining = newProject.budget;
        newProject.budgetUsedPercentage = 0;
        newProject.team = [];
        newProject.budgetItems = [];
        newProject.milestones = [];
        newProject.billingType = this.editedItem.billingType || 'fixed';
        newProject.defaultRate = this.editedItem.defaultRate || 125;
        
        if (projectManager) {
          // Automatically add PM to the team as Lead
          newProject.team.push({
            id: projectManager.id,
            name: projectManager.name,
            role: 'Lead'
          });
        }
        
        // Add to array
        this.projects.push(newProject);
      }
      
      this.closeDialog();
    },
    
    // Get color for utilization
    getUtilizationColor(percentage) {
      if (percentage < 70) return 'blue';
      if (percentage < 85) return 'green';
      if (percentage < 95) return 'orange';
      return 'red';
    },
    
    // Open the add team member dialog
    openAddTeamMemberDialog() {
      this.editingExistingMember = false;
      this.teamMemberIndex = -1;
      
      // Reset the form
      this.teamMemberForm = {
        userId: '',
        name: '',
        role: 'Developer',
        allocation: 100,
        hourlyRate: 0,
        notes: '',
        utilization: 0
      };
      
      this.dialogTeamMember = true;
    },
    
    // Open the edit team member dialog
    openEditTeamMemberDialog(member) {
      this.editingExistingMember = true;
      this.teamMemberIndex = this.viewedProject.team.findIndex(m => m.id === member.id);
      
      // Populate the form
      this.teamMemberForm = {
        userId: member.id,
        name: member.name,
        role: member.role,
        allocation: member.allocation,
        hourlyRate: member.hourlyRate,
        notes: member.notes || '',
        utilization: member.utilization || 0
      };
      
      this.dialogTeamMember = true;
    },
    
    // Close team member dialog
    closeTeamMemberDialog() {
      this.dialogTeamMember = false;
      this.$nextTick(() => {
        if (this.$refs.teamMemberForm) {
          this.$refs.teamMemberForm.reset();
        }
      });
    },
    
    // Save team member
    saveTeamMember() {
      if (!this.$refs.teamMemberForm.validate()) return;
      
      if (this.editingExistingMember) {
        // Update existing team member
        const updatedMember = {
          id: this.teamMemberForm.userId,
          name: this.teamMemberForm.name,
          role: this.teamMemberForm.role,
          allocation: this.teamMemberForm.allocation,
          hourlyRate: this.teamMemberForm.hourlyRate,
          notes: this.teamMemberForm.notes,
          utilization: this.teamMemberForm.utilization
        };
        
        // Update in the array
        if (this.teamMemberIndex !== -1) {
          this.viewedProject.team.splice(this.teamMemberIndex, 1, updatedMember);
        }
      } else {
        // Add new team member
        const user = this.availableUsers.find(u => u.id === this.teamMemberForm.userId);
        if (!user) return;
        
        const newMember = {
          id: user.id,
          name: user.name,
          role: this.teamMemberForm.role,
          allocation: this.teamMemberForm.allocation,
          hourlyRate: this.teamMemberForm.hourlyRate || user.baseRate,
          notes: this.teamMemberForm.notes,
          utilization: 0 // New members start with 0 utilization
        };
        
        // Initialize team array if it doesn't exist
        if (!this.viewedProject.team) {
          this.viewedProject.team = [];
        }
        
        // Add to the array
        this.viewedProject.team.push(newMember);
      }
      
      // Update the project in the main array
      const index = this.projects.findIndex(p => p.id === this.viewedProject.id);
      if (index !== -1) {
        this.projects[index].team = [...this.viewedProject.team];
      }
      
      this.closeTeamMemberDialog();
    },
    
    // Remove team member
    removeTeamMember(member) {
      // Remove the team member from the project
      const index = this.viewedProject.team.findIndex(m => m.id === member.id);
      if (index !== -1) {
        this.viewedProject.team.splice(index, 1);
        
        // Update the project in the main array
        const projectIndex = this.projects.findIndex(p => p.id === this.viewedProject.id);
        if (projectIndex !== -1) {
          this.projects[projectIndex].team = [...this.viewedProject.team];
        }
      }
    }
  }
}
</script>

<style scoped>
.projects-container {
  padding: 20px;
}
</style>
