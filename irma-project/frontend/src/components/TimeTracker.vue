&lt;template>
  &lt;div class="time-tracker">
    &lt;v-card>
      &lt;v-card-title>
        Real-Time Time Tracker
        &lt;v-spacer>&lt;/v-spacer>
        &lt;v-switch
          v-model="offlineMode"
          label="Offline Mode"
          color="primary"
          hide-details
        >&lt;/v-switch>
      &lt;/v-card-title>
      
      &lt;v-card-text>
        &lt;v-row>
          &lt;v-col cols="12" md="6">
            &lt;v-select
              v-model="selectedProject"
              :items="projects"
              item-text="name"
              item-value="id"
              label="Select Project"
              :disabled="isTracking"
              :rules="[v => !!v || 'Project is required']"
              required
            >&lt;/v-select>
          &lt;/v-col>
          
          &lt;v-col cols="12" md="6">
            &lt;v-text-field
              v-model="description"
              label="Description"
              :disabled="isTracking"
            >&lt;/v-text-field>
          &lt;/v-col>
        &lt;/v-row>
        
        &lt;v-row>
          &lt;v-col cols="12" class="text-center">
            &lt;div class="timer-display">
              {{ formattedTime }}
            &lt;/div>
          &lt;/v-col>
        &lt;/v-row>
        
        &lt;v-row>
          &lt;v-col cols="12" class="text-center">
            &lt;v-btn
              color="success"
              large
              @click="startTimer"
              v-if="!isTracking"
              :disabled="!selectedProject"
            >
              &lt;v-icon left>mdi-play&lt;/v-icon>
              Start Timer
            &lt;/v-btn>
            
            &lt;v-btn
              color="error"
              large
              @click="stopTimer"
              v-if="isTracking"
            >
              &lt;v-icon left>mdi-stop&lt;/v-icon>
              Stop Timer
            &lt;/v-btn>
            
            &lt;v-btn
              color="primary"
              large
              class="ml-4"
              @click="pauseTimer"
              v-if="isTracking && !isPaused"
            >
              &lt;v-icon left>mdi-pause&lt;/v-icon>
              Pause
            &lt;/v-btn>
            
            &lt;v-btn
              color="primary"
              large
              class="ml-4"
              @click="resumeTimer"
              v-if="isTracking && isPaused"
            >
              &lt;v-icon left>mdi-play&lt;/v-icon>
              Resume
            &lt;/v-btn>
          &lt;/v-col>
        &lt;/v-row>
      &lt;/v-card-text>
      
      &lt;v-divider>&lt;/v-divider>
      
      &lt;v-card-title>
        Recent Time Entries
        &lt;v-spacer>&lt;/v-spacer>
        &lt;v-btn
          color="primary"
          text
          @click="syncOfflineEntries"
          v-if="offlineEntries.length > 0"
        >
          &lt;v-icon left>mdi-sync&lt;/v-icon>
          Sync {{ offlineEntries.length }} Offline Entries
        &lt;/v-btn>
      &lt;/v-card-title>
      
      &lt;v-card-text>
        &lt;v-data-table
          :headers="headers"
          :items="timeEntries"
          :items-per-page="5"
          class="elevation-1"
        >
          &lt;template v-slot:item.project="{ item }">
            {{ getProjectName(item.projectId) }}
          &lt;/template>
          
          &lt;template v-slot:item.date="{ item }">
            {{ formatDate(item.date) }}
          &lt;/template>
          
          &lt;template v-slot:item.hours="{ item }">
            {{ formatHours(item.hours) }}
          &lt;/template>
          
          &lt;template v-slot:item.status="{ item }">
            &lt;v-chip
              x-small
              :color="item.offline ? 'warning' : 'success'"
              text-color="white"
            >
              {{ item.offline ? 'Offline' : 'Synced' }}
            &lt;/v-chip>
          &lt;/template>
          
          &lt;template v-slot:item.actions="{ item }">
            &lt;v-icon
              small
              class="mr-2"
              @click="editEntry(item)"
            >
              mdi-pencil
            &lt;/v-icon>
            &lt;v-icon
              small
              @click="deleteEntry(item)"
            >
              mdi-delete
            &lt;/v-icon>
          &lt;/template>
        &lt;/v-data-table>
      &lt;/v-card-text>
    &lt;/v-card>
    
    &lt;v-dialog
      v-model="editDialog"
      max-width="500px"
    >
      &lt;v-card>
        &lt;v-card-title>Edit Time Entry&lt;/v-card-title>
        &lt;v-card-text>
          &lt;v-container>
            &lt;v-row>
              &lt;v-col cols="12">
                &lt;v-select
                  v-model="editedItem.projectId"
                  :items="projects"
                  item-text="name"
                  item-value="id"
                  label="Project"
                  required
                >&lt;/v-select>
              &lt;/v-col>
              
              &lt;v-col cols="12">
                &lt;v-text-field
                  v-model="editedItem.description"
                  label="Description"
                >&lt;/v-text-field>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-menu
                  ref="dateMenu"
                  v-model="dateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  &lt;template v-slot:activator="{ on, attrs }">
                    &lt;v-text-field
                      v-model="formattedEditDate"
                      label="Date"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                    >&lt;/v-text-field>
                  &lt;/template>
                  &lt;v-date-picker
                    v-model="editedItem.date"
                    @input="dateMenu = false"
                  >&lt;/v-date-picker>
                &lt;/v-menu>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-text-field
                  v-model="editedItem.hours"
                  label="Hours"
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                >&lt;/v-text-field>
              &lt;/v-col>
            &lt;/v-row>
          &lt;/v-container>
        &lt;/v-card-text>
        
        &lt;v-card-actions>
          &lt;v-spacer>&lt;/v-spacer>
          &lt;v-btn
            color="blue darken-1"
            text
            @click="closeEdit"
          >
            Cancel
          &lt;/v-btn>
          &lt;v-btn
            color="blue darken-1"
            text
            @click="saveEdit"
          >
            Save
          &lt;/v-btn>
        &lt;/v-card-actions>
      &lt;/v-card>
    &lt;/v-dialog>
  &lt;/div>
&lt;/template>

&lt;script>
export default {
  name: 'TimeTracker',
  data() {
    return {
      isTracking: false,
      isPaused: false,
      startTime: null,
      pausedTime: 0,
      elapsedTime: 0,
      timerInterval: null,
      selectedProject: null,
      description: '',
      offlineMode: false,
      
      // Time entries
      timeEntries: [],
      offlineEntries: [],
      
      // Edit dialog
      editDialog: false,
      editedIndex: -1,
      editedItem: {
        id: null,
        projectId: null,
        date: new Date().toISOString().substr(0, 10),
        hours: 0,
        description: '',
        offline: false
      },
      defaultItem: {
        id: null,
        projectId: null,
        date: new Date().toISOString().substr(0, 10),
        hours: 0,
        description: '',
        offline: false
      },
      dateMenu: false,
      
      // Table headers
      headers: [
        { text: 'Project', value: 'project' },
        { text: 'Date', value: 'date' },
        { text: 'Hours', value: 'hours' },
        { text: 'Description', value: 'description' },
        { text: 'Status', value: 'status' },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      
      // Mock projects (would come from API)
      projects: [
        { id: 'proj1', name: 'Project Alpha' },
        { id: 'proj2', name: 'Project Beta' }
      ]
    };
  },
  
  computed: {
    formattedTime() {
      const totalSeconds = Math.floor(this.elapsedTime / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      return `${this.padTime(hours)}:${this.padTime(minutes)}:${this.padTime(seconds)}`;
    },
    
    formattedEditDate() {
      if (!this.editedItem.date) return '';
      const [year, month, day] = this.editedItem.date.split('-');
      return `${month}/${day}/${year}`;
    }
  },
  
  created() {
    // Load time entries from localStorage
    this.loadTimeEntries();
    this.loadOfflineEntries();
    
    // Check for network status
    window.addEventListener('online', this.handleNetworkChange);
    window.addEventListener('offline', this.handleNetworkChange);
    this.offlineMode = !navigator.onLine;
  },
  
  beforeDestroy() {
    // Clear timer interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Remove event listeners
    window.removeEventListener('online', this.handleNetworkChange);
    window.removeEventListener('offline', this.handleNetworkChange);
  },
  
  methods: {
    startTimer() {
      if (!this.selectedProject) return;
      
      this.isTracking = true;
      this.isPaused = false;
      this.startTime = Date.now() - this.pausedTime;
      this.pausedTime = 0;
      
      this.timerInterval = setInterval(() => {
        if (!this.isPaused) {
          this.elapsedTime = Date.now() - this.startTime;
        }
      }, 1000);
    },
    
    stopTimer() {
      if (!this.isTracking) return;
      
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      
      // Calculate hours (convert milliseconds to hours)
      const hours = this.elapsedTime / (1000 * 60 * 60);
      
      // Create time entry
      const entry = {
        id: Date.now().toString(),
        projectId: this.selectedProject,
        date: new Date().toISOString().substr(0, 10),
        hours: parseFloat(hours.toFixed(2)),
        description: this.description,
        offline: this.offlineMode
      };
      
      // Save entry
      if (this.offlineMode) {
        this.saveOfflineEntry(entry);
      } else {
        this.saveTimeEntry(entry);
      }
      
      // Reset timer
      this.isTracking = false;
      this.isPaused = false;
      this.elapsedTime = 0;
      this.pausedTime = 0;
      this.description = '';
    },
    
    pauseTimer() {
      if (!this.isTracking || this.isPaused) return;
      
      this.isPaused = true;
      this.pausedTime = this.elapsedTime;
    },
    
    resumeTimer() {
      if (!this.isTracking || !this.isPaused) return;
      
      this.isPaused = false;
      this.startTime = Date.now() - this.pausedTime;
    },
    
    padTime(value) {
      return value.toString().padStart(2, '0');
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    
    formatHours(hours) {
      return hours.toFixed(2);
    },
    
    getProjectName(projectId) {
      const project = this.projects.find(p => p.id === projectId);
      return project ? project.name : 'Unknown Project';
    },
    
    loadTimeEntries() {
      // In a real app, this would fetch from API
      const savedEntries = localStorage.getItem('timeEntries');
      this.timeEntries = savedEntries ? JSON.parse(savedEntries) : [];
    },
    
    saveTimeEntry(entry) {
      // In a real app, this would save to API
      this.timeEntries.unshift(entry);
      localStorage.setItem('timeEntries', JSON.stringify(this.timeEntries));
    },
    
    loadOfflineEntries() {
      const savedEntries = localStorage.getItem('offlineEntries');
      this.offlineEntries = savedEntries ? JSON.parse(savedEntries) : [];
    },
    
    saveOfflineEntry(entry) {
      this.offlineEntries.push(entry);
      localStorage.setItem('offlineEntries', JSON.stringify(this.offlineEntries));
      
      // Also add to displayed entries
      this.timeEntries.unshift(entry);
      localStorage.setItem('timeEntries', JSON.stringify(this.timeEntries));
    },
    
    syncOfflineEntries() {
      // In a real app, this would sync with the server
      if (this.offlineEntries.length === 0) return;
      
      // Simulate syncing
      this.offlineEntries.forEach(entry => {
        // Find entry in timeEntries and update offline status
        const index = this.timeEntries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
          this.timeEntries[index].offline = false;
        }
      });
      
      // Clear offline entries
      this.offlineEntries = [];
      localStorage.setItem('offlineEntries', JSON.stringify(this.offlineEntries));
      localStorage.setItem('timeEntries', JSON.stringify(this.timeEntries));
      
      // Show success message
      this.$emit('show-snackbar', {
        text: 'Offline entries synced successfully',
        color: 'success'
      });
    },
    
    handleNetworkChange() {
      this.offlineMode = !navigator.onLine;
      
      if (navigator.onLine && this.offlineEntries.length > 0) {
        // Prompt user to sync
        this.$emit('show-snackbar', {
          text: `You're back online. ${this.offlineEntries.length} entries need to be synced.`,
          color: 'info',
          timeout: 10000,
          action: {
            text: 'SYNC NOW',
            callback: this.syncOfflineEntries
          }
        });
      }
    },
    
    editEntry(item) {
      this.editedIndex = this.timeEntries.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.editDialog = true;
    },
    
    deleteEntry(item) {
      const index = this.timeEntries.indexOf(item);
      if (confirm('Are you sure you want to delete this time entry?')) {
        this.timeEntries.splice(index, 1);
        localStorage.setItem('timeEntries', JSON.stringify(this.timeEntries));
        
        // If it's an offline entry, remove from offlineEntries as well
        if (item.offline) {
          const offlineIndex = this.offlineEntries.findIndex(e => e.id === item.id);
          if (offlineIndex !== -1) {
            this.offlineEntries.splice(offlineIndex, 1);
            localStorage.setItem('offlineEntries', JSON.stringify(this.offlineEntries));
          }
        }
      }
    },
    
    closeEdit() {
      this.editDialog = false;
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    },
    
    saveEdit() {
      if (this.editedIndex > -1) {
        // Update entry
        Object.assign(this.timeEntries[this.editedIndex], this.editedItem);
        localStorage.setItem('timeEntries', JSON.stringify(this.timeEntries));
        
        // If it's an offline entry, update in offlineEntries as well
        if (this.editedItem.offline) {
          const offlineIndex = this.offlineEntries.findIndex(e => e.id === this.editedItem.id);
          if (offlineIndex !== -1) {
            Object.assign(this.offlineEntries[offlineIndex], this.editedItem);
            localStorage.setItem('offlineEntries', JSON.stringify(this.offlineEntries));
          }
        }
      }
      
      this.closeEdit();
    }
  }
};
&lt;/script>

&lt;style scoped>
.timer-display {
  font-size: 3rem;
  font-weight: 300;
  margin: 1rem 0;
}
&lt;/style>
