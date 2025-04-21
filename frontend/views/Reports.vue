<!-- eslint-disable -->
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
          
          <!-- Budget Forecast Report -->
          <v-tab-item key="budget-forecast">
            <div class="d-flex align-center mb-4">
              <v-select
                v-model="forecastView"
                :items="forecastViewOptions"
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
            
            <div v-else>
              <!-- Summary Cards -->
              <v-row class="mb-6">
                <v-col cols="12" md="4">
                  <v-card outlined class="pa-4 text-center">
                    <div class="text-subtitle-1">Total Forecast</div>
                    <div class="text-h4 primary--text">${{ totalForecast.toLocaleString() }}</div>
                    <div class="caption">Next {{ forecastMonths.length }} months</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card outlined class="pa-4 text-center">
                    <div class="text-subtitle-1">Monthly Average</div>
                    <div class="text-h4 info--text">${{ monthlyAverage.toLocaleString() }}</div>
                    <div class="caption">Per month</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card outlined class="pa-4 text-center">
                    <div class="text-subtitle-1">Projects</div>
                    <div class="text-h4 success--text">{{ forecastData.length }}</div>
                    <div class="caption">With scheduled resources</div>
                  </v-card>
                </v-col>
              </v-row>
              
              <!-- Monthly distribution visualization -->
              <v-card outlined class="mb-6 pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-subtitle-1">Monthly Forecast Distribution</div>
                  <v-chip color="primary">${{ totalForecast.toLocaleString() }} Total</v-chip>
                </div>
                
                <div class="simple-chart">
                  <div v-for="(month, index) in forecastMonths" :key="index" class="simple-chart-item">
                    <div class="d-flex justify-space-between">
                      <div class="simple-chart-label">{{ month }}</div>
                      <div class="caption">${{ forecastMonthlyTotals[index].toLocaleString() }}</div>
                    </div>
                    <v-progress-linear
                      :value="(forecastMonthlyTotals[index] / maxMonthlyForecast) * 100"
                      height="30"
                      color="primary"
                    >
                      <template v-slot:default>
                        <span class="white--text">${{ forecastMonthlyTotals[index].toLocaleString() }}</span>
                      </template>
                    </v-progress-linear>
                  </div>
                </div>
              </v-card>
              
              <!-- Project breakdown -->
              <v-card v-if="forecastView === 'project'" outlined class="mb-6 pa-4">
                <div class="text-subtitle-1 mb-4">Project Breakdown</div>
                <div class="simple-chart">
                  <div v-for="(project, index) in forecastData" :key="index" class="simple-chart-item">
                    <div class="d-flex justify-space-between">
                      <div class="simple-chart-label">{{ project.name }}</div>
                      <div class="caption">${{ project.totalForecast.toLocaleString() }}</div>
                    </div>
                    <v-progress-linear
                      :value="(project.totalForecast / totalForecast) * 100"
                      height="30"
                      :color="getRandomColor(index)"
                    >
                      <template v-slot:default>
                        <span class="white--text">${{ project.totalForecast.toLocaleString() }}</span>
                      </template>
                    </v-progress-linear>
                  </div>
                </div>
              </v-card>
              
              <!-- Detailed forecast table -->
              <v-card outlined>
                <v-card-title>
                  <span v-if="forecastView === 'project'">Project Monthly Forecast</span>
                  <span v-else>Resource Monthly Forecast</span>
                  <v-spacer></v-spacer>
                  <v-text-field
                    v-model="forecastSearch"
                    append-icon="mdi-magnify"
                    label="Search"
                    single-line
                    hide-details
                    class="mx-4"
                    style="max-width: 300px;"
                  ></v-text-field>
                </v-card-title>
                
                <!-- Project view -->
                <v-data-table
                  v-if="forecastView === 'project'"
                  :headers="forecastProjectHeaders"
                  :items="forecastData"
                  :search="forecastSearch"
                  :items-per-page="10"
                  class="elevation-0"
                >
                  <template v-slot:item.resources="{ item }">
                    <v-chip 
                      v-for="(count, index) in item.resourceCounts" 
                      :key="index"
                      small
                      class="mr-1"
                    >
                      {{ count.role }}: {{ count.count }}
                    </v-chip>
                  </template>
                  <template v-slot:item.totalForecast="{ item }">
                    <strong>${{ item.totalForecast.toLocaleString() }}</strong>
                  </template>
                  <template v-slot:item.monthlyAverage="{ item }">
                    ${{ item.monthlyAverage.toLocaleString() }}
                  </template>
                </v-data-table>
                
                <!-- Resource view -->
                <v-data-table
                  v-else
                  :headers="forecastResourceHeaders"
                  :items="resourceForecastData"
                  :search="forecastSearch"
                  :items-per-page="10"
                  class="elevation-0"
                >
                  <template v-slot:item.rate="{ item }">
                    ${{ item.rate }}/hr
                  </template>
                  <template v-slot:item.utilizationRate="{ item }">
                    <v-progress-linear
                      :value="item.utilizationRate"
                      height="20"
                      :color="getUtilizationColor(item.utilizationRate)"
                    >
                      <template v-slot:default>
                        <strong>{{ item.utilizationRate }}%</strong>
                      </template>
                    </v-progress-linear>
                  </template>
                  <template v-slot:item.totalForecast="{ item }">
                    <strong>${{ item.totalForecast.toLocaleString() }}</strong>
                  </template>
                </v-data-table>
              </v-card>
              
              <!-- Monthly Detailed View -->
              <v-expansion-panels class="mt-6">
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    Monthly Detailed Breakdown
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-data-table
                      :headers="forecastMonthlyHeaders"
                      :items="forecastMonthlyData"
                      :items-per-page="20"
                      class="elevation-1"
                    >
                      <template v-slot:item.forecast="{ item }">
                        <strong>${{ item.forecast.toLocaleString() }}</strong>
                      </template>
                    </v-data-table>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
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
        moment().add(6, 'months').endOf('month').format('YYYY-MM-DD')
      ],
      
      selectedProject: null,
      utilizationView: 'monthly',
      forecastView: 'project',
      forecastSearch: '',
      
      // Sample data (would come from API)
      projects: [],
      resources: [],
      timeEntries: [],
      scheduledWork: [], // For forecast calculations
      
      // Page config
      tabs: [
        { label: 'Project Budget Burndown', value: 'project-budget' },
        { label: 'Resource Utilization', value: 'resource-utilization' },
        { label: 'Project Status Overview', value: 'project-status' },
        { label: 'Budget Forecast', value: 'budget-forecast' }
      ],
      utilizationViewOptions: [
        { text: 'Monthly Overview', value: 'monthly' },
        { text: 'By Resource', value: 'resource' }
      ],
      forecastViewOptions: [
        { text: 'By Project', value: 'project' },
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
      ],
      forecastProjectHeaders: [
        { text: 'Project', value: 'name' },
        { text: 'Client', value: 'client' },
        { text: 'Resources', value: 'resources' },
        { text: 'Monthly Average', value: 'monthlyAverage' },
        { text: 'Total Forecast', value: 'totalForecast' }
      ],
      forecastResourceHeaders: [
        { text: 'Resource', value: 'name' },
        { text: 'Role', value: 'role' },
        { text: 'Rate', value: 'rate' },
        { text: 'Utilization', value: 'utilizationRate' },
        { text: 'Total Forecast', value: 'totalForecast' }
      ],
      forecastMonthlyHeaders: [
        { text: 'Month', value: 'month' },
        { text: 'Project', value: 'project' },
        { text: 'Resource', value: 'resource' },
        { text: 'Planned Hours', value: 'hours' },
        { text: 'Rate', value: 'rate' },
        { text: 'Forecast', value: 'forecast' }
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
    },
    
    // Get forecast months
    forecastMonths() {
      if (!this.dates || this.dates.length < 2) return [];
      
      const start = moment(this.dates[0]).startOf('month');
      const end = moment(this.dates[1]).endOf('month');
      const months = [];
      let current = start.clone();
      
      while (current.isSameOrBefore(end, 'month')) {
        months.push(current.format('MMM YYYY'));
        current.add(1, 'month');
      }
      
      return months;
    },
    
    // Project forecast data
    forecastData() {
      const projects = this.projects.map(project => {
        const monthlyData = this.calculateProjectMonthlyForecast(project.id);
        const totalForecast = monthlyData.reduce((sum, month) => sum + month, 0);
        const monthlyAverage = totalForecast / Math.max(1, this.forecastMonths.length);
        
        // Count resources per role
        const resourceCounts = this.getProjectResourceCounts(project.id);
        
        return {
          id: project.id,
          name: project.name,
          client: project.client,
          resourceCounts,
          monthlyForecast: monthlyData,
          monthlyAverage: Math.round(monthlyAverage),
          totalForecast: Math.round(totalForecast)
        };
      });
      
      return projects.sort((a, b) => b.totalForecast - a.totalForecast);
    },
    
    // Resource forecast data
    resourceForecastData() {
      return this.resources.map(resource => {
        const monthlyData = this.calculateResourceMonthlyForecast(resource.id);
        const totalForecast = monthlyData.reduce((sum, month) => sum + month, 0);
        const utilizationRate = this.getResourceUtilizationRate(resource.id);
        
        return {
          id: resource.id,
          name: resource.name,
          role: resource.role,
          rate: this.getResourceRate(resource.id),
          utilizationRate,
          monthlyForecast: monthlyData,
          totalForecast: Math.round(totalForecast)
        };
      }).sort((a, b) => b.totalForecast - a.totalForecast);
    },
    
    // Monthly detailed data
    forecastMonthlyData() {
      const data = [];
      
      this.forecastMonths.forEach((month, monthIndex) => {
        this.projects.forEach(project => {
          const projectResources = this.getProjectResources(project.id);
          
          projectResources.forEach(resource => {
            const hours = this.getResourceMonthlyHours(resource.id, project.id, monthIndex);
            const rate = this.getResourceRate(resource.id);
            const forecast = hours * rate;
            
            if (hours > 0) {
              data.push({
                month,
                project: project.name,
                resource: resource.name,
                hours,
                rate: `$${rate}/hr`,
                forecast
              });
            }
          });
        });
      });
      
      return data;
    },
    
    // Calculate total forecast
    totalForecast() {
      return this.forecastData.reduce((sum, project) => sum + project.totalForecast, 0);
    },
    
    // Calculate monthly average
    monthlyAverage() {
      return Math.round(this.totalForecast / Math.max(1, this.forecastMonths.length));
    },
    
    // Monthly totals
    forecastMonthlyTotals() {
      const totals = Array(this.forecastMonths.length).fill(0);
      
      this.forecastData.forEach(project => {
        project.monthlyForecast.forEach((amount, index) => {
          totals[index] += amount;
        });
      });
      
      return totals.map(total => Math.round(total));
    },
    
    // Max monthly forecast
    maxMonthlyForecast() {
      return Math.max(...this.forecastMonthlyTotals, 1);
    }
  },
  
  mounted() {
    this.fetchData();
    // Make sure initial tab is seen as active
    this.activeTab = 0;
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
      
      // Simulate API delay
      setTimeout(() => {
        // For mock data, regenerate data to simulate refreshing the report
        this.generateMockTimeEntries();
        this.generateMockScheduledWork();
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
      
      // Resources with rates
      this.resources = [
        { id: '1', name: 'John Doe', role: 'Developer', rate: 125 },
        { id: '2', name: 'Jane Smith', role: 'Designer', rate: 115 },
        { id: '3', name: 'Mike Johnson', role: 'Project Manager', rate: 150 },
        { id: '4', name: 'Sarah Wilson', role: 'Developer', rate: 130 },
        { id: '5', name: 'Alex Brown', role: 'UX Specialist', rate: 120 }
      ];
      
      // Set default selected project
      this.selectedProject = this.projects[0].id;
      
      // Generate mock time entries
      this.generateMockTimeEntries();
      
      // Generate mock scheduled work for forecasting
      this.generateMockScheduledWork();
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
    
    // Generate mock scheduled work for forecasting
    generateMockScheduledWork() {
      this.scheduledWork = [];
      
      // Generate future scheduled work
      const months = this.getForecastMonths();
      
      // For each project and month, generate scheduled work
      this.projects.forEach(project => {
        // Determine which resources work on this project
        const projectResources = this.resources.filter(() => Math.random() > 0.3);
        
        months.forEach((month, monthIndex) => {
          projectResources.forEach(resource => {
            // Base hours for this resource (with some variation between resources)
            let baseHours = 0;
            
            // Only schedule if project is still active in this month
            const projectStart = moment(project.startDate);
            const projectEnd = moment(project.endDate);
            const monthDate = moment(month, 'MMM YYYY');
            
            if (monthDate.isBetween(projectStart, projectEnd, 'month', '[]')) {
              // Calculate base hours - more at the beginning and middle of projects
              const totalMonths = projectEnd.diff(projectStart, 'months') + 1;
              const currentMonth = monthDate.diff(projectStart, 'months') + 1;
              const projectProgress = currentMonth / totalMonths;
              
              // Project curve - more hours in the middle of the project
              const projectCurve = 1 - Math.abs(projectProgress - 0.5) * 2;
              baseHours = 20 + Math.round(100 * projectCurve);
              
              // Add some randomness
              const variance = Math.round(baseHours * 0.3 * (Math.random() - 0.5));
              baseHours = Math.max(0, baseHours + variance);
              
              // Add to scheduled work
              if (baseHours > 0) {
                this.scheduledWork.push({
                  id: `${project.id}-${resource.id}-${monthIndex}`,
                  projectId: project.id,
                  resourceId: resource.id,
                  month: monthIndex,
                  hours: baseHours
                });
              }
            }
          });
        });
      });
    },
    
    // Get forecast months as momentjs objects
    getForecastMonths() {
      if (!this.dates || this.dates.length < 2) return [];
      
      const start = moment(this.dates[0]).startOf('month');
      const end = moment(this.dates[1]).endOf('month');
      const months = [];
      let current = start.clone();
      
      while (current.isSameOrBefore(end, 'month')) {
        months.push(current.clone());
        current.add(1, 'month');
      }
      
      return months;
    },
    
    // Calculate forecast for a project by month
    calculateProjectMonthlyForecast(projectId) {
      const monthlyForecast = Array(this.forecastMonths.length).fill(0);
      
      this.scheduledWork
        .filter(work => work.projectId === projectId)
        .forEach(work => {
          const resourceRate = this.getResourceRate(work.resourceId);
          const forecast = work.hours * resourceRate;
          monthlyForecast[work.month] += forecast;
        });
      
      return monthlyForecast;
    },
    
    // Calculate forecast for a resource by month
    calculateResourceMonthlyForecast(resourceId) {
      const monthlyForecast = Array(this.forecastMonths.length).fill(0);
      
      this.scheduledWork
        .filter(work => work.resourceId === resourceId)
        .forEach(work => {
          const resourceRate = this.getResourceRate(resourceId);
          const forecast = work.hours * resourceRate;
          monthlyForecast[work.month] += forecast;
        });
      
      return monthlyForecast;
    },
    
    // Get resource rate
    getResourceRate(resourceId) {
      const resource = this.resources.find(r => r.id === resourceId);
      return resource ? resource.rate : 0;
    },
    
    // Get project resources
    getProjectResources(projectId) {
      const resourceIds = [...new Set(
        this.scheduledWork
          .filter(work => work.projectId === projectId)
          .map(work => work.resourceId)
      )];
      
      return resourceIds.map(id => this.resources.find(r => r.id === id));
    },
    
    // Get resource hours for a specific month and project
    getResourceMonthlyHours(resourceId, projectId, month) {
      const work = this.scheduledWork.find(
        w => w.resourceId === resourceId && w.projectId === projectId && w.month === month
      );
      
      return work ? work.hours : 0;
    },
    
    // Get resource utilization rate
    getResourceUtilizationRate(resourceId) {
      const totalPlannedHours = this.scheduledWork
        .filter(work => work.resourceId === resourceId)
        .reduce((sum, work) => sum + work.hours, 0);
      
      // Calculate total available hours (assumes 160 hours per month)
      const availableHours = this.forecastMonths.length * 160;
      
      return Math.min(100, Math.round((totalPlannedHours / availableHours) * 100));
    },
    
    // Count resources per role for a project
    getProjectResourceCounts(projectId) {
      const resourceIds = [...new Set(
        this.scheduledWork
          .filter(work => work.projectId === projectId)
          .map(work => work.resourceId)
      )];
      
      const resources = resourceIds.map(id => this.resources.find(r => r.id === id));
      
      // Count by role
      const roleCounts = {};
      resources.forEach(resource => {
        if (!roleCounts[resource.role]) {
          roleCounts[resource.role] = 0;
        }
        roleCounts[resource.role]++;
      });
      
      // Convert to array
      return Object.keys(roleCounts).map(role => ({
        role,
        count: roleCounts[role]
      }));
    },
    
    // Get a random color for charts
    getRandomColor(index) {
      const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];
      return colors[index % colors.length];
    },
    
    // Get color for utilization
    getUtilizationColor(value) {
      if (value >= 80) return 'success';
      if (value >= 60) return 'info';
      if (value >= 40) return 'warning';
      return 'error';
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
    },
    
    // Get array of months in the selected date range for past data
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
