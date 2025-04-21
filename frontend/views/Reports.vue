<template>
  <div class="reports-container">
    <v-card>
      <v-card-title class="headline">
        Reports
        <v-spacer></v-spacer>
        <v-menu
          ref="dateMenu"
          v-model="dateMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          max-width="290px"
          min-width="auto"
        >
          <template #activator="{ on, attrs }">
            <v-text-field
              v-model="dateRangeText"
              label="Date Range"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
              hide-details
              class="date-picker"
              style="max-width: 180px;"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="dates"
            range
            no-title
            scrollable
          >
            <v-spacer></v-spacer>
            <v-btn text color="primary" @click="dateMenu = false">
              Cancel
            </v-btn>
            <v-btn text color="primary" @click="selectDateRange">
              OK
            </v-btn>
          </v-date-picker>
        </v-menu>
      </v-card-title>

      <v-tabs
        v-model="activeTab"
        background-color="primary"
        dark
        slider-color="secondary"
      >
        <v-tab v-for="tab in tabs" :key="tab.value">
          {{ tab.label }}
        </v-tab>
      </v-tabs>

      <v-card-text class="mt-4">
        <v-tabs-items v-model="activeTab">
          <!-- Project Budget Burndown -->
          <v-tab-item key="project-budget">
            <div class="d-flex align-center mb-4">
              <v-select
                v-model="selectedProject"
                :items="projects"
                item-text="name"
                item-value="id"
                label="Select Project"
                outlined
                dense
                hide-details
                class="mr-4"
                style="max-width: 250px;"
              ></v-select>
              <v-btn color="primary" @click="generateReport" :loading="loading">
                Generate Report
              </v-btn>
            </div>
            
            <div v-if="loading" class="text-center pa-6">
              <v-progress-circular indeterminate size="64"></v-progress-circular>
            </div>
            
            <div v-else-if="!projectBudgetData.datasets[0].data.length" class="text-center pa-6">
              <p>Select a project and date range, then click "Generate Report"</p>
            </div>
            
            <div v-else>
              <div class="mb-4">
                <v-chip color="primary" class="mr-2">Budget: {{ selectedProjectBudget.toLocaleString() }} hours</v-chip>
                <v-chip :color="getBudgetStatusColor(selectedProjectUsedPercentage)">
                  Used: {{ selectedProjectUsed.toLocaleString() }} hours ({{ selectedProjectUsedPercentage }}%)
                </v-chip>
              </div>
              
              <!-- Simple bar chart representation -->
              <div class="chart-container mb-4">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-subtitle-1">Hours Usage by Month</div>
                  <v-chip small>Total Used: {{ selectedProjectUsed }} / {{ selectedProjectBudget }} hours</v-chip>
                </div>
                
                <div class="simple-chart">
                  <div v-for="(value, index) in projectBudgetData.datasets[0].data" :key="index" class="simple-chart-item">
                    <div class="simple-chart-label">{{ projectBudgetData.labels[index] }}</div>
                    <v-progress-linear
                      :value="(value / selectedProjectBudget) * 100"
                      height="30"
                      color="primary"
                    >
                      <template v-slot:default>
                        <span class="white--text">{{ value }} hrs</span>
                      </template>
                    </v-progress-linear>
                  </div>
                </div>
              </div>
              
              <!-- Budget burndown table -->
              <v-simple-table class="mt-6">
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left">Month</th>
                      <th class="text-left">Hours Used</th>
                      <th class="text-left">Percentage of Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(value, index) in projectBudgetData.datasets[0].data" :key="index">
                      <td>{{ projectBudgetData.labels[index] }}</td>
                      <td>{{ value }}</td>
                      <td>
                        <v-progress-linear
                          :value="(value / selectedProjectBudget) * 100"
                          height="20"
                          :color="getBudgetColor((value / selectedProjectBudget) * 100)"
                        >
                          <template v-slot:default>
                            <span>{{ Math.round((value / selectedProjectBudget) * 100) }}%</span>
                          </template>
                        </v-progress-linear>
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </div>
          </v-tab-item>

          <!-- Resource Utilization -->
          <v-tab-item key="resource-utilization">
            <div class="d-flex align-center mb-4">
              <v-select
                v-model="utilizationView"
                :items="utilizationViewOptions"
                label="View"
                outlined
                dense
                hide-details
                style="max-width: 200px;"
                class="mr-4"
              ></v-select>
              <v-btn color="primary" @click="generateReport" :loading="loading">
                Generate Report
              </v-btn>
            </div>
            
            <div v-if="loading" class="text-center pa-6">
              <v-progress-circular indeterminate size="64"></v-progress-circular>
            </div>
            
            <div v-else-if="!utilizationData.datasets.length" class="text-center pa-6">
              <p>Select a date range, then click "Generate Report"</p>
            </div>
            
            <div v-else>
              <div class="text-center mb-2">
                <v-chip color="primary" class="mr-2">
                  Avg. Utilization: {{ averageUtilization }}%
                </v-chip>
                <v-chip color="green" v-if="utilizationView === 'monthly'">
                  Target: 80%
                </v-chip>
              </div>
              
              <!-- Simple visualization instead of Chart.js -->
              <div class="chart-container mb-6">
                <div v-if="utilizationView === 'monthly'" class="simple-chart">
                  <div v-for="(value, index) in utilizationData.datasets[0].data" :key="index" class="simple-chart-item">
                    <div class="simple-chart-label">{{ utilizationData.labels[index] }}</div>
                    <v-progress-linear
                      :value="value"
                      height="30"
                      :color="getUtilizationColor(value)"
                    >
                      <template v-slot:default>
                        <span class="white--text">{{ value }}%</span>
                      </template>
                    </v-progress-linear>
                  </div>
                </div>
                <div v-else>
                  <v-card outlined class="pa-4">
                    <div v-for="resource in utilizationTableData" :key="resource.id" class="mb-3">
                      <div class="d-flex justify-space-between mb-1">
                        <div>{{ resource.name }}</div>
                        <div>{{ resource.utilization }}%</div>
                      </div>
                      <v-progress-linear
                        :value="resource.utilization"
                        height="20"
                        :color="getUtilizationColor(resource.utilization)"
                      ></v-progress-linear>
                    </div>
                  </v-card>
                </div>
              </div>
              
              <div class="mt-6">
                <v-data-table
                  :headers="utilizationHeaders"
                  :items="utilizationTableData"
                  :items-per-page="10"
                  class="elevation-1"
                >
                  <template #[`item.utilization`]="{ item }">
                    <v-progress-linear
                      :value="item.utilization"
                      height="20"
                      :color="getUtilizationColor(item.utilization)"
                    >
                      <template v-slot:default>
                        <strong>{{ item.utilization }}%</strong>
                      </template>
                    </v-progress-linear>
                  </template>
                </v-data-table>
              </div>
            </div>
          </v-tab-item>

          <!-- Project Status Overview -->
          <v-tab-item key="project-status">
            <div class="d-flex justify-end mb-4">
              <v-btn color="primary" @click="generateReport" :loading="loading">
                Generate Report
              </v-btn>
            </div>
            
            <div v-if="loading" class="text-center pa-6">
              <v-progress-circular indeterminate size="64"></v-progress-circular>
            </div>
            
            <div v-else>
              <div class="d-flex mb-6">
                <v-card class="mr-4 pa-4 flex-grow-1 status-card" outlined>
                  <div class="text-h6">On Track</div>
                  <div class="text-h3 success--text">{{ projectStatusCounts.onTrack }}</div>
                </v-card>
                <v-card class="mr-4 pa-4 flex-grow-1 status-card" outlined>
                  <div class="text-h6">At Risk</div>
                  <div class="text-h3 warning--text">{{ projectStatusCounts.atRisk }}</div>
                </v-card>
                <v-card class="pa-4 flex-grow-1 status-card" outlined>
                  <div class="text-h6">Behind</div>
                  <div class="text-h3 error--text">{{ projectStatusCounts.behind }}</div>
                </v-card>
              </div>
              
              <!-- Simple status visualization instead of Chart.js -->
              <v-card outlined class="pa-4 mb-6">
                <div class="text-subtitle-1 mb-4">Project Status Distribution</div>
                <div class="d-flex status-chart">
                  <div 
                    class="status-bar success" 
                    :style="{flex: projectStatusCounts.onTrack || 0.001}"
                  >
                    <span v-if="projectStatusCounts.onTrack">{{ projectStatusCounts.onTrack }}</span>
                  </div>
                  <div 
                    class="status-bar warning" 
                    :style="{flex: projectStatusCounts.atRisk || 0.001}"
                  >
                    <span v-if="projectStatusCounts.atRisk">{{ projectStatusCounts.atRisk }}</span>
                  </div>
                  <div 
                    class="status-bar error" 
                    :style="{flex: projectStatusCounts.behind || 0.001}"
                  >
                    <span v-if="projectStatusCounts.behind">{{ projectStatusCounts.behind }}</span>
                  </div>
                </div>
                <div class="d-flex justify-space-between mt-2">
                  <div class="caption"><v-icon small color="success">mdi-checkbox-blank-circle</v-icon> On Track</div>
                  <div class="caption"><v-icon small color="warning">mdi-checkbox-blank-circle</v-icon> At Risk</div>
                  <div class="caption"><v-icon small color="error">mdi-checkbox-blank-circle</v-icon> Behind</div>
                </div>
              </v-card>
              
              <v-data-table
                :headers="projectStatusHeaders"
                :items="projectStatusTableData"
                :items-per-page="5"
                class="elevation-1"
              >
                <template #[`item.status`]="{ item }">
                  <v-chip :color="getStatusColor(item.status)" small>
                    {{ item.status }}
                  </v-chip>
                </template>
                <template #[`item.budgetUsed`]="{ item }">
                  <v-progress-linear
                    :value="item.budgetUsed"
                    height="20"
                    :color="getBudgetColor(item.budgetUsed)"
                  >
                    <template v-slot:default>
                      <strong>{{ item.budgetUsed }}%</strong>
                    </template>
                  </v-progress-linear>
                </template>
              </v-data-table>
            </div>
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import axios from 'axios';
import moment from 'moment';

export default {
  name: 'ReportsPage',
  
  data() {
    return {
      activeTab: 0,
      loading: false,
      dateMenu: false,
      dates: [
        moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD'),
        moment().format('YYYY-MM-DD')
      ],
      
      selectedProject: null,
      utilizationView: 'monthly',
      
      // Sample data (would come from API)
      projects: [],
      resources: [],
      timeEntries: [],
      
      // Page config
      tabs: [
        { label: 'Project Budget Burndown', value: 'project-budget' },
        { label: 'Resource Utilization', value: 'resource-utilization' },
        { label: 'Project Status Overview', value: 'project-status' }
      ],
      utilizationViewOptions: [
        { text: 'Monthly Overview', value: 'monthly' },
        { text: 'By Resource', value: 'resource' }
      ],
      utilizationHeaders: [
        { text: 'Resource', value: 'name' },
        { text: 'Billable Hours', value: 'billableHours' },
        { text: 'Available Hours', value: 'availableHours' },
        { text: 'Utilization', value: 'utilization' }
      ],
      projectStatusHeaders: [
        { text: 'Project', value: 'name' },
        { text: 'Client', value: 'client' },
        { text: 'Status', value: 'status' },
        { text: 'Budget Used', value: 'budgetUsed' },
        { text: 'End Date', value: 'endDate' }
      ]
    };
  },
  
  computed: {
    // Format date range for display
    dateRangeText() {
      if (!this.dates || !this.dates.length) return '';
      
      const [start, end] = this.dates;
      if (!end) return moment(start).format('MMM D, YYYY');
      
      return `${moment(start).format('MMM D, YYYY')} - ${moment(end).format('MMM D, YYYY')}`;
    },
    
    // Project Budget data for the chart
    projectBudgetData() {
      if (!this.selectedProject) {
        return {
          labels: [],
          datasets: [{
            label: 'Hours Used',
            data: []
          }]
        };
      }
      
      // Get project details
      const project = this.projects.find(p => p.id === this.selectedProject);
      if (!project) return { labels: [], datasets: [{ data: [] }] };
      
      // Prepare data (in a real app, this would be API data)
      const months = this.getMonthsInRange();
      const hoursUsed = this.calculateProjectHoursUsed(this.selectedProject, months);
      
      return {
        labels: months.map(m => m.format('MMM YYYY')),
        datasets: [{
          label: 'Hours Used',
          data: hoursUsed
        }]
      };
    },
    
    // Calculate selected project budget numbers
    selectedProjectBudget() {
      if (!this.selectedProject) return 0;
      const project = this.projects.find(p => p.id === this.selectedProject);
      return project ? project.budgetHours : 0;
    },
    
    selectedProjectUsed() {
      if (!this.selectedProject) return 0;
      return this.projectBudgetData.datasets[0].data.reduce((sum, val) => sum + val, 0);
    },
    
    selectedProjectUsedPercentage() {
      if (!this.selectedProjectBudget) return 0;
      return Math.round((this.selectedProjectUsed / this.selectedProjectBudget) * 100);
    },
    
    // Resource utilization data for chart
    utilizationData() {
      if (this.utilizationView === 'monthly') {
        return this.calculateMonthlyUtilization();
      } else {
        return this.calculateResourceUtilization();
      }
    },
    
    // Table data for resource utilization
    utilizationTableData() {
      return this.resources.map(resource => {
        const billableHours = this.calculateResourceBillableHours(resource.id);
        const availableHours = this.calculateResourceAvailableHours(resource.id);
        const utilization = Math.round((billableHours / availableHours) * 100);
        
        return {
          id: resource.id,
          name: resource.name,
          billableHours,
          availableHours,
          utilization
        };
      }).sort((a, b) => b.utilization - a.utilization);
    },
    
    // Average utilization across all resources
    averageUtilization() {
      if (!this.utilizationTableData.length) return 0;
      
      const total = this.utilizationTableData.reduce((sum, resource) => {
        return sum + resource.utilization;
      }, 0);
      
      return Math.round(total / this.utilizationTableData.length);
    },
    
    // Project status data
    projectStatusCounts() {
      return {
        onTrack: this.projects.filter(p => p.status === 'On Track').length,
        atRisk: this.projects.filter(p => p.status === 'At Risk').length,
        behind: this.projects.filter(p => p.status === 'Behind').length
      };
    },
    
    projectStatusTableData() {
      return this.projects.map(project => {
        return {
          id: project.id,
          name: project.name,
          client: project.client,
          status: project.status,
          budgetUsed: Math.round((project.hoursUsed / project.budgetHours) * 100),
          endDate: moment(project.endDate).format('MMM D, YYYY')
        };
      });
    }
  },
  
  mounted() {
    this.fetchData();
  },
  
  methods: {
    // Fetch initial data
    fetchData() {
      this.loading = true;
      
      // In a real app, this would be API calls
      setTimeout(() => {
        // Generate mock data
        this.generateMockData();
        this.loading = false;
      }, 500);
    },
    
    // Generate report based on current selections
    generateReport() {
      this.loading = true;
      
      setTimeout(() => {
        this.loading = false;
      }, 800);
    },
    
    // Handle date range selection
    selectDateRange() {
      this.dateMenu = false;
      this.generateReport();
    },
    
    // Generate mock data for demo purposes
    generateMockData() {
      // Projects
      this.projects = [
        {
          id: '1',
          name: 'Website Redesign',
          client: 'Acme Inc',
          budgetHours: 400,
          hoursUsed: 320,
          startDate: '2023-06-01',
          endDate: '2023-12-15',
          status: 'On Track'
        },
        {
          id: '2',
          name: 'Mobile App Development',
          client: 'TechCorp',
          budgetHours: 800,
          hoursUsed: 720,
          startDate: '2023-04-15',
          endDate: '2023-11-30',
          status: 'At Risk'
        },
        {
          id: '3',
          name: 'E-commerce Platform',
          client: 'RetailCo',
          budgetHours: 600,
          hoursUsed: 650,
          startDate: '2023-05-01',
          endDate: '2023-10-31',
          status: 'Behind'
        },
        {
          id: '4',
          name: 'CRM Implementation',
          client: 'ServicePro',
          budgetHours: 350,
          hoursUsed: 200,
          startDate: '2023-07-15',
          endDate: '2023-12-31',
          status: 'On Track'
        },
        {
          id: '5',
          name: 'Brand Refresh',
          client: 'MarketingFirm',
          budgetHours: 250,
          hoursUsed: 150,
          startDate: '2023-08-01',
          endDate: '2023-11-15',
          status: 'On Track'
        }
      ];
      
      // Resources
      this.resources = [
        { id: '1', name: 'John Doe', role: 'Developer' },
        { id: '2', name: 'Jane Smith', role: 'Designer' },
        { id: '3', name: 'Mike Johnson', role: 'Project Manager' },
        { id: '4', name: 'Sarah Wilson', role: 'Developer' },
        { id: '5', name: 'Alex Brown', role: 'UX Specialist' }
      ];
      
      // Set default selected project
      this.selectedProject = this.projects[0].id;
      
      // Generate mock time entries
      this.generateMockTimeEntries();
    },
    
    // Generate mock time entries
    generateMockTimeEntries() {
      this.timeEntries = [];
      
      // Get months in the selected date range
      const months = this.getMonthsInRange();
      
      // For each project and month, generate random hours
      this.projects.forEach(project => {
        months.forEach(month => {
          // Determine how many entries to create for this month
          const daysInMonth = month.daysInMonth();
          const entriesCount = Math.floor(daysInMonth * 0.7); // About 70% of days have entries
          
          // For each entry, assign random hours and resources
          for (let i = 0; i < entriesCount; i++) {
            const day = Math.floor(Math.random() * daysInMonth) + 1;
            const date = month.clone().date(day).format('YYYY-MM-DD');
            // eslint-disable-next-line no-unused-vars
            const resourceIndex = Math.floor(Math.random() * this.resources.length);
            // eslint-disable-next-line no-unused-vars
            const resourceId = this.resources[resourceIndex].id;
            
            // Hours more likely to be higher for later months to show a trend
            const monthIndex = months.indexOf(month);
            const hoursBase = (monthIndex / months.length) * 3 + 1;
            const hours = Math.max(1, Math.min(8, Math.round(Math.random() * hoursBase * 2)));
            
            this.timeEntries.push({
              id: `${project.id}-${date}-${resourceId}`,
              projectId: project.id,
              resourceId,
              date,
              hours,
              billable: Math.random() > 0.1 // 90% of entries are billable
            });
          }
        });
      });
    },
    
    // Get array of months in the selected date range
    getMonthsInRange() {
      if (!this.dates || this.dates.length < 2) return [];
      
      const [startDate, endDate] = this.dates;
      const start = moment(startDate).startOf('month');
      const end = moment(endDate).endOf('month');
      
      const months = [];
      let current = start.clone();
      
      while (current.isSameOrBefore(end)) {
        months.push(current.clone());
        current.add(1, 'month');
      }
      
      return months;
    },
    
    // Calculate hours used per month for a project
    calculateProjectHoursUsed(projectId, months) {
      return months.map(month => {
        const monthStart = month.clone().startOf('month').format('YYYY-MM-DD');
        const monthEnd = month.clone().endOf('month').format('YYYY-MM-DD');
        
        return this.timeEntries
          .filter(entry => entry.projectId === projectId && 
                          entry.date >= monthStart && 
                          entry.date <= monthEnd)
          .reduce((total, entry) => total + entry.hours, 0);
      });
    },
    
    // Calculate billable hours for a resource
    calculateResourceBillableHours(resourceId) {
      return this.timeEntries
        .filter(entry => entry.resourceId === resourceId && 
                        entry.billable &&
                        entry.date >= this.dates[0] && 
                        entry.date <= this.dates[1])
        .reduce((total, entry) => total + entry.hours, 0);
    },
    
    // Calculate available hours for a resource
    calculateResourceAvailableHours(resourceId) {
      // eslint-disable-next-line no-unused-vars
      if (!this.dates || this.dates.length < 2) return 0;
      
      const start = moment(this.dates[0]);
      const end = moment(this.dates[1]);
      const workingDays = this.countWorkingDays(start, end);
      
      // Assuming 8 hours per working day
      return workingDays * 8;
    },
    
    // Count working days (Mon-Fri) in a date range
    countWorkingDays(start, end) {
      let count = 0;
      let current = start.clone();
      
      while (current.isSameOrBefore(end)) {
        const day = current.day();
        if (day !== 0 && day !== 6) { // Skip weekends
          count++;
        }
        current.add(1, 'day');
      }
      
      return count;
    },
    
    // Calculate monthly utilization data for chart
    calculateMonthlyUtilization() {
      const months = this.getMonthsInRange();
      const monthLabels = months.map(m => m.format('MMM YYYY'));
      
      // Calculate total billable and available hours per month
      const utilizationByMonth = months.map(month => {
        const monthStart = month.clone().startOf('month').format('YYYY-MM-DD');
        const monthEnd = month.clone().endOf('month').format('YYYY-MM-DD');
        
        const billableHours = this.timeEntries
          .filter(entry => entry.billable && 
                          entry.date >= monthStart && 
                          entry.date <= monthEnd)
          .reduce((total, entry) => total + entry.hours, 0);
        
        const workingDays = this.countWorkingDays(month.clone().startOf('month'), month.clone().endOf('month'));
        const availableHours = workingDays * 8 * this.resources.length;
        
        return Math.round((billableHours / availableHours) * 100);
      });
      
      return {
        labels: monthLabels,
        datasets: [{
          label: 'Monthly Utilization',
          data: utilizationByMonth
        }]
      };
    },
    
    // Calculate utilization data by resource
    calculateResourceUtilization() {
      return {
        labels: this.resources.map(r => r.name),
        datasets: [{
          label: 'Resource Utilization',
          data: this.utilizationTableData.map(r => r.utilization)
        }]
      };
    },
    
    // Get color for utilization
    getUtilizationColor(value) {
      if (value >= 80) return 'success';
      if (value >= 60) return 'info';
      if (value >= 40) return 'warning';
      return 'error';
    },
    
    // Get RGBA color for utilization
    getUtilizationColorRGBA(value, alpha) {
      if (value >= 80) return `rgba(76, 175, 80, ${alpha})`;
      if (value >= 60) return `rgba(33, 150, 243, ${alpha})`;
      if (value >= 40) return `rgba(255, 152, 0, ${alpha})`;
      return `rgba(244, 67, 54, ${alpha})`;
    },
    
    // Get color for project status
    getStatusColor(status) {
      switch (status) {
        case 'On Track': return 'success';
        case 'At Risk': return 'warning';
        case 'Behind': return 'error';
        default: return 'grey';
      }
    },
    
    // Get color for budget usage
    getBudgetColor(percentage) {
      if (percentage <= 70) return 'success';
      if (percentage <= 90) return 'warning';
      return 'error';
    },
    
    // Get color for budget status
    getBudgetStatusColor(percentage) {
      if (percentage <= 70) return 'success';
      if (percentage <= 90) return 'warning';
      return 'error';
    }
  }
};
</script>

<style scoped>
.reports-container {
  padding: 20px;
}

.date-picker {
  max-width: 180px;
}

.status-card {
  min-width: 120px;
  text-align: center;
}

.v-progress-linear {
  border-radius: 4px;
}

.chart-container {
  width: 100%;
  margin-bottom: 20px;
}

.simple-chart {
  width: 100%;
}

.simple-chart-item {
  margin-bottom: 12px;
}

.simple-chart-label {
  margin-bottom: 4px;
  font-size: 0.875rem;
}

.status-chart {
  height: 50px;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  min-width: 40px;
}

.status-bar.success {
  background-color: rgba(76, 175, 80, 0.8);
}

.status-bar.warning {
  background-color: rgba(255, 152, 0, 0.8);
}

.status-bar.error {
  background-color: rgba(244, 67, 54, 0.8);
}
</style>
