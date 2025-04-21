<template>
  <div class="timesheet-container">
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 font-weight-regular">Timesheet</h1>
      <v-spacer></v-spacer>
      <div class="date-range d-flex align-center mr-4">
        {{ dateRangeText }}
        <v-icon class="ml-2">mdi-calendar</v-icon>
      </div>
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="primary"
            v-bind="attrs"
            v-on="on"
            class="text-none"
          >
            Add Project
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="project in availableProjects"
            :key="project.id"
            @click="addProjectToTimesheet(project)"
          >
            <v-list-item-title>{{ project.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <v-chip
      color="success"
      outlined
      class="mb-4"
      v-if="saved"
    >
      Saved
    </v-chip>

    <v-data-table
      :headers="headers"
      :items="timesheetProjects"
      hide-default-footer
      disable-pagination
      disable-sort
      class="elevation-1 timesheet-table"
      :items-per-page="-1"
    >
      <!-- Project name column -->
      <template v-slot:item.project="{ item }">
        {{ item.name }}
      </template>

      <!-- Total column -->
      <template v-slot:item.total="{ item }">
        <div class="font-weight-bold">
          {{ calculateProjectTotal(item.id).toFixed(1) }}
        </div>
      </template>

      <!-- Handle each day column through item template override -->
      <template v-slot:item="{ item, headers, index }">
        <tr>
          <td>{{ item.name }}</td>
          
          <!-- Loop through days and render appropriate cells -->
          <td v-for="day in daysInPeriod" :key="`${item.id}-${day.date}`" 
              :class="{ 'weekend-column': day.isWeekend }">
            <div class="hour-cell">
              <v-text-field
                v-if="!day.isWeekend"
                v-model="timeEntries[item.id][day.date]"
                type="number"
                step="0.5"
                min="0"
                max="24"
                hide-details
                single-line
                class="hour-input"
                @blur="validateAndSave(item.id, day.date)"
                @focus="onFocus"
              ></v-text-field>
              <div v-else class="weekend-cell">
                <!-- Weekend cell -->
              </div>
            </div>
          </td>
          
          <!-- Total column -->
          <td class="text-center">
            <div class="font-weight-bold">
              {{ calculateProjectTotal(item.id).toFixed(1) }}
            </div>
          </td>
        </tr>
      </template>

      <!-- Add Project row -->
      <template v-slot:body.append>
        <tr>
          <td colspan="100%" class="text-center pa-2">
            <v-btn 
              text 
              color="primary" 
              @click="showAddProjectMenu"
              class="add-project-btn"
            >
              <v-icon left>mdi-plus</v-icon>
              Add Project to Timesheet
            </v-btn>
          </td>
        </tr>
      </template>

      <!-- Daily total row -->
      <template v-slot:footer>
        <tr class="daily-total-row">
          <td class="font-weight-bold">Daily Total</td>
          <td v-for="day in daysInPeriod" :key="day.date" class="text-center"
              :class="{ 'weekend-column': day.isWeekend }">
            {{ calculateDailyTotal(day.date).toFixed(1) }}
          </td>
          <td class="font-weight-bold text-center">
            {{ calculateTotalHours().toFixed(1) }}
          </td>
        </tr>
      </template>
    </v-data-table>
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
      
      // Store time entries in format: { projectId: { 'YYYY-MM-DD': hours } }
      timeEntries: {},
      
      // Track dirty state for saving
      isDirty: false
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
    
    // Generate table headers
    headers() {
      // Start with project column
      const headers = [
        { text: 'Project', value: 'project', width: '200px' }
      ];
      
      // Add a column for each day
      this.daysInPeriod.forEach(day => {
        headers.push({
          text: day.formatted,
          value: `day${day.index}`,
          align: 'center',
          width: '80px',
          sortable: false,
          cellClass: day.isWeekend ? 'weekend-column' : '',
          class: day.isWeekend ? 'weekend-column' : ''
        });
      });
      
      // Add total column
      headers.push({
        text: 'Total',
        value: 'total',
        align: 'center',
        width: '80px'
      });
      
      return headers;
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
          this.timeEntries[this.timesheetProjects[0].id][testDate] = '1';
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
            this.timeEntries[entry.projectId][entry.date] = entry.hours.toString();
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
    
    // Add a project to the timesheet
    addProjectToTimesheet(project) {
      this.timesheetProjects.push(project);
      
      // Initialize entries object for this project
      if (!this.timeEntries[project.id]) {
        this.timeEntries[project.id] = {};
      }
      
      this.isDirty = true;
      this.saved = false;
    },
    
    // Show the add project menu
    showAddProjectMenu() {
      // This would trigger the menu to open
      // Implementation depends on how you want to handle this UI interaction
    },
    
    // Calculate total hours for a project
    calculateProjectTotal(projectId) {
      if (!this.timeEntries[projectId]) return 0;
      
      return Object.values(this.timeEntries[projectId])
        .reduce((total, hours) => {
          return total + (parseFloat(hours) || 0);
        }, 0);
    },
    
    // Calculate total hours for a day across all projects
    calculateDailyTotal(date) {
      let total = 0;
      
      Object.keys(this.timeEntries).forEach(projectId => {
        total += parseFloat(this.timeEntries[projectId][date] || 0);
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
    
    // Validate and save an entry
    validateAndSave(projectId, date) {
      const value = this.timeEntries[projectId][date];
      
      // Basic validation
      if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
        this.timeEntries[projectId][date] = '';
      } else if (value && parseFloat(value) > 24) {
        this.timeEntries[projectId][date] = '24';
      }
      
      // If empty string, remove the entry
      if (value === '') {
        this.$delete(this.timeEntries[projectId], date);
      }
      
      // Mark as need saving
      this.isDirty = true;
      this.saved = false;
    },
    
    // Track focus for better user experience
    onFocus() {
      // Could implement focus tracking here
    },
    
    // Save timesheet to API
    saveTimesheet() {
      if (!this.isDirty) return;
      
      // Prepare data for API
      const entries = [];
      
      Object.keys(this.timeEntries).forEach(projectId => {
        Object.keys(this.timeEntries[projectId]).forEach(date => {
          const hours = parseFloat(this.timeEntries[projectId][date]);
          if (hours > 0) {
            entries.push({
              projectId,
              date,
              hours
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
}

.timesheet-table >>> .hour-input {
  text-align: center;
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

.add-project-btn {
  width: 100%;
}
</style>
