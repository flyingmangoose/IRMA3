<template>
  <div class="timesheet-container">
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 font-weight-regular">Timesheet</h1>
      <v-spacer></v-spacer>
      <div class="date-range d-flex align-center mr-4">
        {{ dateRangeText }}
        <v-icon class="ml-2">mdi-calendar</v-icon>
      </div>
      <v-btn
        color="primary"
        @click="projectSelectionDialog = true"
        class="text-none"
      >
        Add Project
        <v-icon right>mdi-plus</v-icon>
      </v-btn>
    </div>

    <div class="mb-4">
      <v-chip
        color="success"
        outlined
        class="mr-2"
        v-if="saved"
      >
        Saved
      </v-chip>
      <v-chip
        :color="getStatusColor(timesheetStatus)"
        class="mr-2"
      >
        Status: {{ timesheetStatus }}
      </v-chip>
    </div>

    <v-alert
      type="info"
      text
      outlined
      class="mb-4"
    >
      <p><strong>Instructions:</strong></p>
      <ul>
        <li>Click "Add Project" to add projects to your timesheet</li>
        <li>Enter hours for each day (in 0.25 increments)</li>
        <li>Add a comment for each time entry</li>
        <li>Click "Submit" when your timesheet is complete</li>
      </ul>
    </v-alert>

    <v-card class="elevation-1 mb-4">
      <v-simple-table class="timesheet-table">
        <template #default>
          <thead>
            <tr>
              <th class="text-left">Project</th>
              <th 
                v-for="day in daysInPeriod" 
                :key="day.date"
                class="text-center"
                :class="{ 'weekend-column': day.isWeekend }"
              >
                {{ day.formatted }}
              </th>
              <th class="text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in timesheetProjects" :key="project.id">
              <td>{{ project.name }}</td>
              <td 
                v-for="day in daysInPeriod" 
                :key="`${project.id}-${day.date}`"
                :class="{ 'weekend-column': day.isWeekend }"
              >
                <div class="hour-cell" v-if="!day.isWeekend">
                  <v-text-field
                    v-model="timeEntries[project.id][day.date].hours"
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    hide-details
                    single-line
                    class="hour-input"
                  ></v-text-field>
                  <v-btn
                    x-small
                    icon
                    color="primary"
                    @click="openCommentDialog(project.id, day.date)"
                    title="Add comment"
                    class="comment-btn"
                  >
                    <v-icon x-small>{{ timeEntries[project.id][day.date].comment ? 'mdi-comment-check' : 'mdi-comment-plus' }}</v-icon>
                  </v-btn>
                </div>
                <div v-else class="weekend-cell">
                  <!-- Weekend cell -->
                </div>
              </td>
              <td class="text-center font-weight-bold">
                {{ calculateProjectTotal(project.id).toFixed(2) }}
              </td>
            </tr>
            
            <tr v-if="timesheetProjects.length === 0">
              <td colspan="100%" class="text-center pa-4">
                <p>No projects added to this timesheet yet.</p>
                <v-btn 
                  color="primary" 
                  @click="projectSelectionDialog = true"
                  class="mt-2"
                >
                  <v-icon left>mdi-plus</v-icon>
                  Add Your First Project
                </v-btn>
              </td>
            </tr>
            
            <tr class="daily-total-row" v-if="timesheetProjects.length > 0">
              <td class="font-weight-bold">Daily Total</td>
              <td 
                v-for="day in daysInPeriod" 
                :key="day.date" 
                class="text-center"
                :class="{ 'weekend-column': day.isWeekend }"
              >
                {{ calculateDailyTotal(day.date).toFixed(2) }}
              </td>
              <td class="font-weight-bold text-center">
                {{ calculateTotalHours().toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-card>

    <div class="d-flex justify-space-between mb-4">
      <v-btn 
        color="primary" 
        outlined
        @click="projectSelectionDialog = true"
      >
        <v-icon left>mdi-plus</v-icon>
        Add Another Project
      </v-btn>
      
      <div>
        <v-btn 
          color="success" 
          @click="validateAndSaveAll"
          class="mr-2"
        >
          <v-icon left>mdi-content-save</v-icon>
          Save Timesheet
        </v-btn>
        
        <v-btn 
          color="primary" 
          :disabled="!canSubmitTimesheet" 
          @click="showSubmitDialog"
        >
          <v-icon left>mdi-send</v-icon>
          {{ submissionAction }}
        </v-btn>
      </div>
    </div>

    <v-dialog v-model="projectSelectionDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Add Project to Timesheet</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row v-if="availableProjects.length > 0">
              <v-col cols="12">
                <v-radio-group v-model="selectedProjectId">
                  <v-radio
                    v-for="project in availableProjects"
                    :key="project.id"
                    :label="project.name"
                    :value="project.id"
                  ></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
            <v-row v-else>
              <v-col cols="12">
                <p class="text-center">No available projects to add. Please contact your administrator.</p>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="projectSelectionDialog = false">
            Cancel
          </v-btn>
          <v-btn 
            color="primary"
            @click="addSelectedProject"
            :disabled="!selectedProjectId || availableProjects.length === 0"
          >
            Add Project
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="commentDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Time Entry Details</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="currentEntry.hours"
                  label="Hours"
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="currentEntry.comment"
                  label="Comment"
                  placeholder="What did you work on? (Required)"
                  required
                  auto-grow
                  rows="3"
                  counter="500"
                ></v-textarea>
              </v-col>
            </v-row>
            <v-alert
              v-if="commentError"
              type="error"
              outlined
              dense
              class="mt-2"
            >
              {{ commentError }}
            </v-alert>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="commentDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="saveComment">
            Save Entry
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="submitDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Submit Timesheet</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <p>You are about to submit your timesheet for approval.</p>
            <p>Total Hours: <strong>{{ calculateTotalHours().toFixed(2) }}</strong></p>
            <p class="mt-4">Please review your entries before submitting. Once submitted, you won't be able to make changes until it's approved or rejected.</p>
            
            <v-alert
              v-if="submitError"
              type="error"
              outlined
              dense
              class="mt-2"
            >
              {{ submitError }}
            </v-alert>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="submitDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="submitTimesheet">
            Submit for Approval
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="approvalDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Approve Timesheet</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <p>You are approving this timesheet.</p>
            <p>Employee: <strong>{{ timesheetOwner }}</strong></p>
            <p>Period: <strong>{{ dateRangeText }}</strong></p>
            <p>Total Hours: <strong>{{ calculateTotalHours().toFixed(2) }}</strong></p>
            
            <v-textarea
              v-model="approvalComment"
              label="Comments (Optional)"
              placeholder="Add any comments about this approval"
              auto-grow
              rows="3"
              counter="500"
              class="mt-4"
            ></v-textarea>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="approvalDialog = false">
            Cancel
          </v-btn>
          <v-btn color="success" @click="approveTimesheet">
            Approve Timesheet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="rejectionDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Reject Timesheet</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <p>You are rejecting this timesheet.</p>
            <p>Employee: <strong>{{ timesheetOwner }}</strong></p>
            <p>Period: <strong>{{ dateRangeText }}</strong></p>
            
            <v-textarea
              v-model="rejectionComment"
              label="Reason for Rejection"
              placeholder="Please provide a reason for rejecting this timesheet"
              auto-grow
              rows="3"
              counter="500"
              class="mt-4"
              :rules="[v => !!v || 'A reason for rejection is required']"
            ></v-textarea>
            
            <v-alert
              v-if="rejectionError"
              type="error"
              outlined
              dense
              class="mt-2"
            >
              {{ rejectionError }}
            </v-alert>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="rejectionDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" @click="rejectTimesheet">
            Reject Timesheet
          </v-btn>
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
// eslint-disable-next-line no-unused-vars
import axios from 'axios';
import { mapGetters } from 'vuex';
import moment from 'moment';

export default {
  name: 'TimesheetsPage',
  
  data() {
    return {
      saved: true,
      loading: false,
      startDate: moment().startOf('week').format('YYYY-MM-DD'),
      endDate: moment().add(13, 'days').format('YYYY-MM-DD'), // Two-week period
      
      projects: [], // All available projects
      timesheetProjects: [], // Projects added to timesheet
      
      // Store time entries in format: { projectId: { 'YYYY-MM-DD': { hours: number, comment: string } } }
      timeEntries: {},
      
      // Track dirty state for saving
      isDirty: false,
      
      // Timesheet status and approval workflow
      timesheetStatus: 'Draft', // Draft, Submitted, Approved, Rejected
      timesheetOwnerId: null,
      timesheetOwner: 'Current User', // Will be populated with user name
      approver: null,
      
      // Notification
      snackbar: {
        show: false,
        text: '',
        color: 'success'
      },
      
      // Comment dialog
      commentDialog: false,
      commentError: '',
      currentEntry: {
        projectId: null,
        date: null,
        hours: 0,
        comment: ''
      },
      
      // Submit dialog
      submitDialog: false,
      submitError: '',
      
      // Approval dialog
      approvalDialog: false,
      approvalComment: '',
      
      // Rejection dialog
      rejectionDialog: false,
      rejectionComment: '',
      rejectionError: '',
      
      // User roles and hierarchy for approvals
      userHierarchy: {
        'employee': 1,
        'team-lead': 2,
        'project-manager': 3,
        'director': 4,
        'executive': 5
      },
      
      // Add Project Selection Dialog
      projectSelectionDialog: false,
      selectedProjectId: null
    };
  },
  
  computed: {
    ...mapGetters(['currentUser']),
    
    // Format date range for display
    dateRangeText() {
      return `${moment(this.startDate).format('M/D/YYYY')} - ${moment(this.endDate).format('M/D/YYYY')}`;
    },
    
    // Available projects for adding to timesheet
    availableProjects() {
      // Filter out projects already in timesheet
      const timesheetProjectIds = this.timesheetProjects.map(p => p.id);
      return this.projects.filter(p => !timesheetProjectIds.includes(p.id));
    },
    
    // Generate all days in the period
    daysInPeriod() {
      const days = [];
      const current = moment(this.startDate);
      const end = moment(this.endDate);
      let index = 0;
      
      while (current.isSameOrBefore(end)) {
        const date = current.format('YYYY-MM-DD');
        const day = current.format('ddd');
        const dayNumber = current.format('D');
        const month = current.format('MMM');
        const isWeekend = day === 'Sat' || day === 'Sun';
        
        days.push({
          index,
          date,
          day,
          dayNumber,
          month,
          isWeekend,
          formatted: `${day}, ${month} ${dayNumber}`
        });
        
        current.add(1, 'day');
        index++;
      }
      
      return days;
    },
    
    // Determine if user can submit timesheet
    canSubmitTimesheet() {
      // Can submit if:
      // 1. It's their own timesheet
      // 2. Status is Draft or Rejected
      // 3. There are entries with hours > 0
      const hasEntries = this.calculateTotalHours() > 0;
      return (this.timesheetStatus === 'Draft' || this.timesheetStatus === 'Rejected') && hasEntries;
    },
    
    // Determine if user can approve timesheet
    canApproveTimesheet() {
      // Check if user has permission to approve this timesheet
      if (!this.currentUser || !this.currentUser.role) return false;
      
      // If viewing own timesheet, can't approve
      if (this.timesheetOwnerId === this.currentUser.id) return false;
      
      // Check hierarchy level
      const ownerRole = this.getTimesheetOwnerRole();
      const currentUserHierarchy = this.userHierarchy[this.currentUser.role] || 0;
      const ownerHierarchy = this.userHierarchy[ownerRole] || 0;
      
      // For PM (level 3) can approve level 1-2
      // For Director or higher (level 4-5) can approve level 1-3
      // No one can approve same level or higher
      return currentUserHierarchy > ownerHierarchy;
    },
    
    // Text for submission button
    submissionAction() {
      return this.timesheetStatus === 'Rejected' ? 'Resubmit' : 'Submit';
    }
  },
  
  watch: {
    // Save data when changes are detected
    timeEntries: {
      handler() {
        this.isDirty = true;
        this.saved = false;
        this.debouncedSave();
      },
      deep: true
    }
  },
  
  created() {
    this.initialize();
    this.debouncedSave = this.debounce(this.saveTimesheet, 2000);
  },
  
  methods: {
    initialize() {
      this.fetchProjects();
      this.fetchTimeEntries();
      this.initializeUser();
    },
    
    // Fetch available projects
    fetchProjects() {
      this.loading = true;
      
      // Mock data
      setTimeout(() => {
        this.projects = [
          { id: 'alpha', name: 'Project Alpha' },
          { id: 'beta', name: 'Project Beta' },
          { id: 'gamma', name: 'Project Gamma' },
          { id: 'delta', name: 'Project Delta' }
        ];
        
        // Add initial projects to timesheet
        this.timesheetProjects = [
          { id: 'alpha', name: 'Project Alpha' },
          { id: 'beta', name: 'Project Beta' }
        ];
        
        this.loading = false;
      }, 300);
      
      // Real implementation would use axios:
      /*
      axios.get('/api/projects')
        .then(response => {
          this.projects = response.data;
        })
        .catch(error => {
          console.error('Error fetching projects:', error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Error loading projects',
            color: 'error'
          });
        })
        .finally(() => {
          this.loading = false;
        });
      */
    },
    
    // Fetch time entries for the period
    fetchTimeEntries() {
      this.loading = true;
      
      // Initialize empty entries for each project
      this.timesheetProjects.forEach(project => {
        if (!this.timeEntries[project.id]) {
          this.timeEntries[project.id] = {};
        }
      });
      
      // Mock data - one test entry
      setTimeout(() => {
        // Initialize with a mock entry
        if (this.timesheetProjects.length > 0) {
          const testDate = moment(this.startDate).add(3, 'days').format('YYYY-MM-DD');
          if (!this.timeEntries[this.timesheetProjects[0].id]) {
            this.timeEntries[this.timesheetProjects[0].id] = {};
          }
          this.timeEntries[this.timesheetProjects[0].id][testDate] = {
            hours: '8',
            comment: 'Initial project setup and planning meetings'
          };
        }
        
        this.loading = false;
      }, 300);
      
      // Real implementation:
      /*
      axios.get(`/api/timeentries?startDate=${this.startDate}&endDate=${this.endDate}`)
        .then(response => {
          // Format entries into our data structure
          response.data.forEach(entry => {
            if (!this.timeEntries[entry.projectId]) {
              this.timeEntries[entry.projectId] = {};
            }
            this.timeEntries[entry.projectId][entry.date] = {
              hours: entry.hours.toString(),
              comment: entry.comment || ''
            };
          });
        })
        .catch(error => {
          console.error('Error fetching time entries:', error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Error loading time entries',
            color: 'error'
          });
        })
        .finally(() => {
          this.loading = false;
        });
      */
    },
    
    // Setup user information
    initializeUser() {
      // This would normally use data from the store
      this.timesheetOwnerId = this.currentUser ? this.currentUser.id : 1;
      this.timesheetOwner = this.currentUser ? 
        `${this.currentUser.firstName} ${this.currentUser.lastName}` : 
        'John Doe';

      // For demo purposes, let's set a mock role
      if (!this.currentUser) {
        // Mock user role if not available in store
        this.$store.state.user = this.$store.state.user || {};
        this.$store.state.user.role = 'employee'; // Default to employee
      }
    },
    
    // Get timesheet owner's role (in a real app, this would come from API)
    getTimesheetOwnerRole() {
      // In a real app, this would check the owner's role from the API
      // For demo, we'll assume it's 'employee' or get from current user
      return this.currentUser ? this.currentUser.role : 'employee';
    },
    
    // Get color for status chip
    getStatusColor(status) {
      switch (status) {
        case 'Draft': return 'grey';
        case 'Submitted': return 'warning';
        case 'Approved': return 'success';
        case 'Rejected': return 'error';
        default: return 'grey';
      }
    },
    
    // Show submission dialog
    showSubmitDialog() {
      this.submitError = '';
      this.submitDialog = true;
    },
    
    // Submit timesheet for approval
    submitTimesheet() {
      // Validate that all entries have comments
      let missingComments = false;
      
      Object.keys(this.timeEntries).forEach(projectId => {
        Object.keys(this.timeEntries[projectId]).forEach(date => {
          const entry = this.timeEntries[projectId][date];
          if (parseFloat(entry.hours) > 0 && !entry.comment) {
            missingComments = true;
          }
        });
      });
      
      if (missingComments) {
        this.submitError = 'All time entries must have comments. Please complete all entries.';
        return;
      }
      
      // Submit for approval
      this.timesheetStatus = 'Submitted';
      this.submitDialog = false;
      
      // Find an appropriate approver based on hierarchy
      this.determineApprover();
      
      this.showSnackbar('Timesheet submitted for approval', 'success');
      
      // In a real app, this would call the API
      /*
      axios.post(`/api/timesheets/${this.timesheetId}/submit`)
        .then(response => {
          this.timesheetStatus = 'Submitted';
          this.approver = response.data.approver;
          this.submitDialog = false;
          this.showSnackbar('Timesheet submitted for approval', 'success');
        })
        .catch(error => {
          console.error('Error submitting timesheet:', error);
          this.submitError = error.response?.data?.message || 'Error submitting timesheet';
        });
      */
    },
    
    // Determine who should approve this timesheet based on hierarchy
    determineApprover() {
      // Mock implementation - in a real app, this would be handled by the backend
      const ownerRole = this.getTimesheetOwnerRole();
      const ownerHierarchy = this.userHierarchy[ownerRole] || 1;
      
      // Find a user with appropriate hierarchy level to approve
      let approverRole;
      
      if (ownerHierarchy <= 2) { // employee or team lead
        approverRole = 'project-manager';
      } else if (ownerHierarchy === 3) { // project manager
        approverRole = 'director';
      } else {
        approverRole = 'executive';
      }
      
      // In a real app, we would query the API for users with this role
      // For now, just set a mock approver
      this.approver = {
        id: 99,
        name: `Sample ${approverRole.replace('-', ' ')}`,
        role: approverRole
      };
      
      console.log(`Timesheet will be approved by ${this.approver.name} (${this.approver.role})`);
    },
    
    // Show approval dialog
    showApprovalDialog() {
      this.approvalComment = '';
      this.approvalDialog = true;
    },
    
    // Approve timesheet
    approveTimesheet() {
      // Update status
      this.timesheetStatus = 'Approved';
      this.approvalDialog = false;
      this.showSnackbar('Timesheet approved', 'success');
      
      // In a real app, this would call the API
      /*
      axios.post(`/api/timesheets/${this.timesheetId}/approve`, {
        comment: this.approvalComment
      })
        .then(() => {
          this.timesheetStatus = 'Approved';
          this.approvalDialog = false;
          this.showSnackbar('Timesheet approved', 'success');
        })
        .catch(error => {
          console.error('Error approving timesheet:', error);
          this.showSnackbar(
            error.response?.data?.message || 'Error approving timesheet', 
            'error'
          );
        });
      */
    },
    
    // Show rejection dialog
    showRejectionDialog() {
      this.rejectionComment = '';
      this.rejectionError = '';
      this.rejectionDialog = true;
    },
    
    // Reject timesheet
    rejectTimesheet() {
      // Validate rejection reason
      if (!this.rejectionComment.trim()) {
        this.rejectionError = 'Please provide a reason for rejection';
        return;
      }
      
      // Update status
      this.timesheetStatus = 'Rejected';
      this.rejectionDialog = false;
      this.showSnackbar('Timesheet rejected', 'error');
      
      // In a real app, this would call the API
      /*
      axios.post(`/api/timesheets/${this.timesheetId}/reject`, {
        comment: this.rejectionComment
      })
        .then(() => {
          this.timesheetStatus = 'Rejected';
          this.rejectionDialog = false;
          this.showSnackbar('Timesheet rejected', 'error');
        })
        .catch(error => {
          console.error('Error rejecting timesheet:', error);
          this.rejectionError = error.response?.data?.message || 'Error rejecting timesheet';
        });
      */
    },
    
    // Show snackbar notification
    showSnackbar(text, color = 'success') {
      this.snackbar = {
        show: true,
        text,
        color
      };
    },
    
    // Add a project to the timesheet
    addProjectToTimesheet(project) {
      this.timesheetProjects.push(project);
      
      // Initialize entries object for this project
      if (!this.timeEntries[project.id]) {
        this.timeEntries[project.id] = {};
      }
      
      // Initialize all days for this project
      this.daysInPeriod.forEach(day => {
        if (!this.timeEntries[project.id][day.date]) {
          this.timeEntries[project.id][day.date] = { hours: '', comment: '' };
        }
      });
      
      this.isDirty = true;
      this.saved = false;
      
      // Show feedback to user
      this.showSnackbar(`Added ${project.name} to timesheet`, 'success');
      
      // Reset selected project
      this.selectedProjectId = null;
    },
    
    // Calculate total hours for a project
    calculateProjectTotal(projectId) {
      if (!this.timeEntries[projectId]) return 0;
      
      return Object.values(this.timeEntries[projectId])
        .reduce((total, entry) => {
          return total + (parseFloat(entry.hours) || 0);
        }, 0);
    },
    
    // Calculate total hours for a day across all projects
    calculateDailyTotal(date) {
      let total = 0;
      
      Object.keys(this.timeEntries).forEach(projectId => {
        if (this.timeEntries[projectId][date]) {
          total += parseFloat(this.timeEntries[projectId][date].hours || 0);
        }
      });
      
      return total;
    },
    
    // Calculate total hours for the entire timesheet
    calculateTotalHours() {
      let total = 0;
      
      Object.keys(this.timeEntries).forEach(projectId => {
        total += this.calculateProjectTotal(projectId);
      });
      
      return total;
    },
    
    // Open comment dialog
    openCommentDialog(projectId, date) {
      // Initialize entry if it doesn't exist
      if (!this.timeEntries[projectId][date]) {
        this.timeEntries[projectId][date] = { hours: '0', comment: '' };
      }
      
      this.currentEntry = {
        projectId,
        date,
        hours: this.timeEntries[projectId][date].hours,
        comment: this.timeEntries[projectId][date].comment || ''
      };
      
      this.commentError = '';
      this.commentDialog = true;
    },
    
    // Save comment
    saveComment() {
      // Validate input
      if (!this.currentEntry.hours || parseFloat(this.currentEntry.hours) <= 0) {
        this.commentError = 'Hours must be greater than 0';
        return;
      }
      
      if (!this.currentEntry.comment.trim()) {
        this.commentError = 'Comment is required';
        return;
      }
      
      // Update the entry
      const { projectId, date, hours, comment } = this.currentEntry;
      
      // Ensure the time entry structure exists
      if (!this.timeEntries[projectId]) {
        this.timeEntries[projectId] = {};
      }
      if (!this.timeEntries[projectId][date]) {
        this.timeEntries[projectId][date] = { hours: '0', comment: '' };
      }
      
      // Update the entry
      this.timeEntries[projectId][date] = {
        hours: parseFloat(hours) > 24 ? '24' : hours,
        comment: comment.trim()
      };
      
      this.commentDialog = false;
      this.isDirty = true;
      this.saved = false;
    },
    
    // Validate and save an entry
    validateAndSave(projectId, date) {
      try {
        // Ensure the entry exists
        if (!this.timeEntries[projectId]) {
          this.timeEntries[projectId] = {};
        }
        
        if (!this.timeEntries[projectId][date]) {
          this.timeEntries[projectId][date] = { hours: '', comment: '' };
        }
        
        const hours = this.timeEntries[projectId][date].hours;
        
        // If the field is empty, just leave it empty (don't convert to 0)
        if (hours === '') {
          return;
        }
        
        // Basic validation
        const numericHours = parseFloat(hours);
        if (isNaN(numericHours) || numericHours < 0) {
          // Invalid entry - reset to empty
          this.timeEntries[projectId][date].hours = '';
          this.showSnackbar('Invalid time entry. Please enter a positive number.', 'error');
          return;
        } else if (numericHours > 24) {
          // Cap at 24 hours
          this.timeEntries[projectId][date].hours = '24';
          this.showSnackbar('Maximum daily hours is 24. Value has been adjusted.', 'warning');
        } else {
          // Format to fixed decimal (0.25 increments)
          const roundedHours = Math.round(numericHours * 4) / 4;
          this.timeEntries[projectId][date].hours = roundedHours.toString();
        }
        
        // If hours are greater than 0, prompt for a comment if none exists
        if (numericHours > 0 && !this.timeEntries[projectId][date].comment) {
          this.openCommentDialog(projectId, date);
        }
        
        // Mark as need saving
        this.isDirty = true;
        this.saved = false;
      } catch (error) {
        console.error('Error in validateAndSave:', error);
        this.showSnackbar('An error occurred while saving your time entry.', 'error');
      }
    },
    
    // Track focus for better user experience
    onFocus() {
      // Could implement focus tracking here
    },
    
    // Save timesheet to API
    saveTimesheet() {
      if (!this.isDirty) return;
      
      // Can't edit if already submitted and not rejected
      if (this.timesheetStatus === 'Submitted' || this.timesheetStatus === 'Approved') {
        this.showSnackbar('Cannot edit a submitted or approved timesheet', 'error');
        return;
      }
      
      // Check if all entries have comments
      let missingComments = false;
      
      Object.keys(this.timeEntries).forEach(projectId => {
        Object.keys(this.timeEntries[projectId]).forEach(date => {
          const entry = this.timeEntries[projectId][date];
          if (parseFloat(entry.hours) > 0 && !entry.comment) {
            missingComments = true;
          }
        });
      });
      
      if (missingComments) {
        this.showSnackbar('All time entries must have comments. Please complete all entries.', 'error');
        return;
      }
      
      // Prepare data for API
      const entries = [];
      
      Object.keys(this.timeEntries).forEach(projectId => {
        Object.keys(this.timeEntries[projectId]).forEach(date => {
          const entry = this.timeEntries[projectId][date];
          const hours = parseFloat(entry.hours);
          if (hours > 0) {
            entries.push({
              projectId,
              date,
              hours,
              comment: entry.comment
            });
          }
        });
      });
      
      // Mock save
      setTimeout(() => {
        this.isDirty = false;
        this.saved = true;
        console.log('Timesheet saved', entries);
      }, 500);
      
      // Real implementation:
      /*
      axios.post('/api/timeentries/batch', { entries })
        .then(() => {
          this.isDirty = false;
          this.saved = true;
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Timesheet saved',
            color: 'success'
          });
        })
        .catch(error => {
          console.error('Error saving timesheet:', error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Error saving timesheet',
            color: 'error'
          });
        });
      */
    },
    
    // Debounce function to limit API calls
    debounce(fn, delay) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    },
    
    // Add selected project from project selection dialog
    addSelectedProject() {
      if (!this.selectedProjectId || this.availableProjects.length === 0) return;
      
      const selectedProject = this.availableProjects.find(p => p.id === this.selectedProjectId);
      if (selectedProject) {
        this.addProjectToTimesheet(selectedProject);
      }
      
      this.projectSelectionDialog = false;
    },
    
    // Add method to validate and save all entries at once
    validateAndSaveAll() {
      let hasErrors = false;
      let missingComments = false;
      
      // Check all entries
      Object.keys(this.timeEntries).forEach(projectId => {
        Object.keys(this.timeEntries[projectId]).forEach(date => {
          const entry = this.timeEntries[projectId][date];
          
          // Skip empty entries
          if (!entry.hours || entry.hours === '') return;
          
          const numericHours = parseFloat(entry.hours);
          
          // Validate hours
          if (isNaN(numericHours) || numericHours < 0) {
            hasErrors = true;
            return;
          }
          
          // Round to nearest 0.25
          const roundedHours = Math.round(numericHours * 4) / 4;
          this.timeEntries[projectId][date].hours = roundedHours.toString();
          
          // Check for comments
          if (numericHours > 0 && !entry.comment) {
            missingComments = true;
          }
        });
      });
      
      if (hasErrors) {
        this.showSnackbar('Some entries have invalid hours. Please check your timesheet.', 'error');
        return;
      }
      
      if (missingComments) {
        this.showSnackbar('Some entries are missing comments. Please add comments to all entries.', 'warning');
      } else {
        // Save timesheet
        this.saveTimesheet();
        this.showSnackbar('Timesheet saved successfully', 'success');
      }
    }
  }
};
</script>

<style scoped>
.timesheet-container {
  padding: 20px;
}

.timesheet-table >>> .hour-cell {
  padding: 0 2px;
  position: relative;
  display: flex;
  align-items: center;
}

.timesheet-table >>> .hour-input {
  text-align: center;
  width: calc(100% - 24px);
}

.timesheet-table >>> .v-text-field input {
  text-align: center;
}

.timesheet-table >>> .weekend-cell {
  height: 32px;
  background-color: #f5f5f5;
}

.timesheet-table >>> .weekend-column {
  background-color: #f5f5f5;
}

.timesheet-table >>> .daily-total-row {
  background-color: #f5f5f5;
}

.timesheet-table >>> tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.comment-btn {
  margin-left: 4px;
  min-width: auto !important;
}
</style>
