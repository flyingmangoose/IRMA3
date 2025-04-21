<template>
  <div class="timesheet-container">
    <v-card class="mb-4">
      <v-card-title>
        Timesheets
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search entries"
          single-line
          hide-details
          class="mx-4"
        ></v-text-field>
        <v-menu
          ref="dateMenu"
          v-model="dateMenu"
          :close-on-content-click="false"
          :return-value.sync="dateFilter"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="dateFilter"
              label="Week"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
              hide-details
              class="mx-4"
              style="max-width: 150px;"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="dateFilter"
            type="date"
            no-title
            scrollable
          >
            <v-spacer></v-spacer>
            <v-btn text color="primary" @click="dateMenu = false">
              Cancel
            </v-btn>
            <v-btn text color="primary" @click="$refs.dateMenu.save(dateFilter)">
              OK
            </v-btn>
          </v-date-picker>
        </v-menu>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="openNewTimeEntryDialog">
          <v-icon left>mdi-plus</v-icon>
          Add Time Entry
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredTimeEntries"
        :search="search"
        :loading="loading"
        class="elevation-1"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [5, 10, 20, 50],
          'items-per-page-text': 'Entries per page'
        }"
      >
        <!-- Project column -->
        <template v-slot:[`item.project`]="{ item }">
          {{ getProjectName(item.projectId) }}
        </template>

        <!-- Date column -->
        <template v-slot:[`item.date`]="{ item }">
          {{ formatDate(item.date) }}
        </template>

        <!-- Hours column -->
        <template v-slot:[`item.hours`]="{ item }">
          <span :class="{ 'red--text': item.hours > 8 }">
            {{ item.hours }}
          </span>
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

        <!-- Actions column -->
        <template v-slot:[`item.actions`]="{ item }">
          <v-icon
            small
            class="mr-2"
            @click="editTimeEntry(item)"
            :disabled="!canEditTimeEntry(item)"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            small
            @click="deleteTimeEntry(item)"
            :disabled="!canDeleteTimeEntry(item)"
          >
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>

      <v-card-actions class="pt-2">
        <v-spacer></v-spacer>
        <v-chip color="primary" class="font-weight-bold">
          Total Hours: {{ totalHours }}
        </v-chip>
      </v-card-actions>
    </v-card>

    <!-- New/Edit Time Entry Dialog -->
    <v-dialog v-model="timeEntryDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="form" v-model="valid">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-menu
                    ref="datePickerMenu"
                    v-model="datePickerMenu"
                    :close-on-content-click="false"
                    :return-value.sync="editedItem.date"
                    transition="scale-transition"
                    offset-y
                    min-width="auto"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        v-model="editedItem.date"
                        label="Date *"
                        prepend-icon="mdi-calendar"
                        readonly
                        v-bind="attrs"
                        v-on="on"
                        :rules="[v => !!v || 'Date is required']"
                        required
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="editedItem.date"
                      no-title
                      scrollable
                    >
                      <v-spacer></v-spacer>
                      <v-btn text color="primary" @click="datePickerMenu = false">
                        Cancel
                      </v-btn>
                      <v-btn text color="primary" @click="$refs.datePickerMenu.save(editedItem.date)">
                        OK
                      </v-btn>
                    </v-date-picker>
                  </v-menu>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editedItem.projectId"
                    :items="availableProjects"
                    item-text="name"
                    item-value="id"
                    label="Project *"
                    :rules="[v => !!v || 'Project is required']"
                    required
                  ></v-select>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.hours"
                    label="Hours *"
                    type="number"
                    min="0.25"
                    max="24"
                    step="0.25"
                    :rules="[
                      v => !!v || 'Hours are required',
                      v => v > 0 || 'Hours must be greater than 0',
                      v => v <= 24 || 'Hours cannot exceed 24'
                    ]"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editedItem.status"
                    :items="statusOptions"
                    label="Status *"
                    :rules="[v => !!v || 'Status is required']"
                    required
                  ></v-select>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="editedItem.description"
                    label="Description *"
                    outlined
                    rows="3"
                    counter="200"
                    :rules="[
                      v => !!v || 'Description is required',
                      v => v.length <= 200 || 'Description cannot exceed 200 characters'
                    ]"
                    required
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
            @click="saveTimeEntry"
            :disabled="!valid"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this time entry? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogDelete = false">
            Cancel
          </v-btn>
          <v-btn color="red darken-1" text @click="deleteTimeEntryConfirm">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Submission Confirmation Dialog -->
    <v-dialog v-model="dialogSubmit" max-width="500px">
      <v-card>
        <v-card-title class="headline">Submit Timesheet</v-card-title>
        <v-card-text>
          Are you sure you want to submit your timesheet for the current period? 
          Once submitted, entries cannot be modified.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogSubmit = false">
            Cancel
          </v-btn>
          <v-btn color="green darken-1" text @click="submitTimesheet">
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Summary Card -->
    <v-card class="mt-4">
      <v-card-title>
        Weekly Summary
        <v-spacer></v-spacer>
        <v-btn 
          color="success" 
          @click="dialogSubmit = true"
          :disabled="!canSubmitTimesheet"
        >
          <v-icon left>mdi-send</v-icon>
          Submit Timesheet
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">Project</th>
                <th class="text-left">Mon</th>
                <th class="text-left">Tue</th>
                <th class="text-left">Wed</th>
                <th class="text-left">Thu</th>
                <th class="text-left">Fri</th>
                <th class="text-left">Sat</th>
                <th class="text-left">Sun</th>
                <th class="text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="summary in weekSummary" :key="summary.projectId">
                <td>{{ getProjectName(summary.projectId) }}</td>
                <td>{{ summary.hours.mon || '-' }}</td>
                <td>{{ summary.hours.tue || '-' }}</td>
                <td>{{ summary.hours.wed || '-' }}</td>
                <td>{{ summary.hours.thu || '-' }}</td>
                <td>{{ summary.hours.fri || '-' }}</td>
                <td>{{ summary.hours.sat || '-' }}</td>
                <td>{{ summary.hours.sun || '-' }}</td>
                <td class="font-weight-bold">{{ summary.total }}</td>
              </tr>
              <tr class="grey lighten-4">
                <td class="font-weight-bold">Daily Total</td>
                <td class="font-weight-bold">{{ dailyTotals.mon }}</td>
                <td class="font-weight-bold">{{ dailyTotals.tue }}</td>
                <td class="font-weight-bold">{{ dailyTotals.wed }}</td>
                <td class="font-weight-bold">{{ dailyTotals.thu }}</td>
                <td class="font-weight-bold">{{ dailyTotals.fri }}</td>
                <td class="font-weight-bold">{{ dailyTotals.sat }}</td>
                <td class="font-weight-bold">{{ dailyTotals.sun }}</td>
                <td class="font-weight-bold">{{ weeklyTotal }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import axios from 'axios';
import { mapGetters } from 'vuex';
import moment from 'moment';

export default {
  name: 'TimesheetsPage',
  
  data() {
    return {
      search: '',
      loading: false,
      timeEntryDialog: false,
      dialogDelete: false,
      dialogSubmit: false,
      dateMenu: false,
      datePickerMenu: false,
      valid: true,
      dateFilter: this.getCurrentWeekStart(),
      
      headers: [
        { text: 'Date', value: 'date', sortable: true },
        { text: 'Project', value: 'project', sortable: true },
        { text: 'Hours', value: 'hours', sortable: true },
        { text: 'Description', value: 'description', sortable: true },
        { text: 'Status', value: 'status', sortable: true },
        { text: 'Actions', value: 'actions', sortable: false, align: 'center' }
      ],
      
      timeEntries: [],
      projects: [],
      
      editedIndex: -1,
      editedItem: {
        id: '',
        date: new Date().toISOString().substr(0, 10),
        projectId: '',
        hours: 8,
        description: '',
        status: 'Draft',
        userId: ''
      },
      defaultItem: {
        id: '',
        date: new Date().toISOString().substr(0, 10),
        projectId: '',
        hours: 8,
        description: '',
        status: 'Draft',
        userId: ''
      },
      
      statusOptions: ['Draft', 'Submitted', 'Approved', 'Rejected']
    };
  },
  
  computed: {
    ...mapGetters(['currentUser']),
    
    formTitle() {
      return this.editedIndex === -1 ? 'New Time Entry' : 'Edit Time Entry';
    },
    
    // Filter time entries based on the selected week
    filteredTimeEntries() {
      if (!this.dateFilter) return this.timeEntries;
      
      const startOfWeek = moment(this.dateFilter).startOf('week');
      const endOfWeek = moment(this.dateFilter).endOf('week');
      
      return this.timeEntries.filter(entry => {
        const entryDate = moment(entry.date);
        return entryDate.isSameOrAfter(startOfWeek) && 
               entryDate.isSameOrBefore(endOfWeek);
      });
    },
    
    // Calculate total hours for the filtered entries
    totalHours() {
      return this.filteredTimeEntries.reduce((total, entry) => {
        return total + (parseFloat(entry.hours) || 0);
      }, 0).toFixed(2);
    },
    
    // Get projects the user is assigned to
    availableProjects() {
      // In a real app, this would filter projects based on user assignments
      return this.projects;
    },
    
    // Check if the timesheet can be submitted
    canSubmitTimesheet() {
      return this.filteredTimeEntries.length > 0 &&
             !this.filteredTimeEntries.some(entry => entry.status === 'Submitted' || 
                                                    entry.status === 'Approved');
    },
    
    // Calculate weekly summary by project
    weekSummary() {
      const summary = {};
      
      this.filteredTimeEntries.forEach(entry => {
        if (!summary[entry.projectId]) {
          summary[entry.projectId] = {
            projectId: entry.projectId,
            hours: {
              mon: 0,
              tue: 0,
              wed: 0,
              thu: 0,
              fri: 0,
              sat: 0,
              sun: 0
            },
            total: 0
          };
        }
        
        const day = moment(entry.date).format('ddd').toLowerCase();
        summary[entry.projectId].hours[day] += parseFloat(entry.hours) || 0;
        summary[entry.projectId].total += parseFloat(entry.hours) || 0;
      });
      
      return Object.values(summary).map(project => {
        // Format the hours to show 2 decimal places only when needed
        Object.keys(project.hours).forEach(day => {
          if (project.hours[day]) {
            project.hours[day] = project.hours[day].toFixed(2);
            if (project.hours[day].endsWith('.00')) {
              project.hours[day] = parseInt(project.hours[day]);
            }
          }
        });
        
        project.total = project.total.toFixed(2);
        if (project.total.endsWith('.00')) {
          project.total = parseInt(project.total);
        }
        
        return project;
      });
    },
    
    // Calculate daily totals
    dailyTotals() {
      const totals = {
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
        sat: 0,
        sun: 0
      };
      
      this.filteredTimeEntries.forEach(entry => {
        const day = moment(entry.date).format('ddd').toLowerCase();
        totals[day] += parseFloat(entry.hours) || 0;
      });
      
      // Format the hours
      Object.keys(totals).forEach(day => {
        totals[day] = totals[day].toFixed(2);
        if (totals[day].endsWith('.00')) {
          totals[day] = parseInt(totals[day]);
        }
      });
      
      return totals;
    },
    
    // Calculate weekly total
    weeklyTotal() {
      const total = Object.values(this.dailyTotals).reduce((sum, hours) => {
        return sum + parseFloat(hours) || 0;
      }, 0);
      
      return total.toFixed(2);
    }
  },
  
  watch: {
    timeEntryDialog(val) {
      val || this.closeDialog();
    },
    dialogDelete(val) {
      val || this.closeDeleteDialog();
    },
    dateFilter() {
      this.fetchTimeEntries();
    }
  },
  
  created() {
    this.initialize();
  },
  
  methods: {
    initialize() {
      this.fetchProjects();
      this.fetchTimeEntries();
    },
    
    // Get current week's start date
    getCurrentWeekStart() {
      return moment().startOf('week').format('YYYY-MM-DD');
    },
    
    // Format date for display
    formatDate(dateString) {
      return moment(dateString).format('ddd, MMM D, YYYY');
    },
    
    // Get project name by ID
    getProjectName(projectId) {
      const project = this.projects.find(p => p.id === projectId);
      return project ? project.name : 'Unknown Project';
    },
    
    // Get status color
    getStatusColor(status) {
      switch (status) {
        case 'Draft': return 'grey';
        case 'Submitted': return 'blue';
        case 'Approved': return 'green';
        case 'Rejected': return 'red';
        default: return 'grey';
      }
    },
    
    // Check if user can edit time entry
    canEditTimeEntry(item) {
      // Only draft entries can be edited
      return item.status === 'Draft' || item.status === 'Rejected';
    },
    
    // Check if user can delete time entry
    canDeleteTimeEntry(item) {
      // Only draft entries can be deleted
      return item.status === 'Draft' || item.status === 'Rejected';
    },
    
    // Fetch projects from API
    fetchProjects() {
      this.loading = true;
      
      // In a real app, this would come from an API
      setTimeout(() => {
        this.projects = [
          { id: '1', name: 'Website Redesign', clientId: '1', status: 'Active' },
          { id: '2', name: 'Mobile App Development', clientId: '2', status: 'Active' },
          { id: '3', name: 'Brand Strategy', clientId: '3', status: 'Completed' },
          { id: '4', name: 'Data Migration', clientId: '1', status: 'On Hold' },
          { id: '5', name: 'E-commerce Integration', clientId: '2', status: 'Active' }
        ];
        this.loading = false;
      }, 500);
      
      // Real implementation:
      /*
      axios.get('/api/projects')
        .then(response => {
          this.projects = response.data;
        })
        .catch(error => {
          console.error('Error fetching projects:', error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Error loading projects. Please try again.',
            color: 'error'
          });
        })
        .finally(() => {
          this.loading = false;
        });
      */
    },
    
    // Fetch time entries from API
    fetchTimeEntries() {
      this.loading = true;
      
      // In a real app, this would come from an API with the correct date filter
      setTimeout(() => {
        // Mock data
        this.timeEntries = [
          {
            id: '1',
            date: moment().day(1).format('YYYY-MM-DD'), // Monday
            projectId: '1',
            hours: 8,
            description: 'Working on homepage design',
            status: 'Draft',
            userId: '1'
          },
          {
            id: '2',
            date: moment().day(2).format('YYYY-MM-DD'), // Tuesday
            projectId: '1',
            hours: 4,
            description: 'Finalizing homepage design and starting on about page',
            status: 'Draft',
            userId: '1'
          },
          {
            id: '3',
            date: moment().day(2).format('YYYY-MM-DD'), // Tuesday
            projectId: '2',
            hours: 4,
            description: 'App wireframing session with client',
            status: 'Draft',
            userId: '1'
          },
          {
            id: '4',
            date: moment().day(3).format('YYYY-MM-DD'), // Wednesday
            projectId: '2',
            hours: 8,
            description: 'Working on app navigation prototypes',
            status: 'Draft',
            userId: '1'
          }
        ];
        this.loading = false;
      }, 500);
      
      // Real implementation:
      /*
      const startDate = moment(this.dateFilter).startOf('week').format('YYYY-MM-DD');
      const endDate = moment(this.dateFilter).endOf('week').format('YYYY-MM-DD');
      
      axios.get(`/api/timeentries?startDate=${startDate}&endDate=${endDate}`)
        .then(response => {
          this.timeEntries = response.data;
        })
        .catch(error => {
          console.error('Error fetching time entries:', error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Error loading time entries. Please try again.',
            color: 'error'
          });
        })
        .finally(() => {
          this.loading = false;
        });
      */
    },
    
    // Open new time entry dialog
    openNewTimeEntryDialog() {
      this.editedIndex = -1;
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedItem.date = new Date().toISOString().substr(0, 10);
      this.timeEntryDialog = true;
    },
    
    // Edit time entry
    editTimeEntry(item) {
      this.editedIndex = this.timeEntries.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.timeEntryDialog = true;
    },
    
    // Delete time entry confirmation
    deleteTimeEntry(item) {
      this.editedIndex = this.timeEntries.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialogDelete = true;
    },
    
    // Confirm deletion of time entry
    deleteTimeEntryConfirm() {
      this.timeEntries.splice(this.editedIndex, 1);
      this.closeDeleteDialog();
      
      // In a real app:
      /*
      axios.delete(`/api/timeentries/${this.editedItem.id}`)
        .then(() => {
          this.timeEntries.splice(this.editedIndex, 1);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Time entry deleted successfully',
            color: 'success'
          });
        })
        .catch(error => {
          console.error('Error deleting time entry:', error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Error deleting time entry. Please try again.',
            color: 'error'
          });
        })
        .finally(() => {
          this.closeDeleteDialog();
        });
      */
    },
    
    // Close delete dialog
    closeDeleteDialog() {
      this.dialogDelete = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    
    // Close edit dialog
    closeDialog() {
      this.timeEntryDialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        if (this.$refs.form) {
          this.$refs.form.resetValidation();
        }
      });
    },
    
    // Save time entry
    saveTimeEntry() {
      if (!this.$refs.form.validate()) return;
      
      if (this.editedIndex > -1) {
        // Update existing entry
        Object.assign(this.timeEntries[this.editedIndex], this.editedItem);
      } else {
        // Create new entry
        const newEntry = Object.assign({}, this.editedItem);
        
        // Generate a simple ID (in a real app, this would come from the backend)
        newEntry.id = Math.random().toString(36).substring(2, 9);
        
        // Set user ID from current user
        newEntry.userId = this.currentUser ? this.currentUser.id : '1';
        
        this.timeEntries.push(newEntry);
      }
      
      this.closeDialog();
      
      // In a real app:
      /*
      const isNew = this.editedIndex === -1;
      const data = {
        date: this.editedItem.date,
        projectId: this.editedItem.projectId,
        hours: parseFloat(this.editedItem.hours),
        description: this.editedItem.description,
        status: this.editedItem.status
      };
      
      const request = isNew
        ? axios.post('/api/timeentries', data)
        : axios.put(`/api/timeentries/${this.editedItem.id}`, data);
        
      request
        .then(response => {
          if (isNew) {
            this.timeEntries.push(response.data);
          } else {
            Object.assign(this.timeEntries[this.editedIndex], response.data);
          }
          
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: `Time entry ${isNew ? 'created' : 'updated'} successfully`,
            color: 'success'
          });
          this.closeDialog();
        })
        .catch(error => {
          console.error(`Error ${isNew ? 'creating' : 'updating'} time entry:`, error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: `Error ${isNew ? 'creating' : 'updating'} time entry. Please try again.`,
            color: 'error'
          });
        });
      */
    },
    
    // Submit timesheet
    submitTimesheet() {
      // Update all draft entries to submitted
      this.filteredTimeEntries.forEach(entry => {
        if (entry.status === 'Draft') {
          entry.status = 'Submitted';
        }
      });
      
      this.dialogSubmit = false;
      
      // In a real app:
      /*
      const startDate = moment(this.dateFilter).startOf('week').format('YYYY-MM-DD');
      const endDate = moment(this.dateFilter).endOf('week').format('YYYY-MM-DD');
      
      axios.post('/api/timeentries/submit', {
        startDate,
        endDate,
        userId: this.currentUser.id
      })
        .then(response => {
          // Update local entries to reflect the submitted status
          this.fetchTimeEntries();
          
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Timesheet submitted successfully',
            color: 'success'
          });
        })
        .catch(error => {
          console.error('Error submitting timesheet:', error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Error submitting timesheet. Please try again.',
            color: 'error'
          });
        })
        .finally(() => {
          this.dialogSubmit = false;
        });
      */
    }
  }
};
</script>

<style scoped>
.timesheet-container {
  padding: 20px;
}

.headline {
  font-weight: 500;
}

.v-chip {
  font-size: 0.8em;
}

.v-data-table tr {
  cursor: pointer;
}

.summary-total {
  font-weight: bold;
  background-color: #f5f5f5;
}

.v-data-table >>> tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.weekly-summary {
  margin-top: 20px;
}

.weekly-total {
  font-size: 1.2em;
  font-weight: bold;
}
</style>
