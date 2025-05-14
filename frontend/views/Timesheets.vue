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

    <!-- Testing Approval Panel -->
    <v-expansion-panels class="mb-4">
      <v-expansion-panel>
        <v-expansion-panel-header>
          <div class="d-flex align-center">
            <v-icon left color="primary">mdi-test-tube</v-icon>
            Approval Workflow Testing
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-card flat>
            <v-card-text>
              <p class="mb-2">Use this panel to test the timesheet approval workflow.</p>
              
              <v-row>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="testUserRole"
                    :items="userRoles"
                    label="Switch User Role"
                    @change="updateUserRole"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" md="8">
                  <v-btn-toggle v-model="timesheetStatus" mandatory class="mb-2">
                    <v-btn value="Draft" small>Draft</v-btn>
                    <v-btn value="Submitted" small>Submitted</v-btn>
                    <v-btn value="Approved" small>Approved</v-btn>
                    <v-btn value="Rejected" small>Rejected</v-btn>
                  </v-btn-toggle>
                  
                  <div class="d-flex mt-2">
                    <v-btn 
                      color="success" 
                      small 
                      :disabled="!canApproveTimesheet || timesheetStatus !== 'Submitted'"
                      @click="showApprovalDialog"
                      class="mr-2"
                    >
                      <v-icon left small>mdi-check</v-icon>
                      Approve
                    </v-btn>
                    
                    <v-btn 
                      color="error" 
                      small 
                      :disabled="!canApproveTimesheet || timesheetStatus !== 'Submitted'"
                      @click="showRejectionDialog"
                      class="mr-2"
                    >
                      <v-icon left small>mdi-close</v-icon>
                      Reject
                    </v-btn>
                    
                    <v-btn 
                      color="warning" 
                      small 
                      v-if="timesheetStatus === 'Approved'"
                      @click="reopenTimesheet"
                    >
                      <v-icon left small>mdi-undo</v-icon>
                      Reopen
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
              
              <v-alert
                v-if="timesheetStatus === 'Rejected'" 
                type="error" 
                outlined 
                dense
                class="mt-4"
              >
                <strong>Rejection Reason:</strong> {{ rejectionReason || "The timesheet was rejected due to missing information." }}
              </v-alert>
            </v-card-text>
          </v-card>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

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
              <td>
                <div class="d-flex align-center">
                  <v-icon
                    v-if="project.isTimeOff"
                    small
                    color="blue"
                    class="mr-1"
                  >
                    mdi-beach
                  </v-icon>
                  {{ project.name }}
                  <v-btn
                    v-if="timesheetStatus === 'Draft'"
                    icon
                    x-small
                    class="ml-1"
                    title="Remove project"
                    @click.stop="confirmRemoveProject(project)"
                  >
                    <v-icon x-small color="grey">mdi-close</v-icon>
                  </v-btn>
                </div>
              </td>
              <td 
                v-for="day in daysInPeriod" 
                :key="`${project.id}-${day.date}`"
                :class="{ 'weekend-column': day.isWeekend }"
              >
                <div class="hour-cell" :class="{ 'time-off-cell': project.isTimeOff }">
                  <v-text-field
                    v-model="timeEntries[project.id][day.date].hours"
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    hide-details
                    single-line
                    class="hour-input"
                    :disabled="timesheetStatus === 'Approved' || timesheetStatus === 'Submitted'"
                    @blur="validateHours(project.id, day.date)"
                    @input="calculateTotals"
                  >
                    <template v-slot:append>
                      <div class="hour-controls">
                        <v-btn
                          x-small
                          icon
                          @click="incrementHours(project.id, day.date, -0.25)"
                          :disabled="timesheetStatus === 'Approved' || timesheetStatus === 'Submitted'"
                        >
                          <v-icon x-small>mdi-minus</v-icon>
                        </v-btn>
                        <v-btn
                          x-small
                          icon
                          @click="incrementHours(project.id, day.date, 0.25)"
                          :disabled="timesheetStatus === 'Approved' || timesheetStatus === 'Submitted'"
                        >
                          <v-icon x-small>mdi-plus</v-icon>
                        </v-btn>
                      </div>
                    </template>
                  </v-text-field>
                  <v-btn
                    x-small
                    icon
                    color="primary"
                    @click="openCommentDialog(project.id, day.date)"
                    title="Add comment"
                    class="comment-btn"
                    :disabled="timesheetStatus === 'Approved'"
                  >
                    <v-icon x-small>{{ timeEntries[project.id][day.date].comment ? 'mdi-comment-check' : 'mdi-comment-plus' }}</v-icon>
                  </v-btn>
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

    <!-- Add a debug section that shows calculated total hours -->
    <div class="debug-info mb-4" v-if="timesheetProjects.length > 0">
      <v-alert
        type="info"
        text
        outlined
      >
        <p><strong>Timesheet Information:</strong></p>
        <p>Total Hours: {{ calculateTotalHours().toFixed(2) }}</p>
        <p>Projects: {{ timesheetProjects.length }}</p>
        <p>Can Submit: {{ canSubmitTimesheet ? 'Yes' : 'No' }}</p>
      </v-alert>
    </div>

    <!-- Action buttons -->
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
          @click="showSubmitDialog"
        >
          <v-icon left>mdi-send</v-icon>
          Submit Timesheet
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
            <v-subheader>Time Off Categories</v-subheader>
            <v-row>
              <v-col cols="12">
                <v-radio-group v-model="selectedProjectId">
                  <v-radio
                    v-for="timeOffType in timeOffTypes"
                    :key="timeOffType.id"
                    :label="timeOffType.name"
                    :value="timeOffType.id"
                  ></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
            
            <v-divider class="my-3"></v-divider>
            <v-subheader>Projects</v-subheader>
            
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
            <v-row>
              <v-col cols="12">
                <p>Please provide a reason for rejecting this timesheet.</p>
                <v-textarea
                  v-model="rejectionReason"
                  outlined
                  rows="3"
                  placeholder="Provide feedback to help the user correct their timesheet"
                  required
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="rejectionDialog = false">
            Cancel
          </v-btn>
          <v-btn 
            color="error" 
            @click="rejectTimesheet"
            :disabled="!rejectionReason"
          >
            Reject Timesheet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove Project Confirmation Dialog -->
    <v-dialog v-model="removeProjectDialog" max-width="400px">
      <v-card>
        <v-card-title>
          <span class="headline">Remove Project</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <p>Are you sure you want to remove <strong>{{ projectToRemove ? projectToRemove.name : '' }}</strong> from this timesheet?</p>
            <p v-if="hasEntriesForProject">This will also remove all time entries for this project.</p>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="removeProjectDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" text @click="removeProject">
            Remove Project
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
import { projectService, timesheetService } from '../src/services';

export default {
  name: 'TimesheetsPage',
  
  data() {
    return {
      saved: true,
      loading: false,
      startDate: moment().startOf('week').format('YYYY-MM-DD'),
      endDate: moment().add(13, 'days').format('YYYY-MM-DD'), // Two-week period
      
      // Timesheet data
      timesheetId: null,
      timesheetData: null,
      
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
      rejectionReason: '',
      
      // User roles and hierarchy for approvals
      userHierarchy: {
        'employee': 1,
        'lead': 2,
        'manager': 3,
        'director': 4,
        'admin': 5
      },
      
      // Add Project Selection Dialog
      projectSelectionDialog: false,
      selectedProjectId: null,
      
      // Testing approval workflow
      testUserRole: 'employee',
      userRoles: [
        { text: 'Employee', value: 'employee' },
        { text: 'Project Manager', value: 'manager' },
        { text: 'Director', value: 'director' },
        { text: 'Administrator', value: 'admin' }
      ],
      
      // Time off types
      timeOffTypes: [
        { id: 'vacation', name: 'Vacation' },
        { id: 'sick', name: 'Sick Time' }
      ],
      
      // Remove project dialog
      removeProjectDialog: false,
      projectToRemove: null,
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
    
    // Always allow timesheet submission
    canSubmitTimesheet() {
      return true; // Allow submission regardless of hours
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
      this.fetchCurrentTimesheet();
      this.fetchProjects();
      this.initializeUser();
    },
    
    // Fetch current timesheet for the period
    fetchCurrentTimesheet() {
      this.loading = true;
      
      // Get the current timesheet for this period
      timesheetService.getCurrentTimesheet(this.startDate, this.endDate)
        .then(response => {
          if (response && response.data) {
            // Set timesheet data
            this.timesheetId = response.data.id;
            this.timesheetData = response.data;
            this.timesheetStatus = response.data.status || 'Draft';
            
            // If the timesheet has existing entries, load them
            if (response.data.entries && response.data.entries.length > 0) {
              this.timeEntries = {};
              
              // Group entries by project
              const projectIds = [...new Set(response.data.entries.map(entry => entry.projectId))];
              
              // Fetch project details if not already available
              projectIds.forEach(projectId => {
                const projectExists = this.projects.some(p => p.id === projectId);
                
                if (!projectExists && projectId !== 'vacation' && projectId !== 'sick') {
                  projectService.getProjectById(projectId)
                    .then(projectResponse => {
                      if (projectResponse && projectResponse.data) {
                        const project = projectResponse.data;
                        this.projects.push({
                          id: project.id,
                          name: project.name,
                          clientId: project.clientId,
                          clientName: project.clientName || project.client?.name || '',
                          status: project.status
                        });
                        
                        // Add to timesheet projects
                        this.addProjectToTimesheet(project.id);
                      }
                    })
                    .catch(error => {
                      console.error(`Error fetching project ${projectId}:`, error);
                    });
                } else {
                  // Add to timesheet projects if vacation or sick
                  if (projectId === 'vacation' || projectId === 'sick') {
                    const timeOffType = this.timeOffTypes.find(type => type.id === projectId);
                    this.addTimeOffToTimesheet(timeOffType);
                  } else {
                    this.addProjectToTimesheet(projectId);
                  }
                }
              });
              
              // Initialize time entries from the fetched data
              response.data.entries.forEach(entry => {
                if (!this.timeEntries[entry.projectId]) {
                  this.timeEntries[entry.projectId] = {};
                }
                
                this.timeEntries[entry.projectId][entry.date] = {
                  hours: entry.hours.toString(),
                  comment: entry.comment || ''
                };
              });
            } else {
              // No entries yet, initialize empty structure
              this.initializeTimeEntries();
            }
          } else {
            // No timesheet exists yet, initialize empty structure
            this.initializeTimeEntries();
          }
          
          this.loading = false;
        })
        .catch(error => {
          console.error('Error fetching timesheet:', error);
          
          // Initialize empty structure if error
          this.initializeTimeEntries();
          this.loading = false;
        });
    },
    
    // Add a project to the timesheet projects list
    addProjectToTimesheet(projectId) {
      const project = this.projects.find(p => p.id === projectId);
      
      if (project && !this.timesheetProjects.some(p => p.id === projectId)) {
        this.timesheetProjects.push(project);
        this.initializeProjectEntries(projectId);
      }
    },
    
    // Add time off type to timesheet
    addTimeOffToTimesheet(timeOffType) {
      if (!timeOffType) return;
      
      if (!this.timesheetProjects.some(p => p.id === timeOffType.id)) {
        this.timesheetProjects.push({
          id: timeOffType.id,
          name: timeOffType.name,
          isTimeOff: true
        });
        
        this.initializeProjectEntries(timeOffType.id);
      }
    },
    
    // Initialize empty timesheet entries structure
    initializeTimeEntries() {
      // Make sure timeEntries is initialized as an empty object
      this.timeEntries = {};
      
      // Add initial entries for any existing projects
      this.timesheetProjects.forEach(project => {
        this.initializeProjectEntries(project.id);
      });
    },
    
    // Initialize entries for a specific project
    initializeProjectEntries(projectId) {
      if (!this.timeEntries[projectId]) {
        this.timeEntries[projectId] = {};
      }
      
      // Create empty entries for all days in the period
      this.daysInPeriod.forEach(day => {
        if (!this.timeEntries[projectId][day.date]) {
          this.$set(this.timeEntries[projectId], day.date, { 
            hours: '', 
            comment: '' 
          });
        }
      });
    },
    
    // Fetch available projects
    fetchProjects() {
      this.loading = true;
      
      // Get user's assigned projects
      projectService.getUserProjects()
        .then(response => {
          // Use mock data as fallback if API not available yet
          if (response && response.data) {
            this.projects = response.data.map(project => ({
              id: project.id,
              name: project.name,
              clientId: project.clientId,
              clientName: project.clientName || project.client?.name || '',
              projectManagerId: project.projectManagerId,
              projectManagerName: project.projectManagerName || '',
              status: project.status
            }));
          } else {
            // Fallback to mock data
            this.projects = [
              { id: 'alpha', name: 'Project Alpha' },
              { id: 'beta', name: 'Project Beta' },
              { id: 'gamma', name: 'Project Gamma' },
              { id: 'delta', name: 'Project Delta' }
            ];
          }
          
          // Add initial projects to timesheet
          this.timesheetProjects = []; // Start with no projects for simplicity
          
          this.loading = false;
        })
        .catch(error => {
          console.error('Error fetching projects:', error);
          
          // Fallback to mock data
          this.projects = [
            { id: 'alpha', name: 'Project Alpha' },
            { id: 'beta', name: 'Project Beta' },
            { id: 'gamma', name: 'Project Gamma' },
            { id: 'delta', name: 'Project Delta' }
          ];
          
          this.loading = false;
          this.showSnackbar('Error fetching projects. Using mock data.', 'error');
        });
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
    
    // Submit timesheet for approval - simplified version
    submitTimesheet() {
      // Always set to submitted state
      this.timesheetStatus = 'Submitted';
      this.submitDialog = false;
      
<<<<<<< HEAD
      // Show success message
      this.showSnackbar('Timesheet submitted successfully', 'success');
=======
      // First make sure all entries are saved before submission
      const hasChanges = this.isDirty;
      
      // Validate entries 
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
          
          // Check for comments
          if (numericHours > 0 && !entry.comment) {
            missingComments = true;
          }
        });
      });
      
      if (hasErrors) {
        this.showSnackbar('Some entries have invalid hours. Please check your timesheet.', 'error');
        this.loading = false;
        return;
      }
      
      if (missingComments) {
        // Show warning but allow continuation
        this.showSnackbar('Some entries are missing comments. Consider adding them for better tracking.', 'warning');
      }
      
      // If no timesheet ID, save it first
      if (!this.timesheetId) {
        this.saveTimesheet();
        this.loading = false;
        this.showSnackbar('Please save the timesheet first before submitting. Try again after saving.', 'info');
        this.submitDialog = false;
        return;
      }
      
      // Function to submit after ensuring everything is saved
      const proceedWithSubmission = () => {
        // Use mock data for demo or real API in production
        if (process.env.NODE_ENV === 'production' && this.timesheetId && !this.timesheetId.toString().startsWith('mock')) {
          // Real implementation using the API service
          timesheetService.submitTimesheet(this.timesheetId)
            .then(response => {
              if (response && response.data) {
                this.timesheetData = response.data;
                this.timesheetStatus = 'Submitted';
              } else {
                this.timesheetStatus = 'Submitted';
              }
              this.submitDialog = false;
              this.loading = false;
              this.showSnackbar('Timesheet submitted successfully', 'success');
            })
            .catch(error => {
              console.error('Error submitting timesheet:', error);
              this.loading = false;
              this.showSnackbar('Error submitting timesheet. Please try again.', 'error');
            });
        } else {
          // Mock implementation for demo
          setTimeout(() => {
            this.timesheetStatus = 'Submitted';
            this.submitDialog = false;
            this.loading = false;
            this.showSnackbar('Timesheet submitted successfully (mock)', 'success');
          }, 500);
        }
      };
      
      // If there are unsaved changes, save them first then submit
      if (hasChanges) {
        // Prepare data for API
        const entries = [];
        
        Object.keys(this.timeEntries).forEach(projectId => {
          Object.keys(this.timeEntries[projectId]).forEach(date => {
            const entry = this.timeEntries[projectId][date];
            const hours = parseFloat(entry.hours);
            if (hours > 0) {
              entries.push({
                timesheetId: this.timesheetId,
                projectId,
                date,
                hours,
                comment: entry.comment
              });
            }
          });
        });
        
        // Save first then submit
        if (process.env.NODE_ENV === 'production' || !entries.some(e => e.projectId.startsWith('alpha'))) {
          timesheetService.saveEntries(entries)
            .then(() => {
              this.isDirty = false;
              this.saved = true;
              // Now submit after saving
              proceedWithSubmission();
            })
            .catch(error => {
              console.error('Error saving timesheet before submission:', error);
              this.loading = false;
              this.showSnackbar('Error saving timesheet. Please try again.', 'error');
              this.submitDialog = false;
            });
        } else {
          // Mock save then submit
          setTimeout(() => {
            this.isDirty = false;
            this.saved = true;
            console.log('Timesheet saved before submission', entries);
            // Now submit after mock saving
            proceedWithSubmission();
          }, 500);
        }
      } else {
        // No changes to save, proceed directly to submission
        proceedWithSubmission();
      }
>>>>>>> f667bd5ba7a49d06c055a6abebf52b1abee3344f
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
      this.loading = true;
      
      // In a real app this would call the API
      setTimeout(() => {
        this.timesheetStatus = 'Approved';
        this.approvalDialog = false;
        this.loading = false;
        
        this.showSnackbar('Timesheet has been approved', 'success');
      }, 500);
    },
    
    // Show rejection dialog
    showRejectionDialog() {
      this.rejectionReason = '';
      this.rejectionDialog = true;
    },
    
    // Reject timesheet
    rejectTimesheet() {
      this.loading = true;
      
      // In a real app, this would be an API call
      setTimeout(() => {
        this.timesheetStatus = 'Rejected';
        this.rejectionDialog = false;
        this.loading = false;
        
        this.showSnackbar('Timesheet has been rejected', 'error');
      }, 500);
    },
    
    // Reopen an approved timesheet
    reopenTimesheet() {
      this.loading = true;
      
      // In a real app, this would be an API call
      setTimeout(() => {
        this.timesheetStatus = 'Draft';
        this.loading = false;
        
        this.showSnackbar('Timesheet has been reopened', 'info');
      }, 500);
    },
    
    // Show snackbar notification
    showSnackbar(text, color = 'success') {
      this.snackbar = {
        show: true,
        text,
        color
      };
    },
    
    // Add selected project to the timesheet
    addSelectedProject() {
      if (!this.selectedProjectId) return;
      
      // Close the dialog
      this.projectSelectionDialog = false;
      
      // Check if this is a time off category
      const isTimeOffType = this.timeOffTypes.some(type => type.id === this.selectedProjectId);
      
      let projectToAdd;
      
      if (isTimeOffType) {
        // Find the time off type
        const timeOffType = this.timeOffTypes.find(type => type.id === this.selectedProjectId);
        
        // Create a "virtual" project for the time off
        projectToAdd = {
          id: this.selectedProjectId,
          name: timeOffType.name,
          isTimeOff: true
        };
      } else {
        // Find the selected project
        projectToAdd = this.projects.find(p => p.id === this.selectedProjectId);
      }
      
      // Add to timesheetProjects if not already there
      if (!this.timesheetProjects.some(p => p.id === projectToAdd.id)) {
        this.timesheetProjects.push(projectToAdd);
        
        // Initialize time entries for this project
        this.initializeProjectEntries(projectToAdd.id);
        
        // Show confirmation message
        let message = '';
        if (isTimeOffType) {
          message = `Added ${projectToAdd.name} category to timesheet. Enter hours on the days you were absent.`;
          this.showSnackbar(message, 'info');
        } else {
          message = `Added ${projectToAdd.name} to timesheet`;
          this.showSnackbar(message, 'success');
        }
        
        // Mark as dirty to trigger save
        this.isDirty = true;
        this.saved = false;
      }
      
      // Reset selection
      this.selectedProjectId = null;
    },
    
    // Calculate total hours for a project
    calculateProjectTotal(projectId) {
      let total = 0;
      
      if (this.timeEntries[projectId]) {
        Object.keys(this.timeEntries[projectId]).forEach(date => {
          const hours = parseFloat(this.timeEntries[projectId][date].hours);
          if (!isNaN(hours)) {
            total += hours;
          }
        });
      }
      
      return total;
    },
    
    // Calculate daily total
    calculateDailyTotal(date) {
      let total = 0;
      
      Object.keys(this.timeEntries).forEach(projectId => {
        if (this.timeEntries[projectId][date]) {
          const hours = parseFloat(this.timeEntries[projectId][date].hours);
          if (!isNaN(hours)) {
            total += hours;
          }
        }
      });
      
      return total;
    },
    
    // Calculate total hours across all entries
    calculateTotalHours() {
      let total = 0;
      
      try {
        Object.keys(this.timeEntries).forEach(projectId => {
          Object.keys(this.timeEntries[projectId]).forEach(date => {
            const hours = this.timeEntries[projectId][date].hours;
            if (hours && hours !== '') {
              const numericHours = parseFloat(hours);
              if (!isNaN(numericHours) && numericHours > 0) {
                total += numericHours;
              }
            }
          });
        });
      } catch (error) {
        console.error('Error calculating total hours:', error);
      }
      
      return total;
    },

    // Calculate all totals immediately when data changes
    calculateTotals() {
      // This method is called immediately when input changes
      // No need to do anything here as Vue's reactivity will recalculate the computed properties
      this.isDirty = true;
      this.saved = false;
      this.debouncedSave();
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
      
      const { projectId } = this.currentEntry;
      
      // Get the project to check if it's a time off entry
      const project = this.timesheetProjects.find(p => p.id === projectId);
      const isTimeOff = project && project.isTimeOff;
      
      // For time off, we can auto-generate a comment if it's empty
      if (!this.currentEntry.comment.trim()) {
        if (isTimeOff) {
          if (projectId === 'vacation') {
            this.currentEntry.comment = 'Vacation day';
          } else if (projectId === 'sick') {
            this.currentEntry.comment = 'Sick day';
          }
        } else {
          // For regular projects, comments are required
          this.commentError = 'Comment is required';
          return;
        }
      }
      
      // Update the entry
      const { date, hours, comment } = this.currentEntry;
      
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
      
      // Calculate totals immediately
      this.calculateTotals();
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
        
        // Get the project to check if it's a time off entry
        const project = this.timesheetProjects.find(p => p.id === projectId);
        const isTimeOff = project && project.isTimeOff;
        
        // If hours are greater than 0, prompt for a comment if none exists
        // For time off entries, auto-populate a default comment if empty
        if (numericHours > 0) {
          if (isTimeOff && !this.timeEntries[projectId][date].comment) {
            // Auto-populate comment for time off entries
            if (projectId === 'vacation') {
              this.timeEntries[projectId][date].comment = 'Vacation day';
            } else if (projectId === 'sick') {
              this.timeEntries[projectId][date].comment = 'Sick day';
            }
          } else if (!isTimeOff && !this.timeEntries[projectId][date].comment) {
            // Prompt for comment for regular project entries
            this.openCommentDialog(projectId, date);
          }
        }
        
        // Calculate totals immediately
        this.calculateTotals();
        
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
              timesheetId: this.timesheetId,
              projectId,
              date,
              hours,
              comment: entry.comment
            });
          }
        });
      });
      
      // If no timesheet ID yet, we need to create one first
      if (!this.timesheetId) {
        const timesheetData = {
          startDate: this.startDate,
          endDate: this.endDate,
          entries
        };
        
        // Check if we're using real API or mock data
        if (process.env.NODE_ENV === 'production' || !entries.some(e => e.projectId.startsWith('alpha'))) {
          // Create a new timesheet
          timesheetService.createTimesheet(timesheetData)
            .then(response => {
              if (response && response.data) {
                this.timesheetId = response.data.id;
                this.timesheetData = response.data;
                this.isDirty = false;
                this.saved = true;
                this.showSnackbar('Timesheet created successfully', 'success');
              }
            })
            .catch(error => {
              console.error('Error creating timesheet:', error);
              this.showSnackbar('Error creating timesheet. Please try again.', 'error');
            });
        } else {
          // Mock create for development/demo
          setTimeout(() => {
            this.timesheetId = Math.random().toString(36).substring(2, 9);
            this.isDirty = false;
            this.saved = true;
            console.log('Timesheet created', timesheetData);
            this.showSnackbar('Timesheet created (mock)', 'success');
          }, 500);
        }
      } else {
        // Update existing timesheet - this code was previously inside the if(!this.timesheetId) block
        // Check if we're using real API or mock data
        if (process.env.NODE_ENV === 'production' || !entries.some(e => e.projectId.startsWith('alpha'))) {
          // Update existing timesheet
          timesheetService.saveEntries(entries)
            .then(() => {
              this.isDirty = false;
              this.saved = true;
              this.showSnackbar('Timesheet saved successfully', 'success');
            })
            .catch(error => {
              console.error('Error saving timesheet:', error);
              this.showSnackbar('Error saving timesheet. Please try again.', 'error');
            });
        } else {
          // Mock save for development/demo
          setTimeout(() => {
            this.isDirty = false;
            this.saved = true;
            console.log('Timesheet saved', entries);
            this.showSnackbar('Timesheet saved (mock)', 'success');
          }, 500);
        }
      }
    },
    
    // Debounce function to limit API calls
    debounce(fn, delay) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
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
    },
    
    // Validate hours
    validateHours(projectId, date) {
      try {
        if (!this.timeEntries[projectId] || !this.timeEntries[projectId][date]) return;
        
        const hours = this.timeEntries[projectId][date].hours;
        
        // Skip empty fields
        if (hours === '') return;
        
        // Validate and format hours
        const numericHours = parseFloat(hours);
        if (!isNaN(numericHours) && numericHours >= 0) {
          // Round to 0.25 increments
          const roundedHours = Math.round(numericHours * 4) / 4;
          this.timeEntries[projectId][date].hours = roundedHours.toString();
          
          // Get the project to check if it's a time off entry
          const project = this.timesheetProjects.find(p => p.id === projectId);
          const isTimeOff = project && project.isTimeOff;
          
          // For time off entries, auto-populate a default comment if empty
          if (isTimeOff && numericHours > 0 && !this.timeEntries[projectId][date].comment) {
            if (projectId === 'vacation') {
              this.timeEntries[projectId][date].comment = 'Vacation day';
            } else if (projectId === 'sick') {
              this.timeEntries[projectId][date].comment = 'Sick day';
            }
          }
          
          // Calculate totals
          this.calculateTotals();
        } else {
          // Reset invalid entries
          this.timeEntries[projectId][date].hours = '';
        }
      } catch (error) {
        console.error('Error validating hours:', error);
      }
    },
    
    // Update user role for testing
    updateUserRole() {
      if (this.currentUser) {
        this.currentUser.role = this.testUserRole;
      } else {
        this.currentUser = { 
          id: 'test-user', 
          role: this.testUserRole,
          firstName: 'Test',
          lastName: 'User'
        };
      }
      
      console.log(`Role changed to: ${this.testUserRole}`);
    },
    
    // Increment hours for a time entry
    incrementHours(projectId, date, increment) {
      if (!this.timeEntries[projectId] || !this.timeEntries[projectId][date]) return;
      
      const currentHours = parseFloat(this.timeEntries[projectId][date].hours) || 0;
      const newHours = currentHours + increment;
      
      if (newHours >= 0 && newHours <= 24) {
        this.timeEntries[projectId][date].hours = newHours.toString();
        
        // Get the project to check if it's a time off entry
        const project = this.timesheetProjects.find(p => p.id === projectId);
        const isTimeOff = project && project.isTimeOff;
        
        // Auto-populate comments for time off entries if hours > 0
        if (isTimeOff && newHours > 0 && !this.timeEntries[projectId][date].comment) {
          if (projectId === 'vacation') {
            this.timeEntries[projectId][date].comment = 'Vacation day';
          } else if (projectId === 'sick') {
            this.timeEntries[projectId][date].comment = 'Sick day';
          }
        }
        
        this.isDirty = true;
        this.saved = false;
        // Calculate totals immediately
        this.calculateTotals();
      }
    },
    
    // Confirm removing a project from the timesheet
    confirmRemoveProject(project) {
      // Can't remove if timesheet is not in Draft status
      if (this.timesheetStatus !== 'Draft') {
        this.showSnackbar('Cannot remove projects from a submitted or approved timesheet', 'error');
        return;
      }
      
      this.projectToRemove = project;
      this.removeProjectDialog = true;
    },
    
    // Check if project has time entries
    hasEntriesForProject() {
      if (!this.projectToRemove || !this.timeEntries[this.projectToRemove.id]) return false;
      
      return Object.values(this.timeEntries[this.projectToRemove.id]).some(entry => {
        const hours = parseFloat(entry.hours);
        return !isNaN(hours) && hours > 0;
      });
    },
    
    // Remove project from timesheet
    removeProject() {
      if (!this.projectToRemove) return;
      
      // Remove from timesheet projects
      const index = this.timesheetProjects.findIndex(p => p.id === this.projectToRemove.id);
      if (index !== -1) {
        this.timesheetProjects.splice(index, 1);
      }
      
      // Remove time entries
      if (this.timeEntries[this.projectToRemove.id]) {
        delete this.timeEntries[this.projectToRemove.id];
      }
      
      // If this is a persisted timesheet, mark as dirty to save the changes
      this.isDirty = true;
      this.saved = false;
      
      this.showSnackbar(`${this.projectToRemove.name} removed from timesheet`, 'success');
      this.removeProjectDialog = false;
      this.projectToRemove = null;
    },
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
  min-width: 120px; /* Increased from default */
}

.timesheet-table >>> .hour-input {
  text-align: center;
  width: calc(100% - 24px);
  min-width: 80px; /* Added minimum width */
}

.timesheet-table >>> .v-text-field input {
  text-align: center;
  font-size: 16px; /* Slightly larger text */
}

.timesheet-table >>> .hour-controls {
  display: flex;
  flex-direction: column;
  margin-right: -8px;
}

.timesheet-table >>> .hour-controls .v-btn {
  margin: 0;
  height: 16px !important;
  width: 16px !important;
}

.timesheet-table >>> .hour-controls .v-btn .v-icon {
  font-size: 14px;
}

.timesheet-table >>> th {
  min-width: 100px; /* Ensure column headers have enough width */
  white-space: nowrap;
  padding: 0 8px;
}

.timesheet-table >>> .weekend-cell {
  height: 32px;
  background-color: #f5f5f5;
}

.timesheet-table >>> .weekend-column {
  background-color: #f4f7fb; /* Lighter blue instead of gray */
}

.timesheet-table >>> .time-off-cell {
  background-color: #e3f2fd; /* Light blue for vacation/time off */
}

.timesheet-table >>> .time-off-cell.weekend-column {
  background-color: #bbdefb; /* Slightly darker blue for weekend time off */
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

<<<<<<< HEAD
.debug-info {
  font-size: 14px;
=======
/* Added scroll for table on small screens */
.timesheet-table {
  overflow-x: auto;
  display: block;
>>>>>>> f667bd5ba7a49d06c055a6abebf52b1abee3344f
}
</style>
