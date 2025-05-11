&lt;template>
  &lt;div class="resource-allocation">
    &lt;v-card>
      &lt;v-card-title>
        Resource Allocation
        &lt;v-spacer>&lt;/v-spacer>
        &lt;v-menu
          ref="dateMenu"
          v-model="dateMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          &lt;template v-slot:activator="{ on, attrs }">
            &lt;v-btn
              outlined
              color="primary"
              v-bind="attrs"
              v-on="on"
            >
              {{ formattedDateRange }}
              &lt;v-icon right>mdi-calendar&lt;/v-icon>
            &lt;/v-btn>
          &lt;/template>
          &lt;v-date-picker
            v-model="dateRange"
            range
            @input="dateMenu = false"
          >&lt;/v-date-picker>
        &lt;/v-menu>
      &lt;/v-card-title>
      
      &lt;v-card-text>
        &lt;v-row>
          &lt;v-col cols="12" md="4">
            &lt;v-select
              v-model="selectedProjects"
              :items="projects"
              item-text="name"
              item-value="id"
              label="Filter by Project"
              multiple
              chips
              small-chips
              deletable-chips
            >&lt;/v-select>
          &lt;/v-col>
          
          &lt;v-col cols="12" md="4">
            &lt;v-select
              v-model="selectedDepartments"
              :items="departments"
              label="Filter by Department"
              multiple
              chips
              small-chips
              deletable-chips
            >&lt;/v-select>
          &lt;/v-col>
          
          &lt;v-col cols="12" md="4">
            &lt;v-select
              v-model="viewMode"
              :items="viewModes"
              label="View Mode"
            >&lt;/v-select>
          &lt;/v-col>
        &lt;/v-row>
        
        &lt;v-row>
          &lt;v-col cols="12">
            &lt;v-alert
              v-if="overallocatedResources.length > 0"
              type="warning"
              outlined
            >
              {{ overallocatedResources.length }} resources are over-allocated during this period.
              &lt;v-btn
                text
                small
                color="warning"
                @click="showOverallocatedOnly = !showOverallocatedOnly"
              >
                {{ showOverallocatedOnly ? 'Show All' : 'Show Overallocated Only' }}
              &lt;/v-btn>
            &lt;/v-alert>
          &lt;/v-col>
        &lt;/v-row>
        
        &lt;v-row>
          &lt;v-col cols="12">
            &lt;div v-if="viewMode === 'calendar'" class="allocation-calendar">
              &lt;div class="calendar-header">
                &lt;div class="resource-column">Resource&lt;/div>
                &lt;div 
                  v-for="date in calendarDates" 
                  :key="date.toISOString()"
                  class="date-column"
                  :class="{ 'weekend': isWeekend(date) }"
                >
                  {{ formatDateShort(date) }}
                &lt;/div>
              &lt;/div>
              
              &lt;div 
                v-for="resource in filteredResources" 
                :key="resource.id"
                class="calendar-row"
              >
                &lt;div class="resource-column">
                  {{ resource.name }}
                  &lt;div class="resource-dept">{{ resource.department }}&lt;/div>
                &lt;/div>
                
                &lt;div 
                  v-for="date in calendarDates" 
                  :key="date.toISOString()"
                  class="date-column"
                  :class="{ 
                    'weekend': isWeekend(date),
                    'allocated': getAllocationForDate(resource, date) > 0,
                    'overallocated': getAllocationForDate(resource, date) > 8
                  }"
                >
                  &lt;div v-if="getAllocationForDate(resource, date) > 0" class="allocation-hours">
                    {{ getAllocationForDate(resource, date) }}h
                  &lt;/div>
                &lt;/div>
              &lt;/div>
            &lt;/div>
            
            &lt;div v-else-if="viewMode === 'chart'" class="allocation-chart">
              &lt;v-chart
                :option="chartOption"
                autoresize
                style="width: 100%; height: 500px;"
              />
            &lt;/div>
            
            &lt;div v-else class="allocation-table">
              &lt;v-data-table
                :headers="tableHeaders"
                :items="filteredResources"
                :items-per-page="10"
                class="elevation-1"
              >
                &lt;template v-slot:item.utilization="{ item }">
                  &lt;v-progress-linear
                    :value="getUtilizationPercentage(item)"
                    :color="getUtilizationColor(item)"
                    height="20"
                  >
                    &lt;template v-slot:default>
                      {{ getUtilizationPercentage(item) }}%
                    &lt;/template>
                  &lt;/v-progress-linear>
                &lt;/template>
                
                &lt;template v-slot:item.projects="{ item }">
                  &lt;v-chip
                    v-for="project in getResourceProjects(item)"
                    :key="project.id"
                    small
                    class="mr-1"
                  >
                    {{ project.name }}
                  &lt;/v-chip>
                &lt;/template>
                
                &lt;template v-slot:item.actions="{ item }">
                  &lt;v-btn
                    small
                    text
                    color="primary"
                    @click="showResourceDetails(item)"
                  >
                    Details
                  &lt;/v-btn>
                &lt;/template>
              &lt;/v-data-table>
            &lt;/div>
          &lt;/v-col>
        &lt;/v-row>
      &lt;/v-card-text>
    &lt;/v-card>
    
    &lt;v-dialog
      v-model="detailsDialog"
      max-width="800px"
    >
      &lt;v-card v-if="selectedResource">
        &lt;v-card-title>
          Resource Details: {{ selectedResource.name }}
          &lt;v-spacer>&lt;/v-spacer>
          &lt;v-chip>{{ selectedResource.department }}&lt;/v-chip>
        &lt;/v-card-title>
        
        &lt;v-card-text>
          &lt;v-tabs v-model="detailsTab">
            &lt;v-tab>Allocation&lt;/v-tab>
            &lt;v-tab>Projects&lt;/v-tab>
            &lt;v-tab>Timesheets&lt;/v-tab>
          &lt;/v-tabs>
          
          &lt;v-tabs-items v-model="detailsTab">
            &lt;v-tab-item>
              &lt;v-chart
                :option="resourceChartOption"
                autoresize
                style="width: 100%; height: 300px; margin-top: 20px;"
              />
            &lt;/v-tab-item>
            
            &lt;v-tab-item>
              &lt;v-data-table
                :headers="[
                  { text: 'Project', value: 'name' },
                  { text: 'Role', value: 'role' },
                  { text: 'Allocation', value: 'allocation' },
                  { text: 'Status', value: 'status' }
                ]"
                :items="getResourceProjects(selectedResource)"
                :items-per-page="5"
                class="mt-4"
              >
                &lt;template v-slot:item.allocation="{ item }">
                  {{ item.allocation }}h
                &lt;/template>
                
                &lt;template v-slot:item.status="{ item }">
                  &lt;v-chip
                    small
                    :color="getStatusColor(item.status)"
                  >
                    {{ item.status }}
                  &lt;/v-chip>
                &lt;/template>
              &lt;/v-data-table>
            &lt;/v-tab-item>
            
            &lt;v-tab-item>
              &lt;v-data-table
                :headers="[
                  { text: 'Week', value: 'week' },
                  { text: 'Hours', value: 'hours' },
                  { text: 'Utilization', value: 'utilization' }
                ]"
                :items="getResourceTimesheets(selectedResource)"
                :items-per-page="5"
                class="mt-4"
              >
                &lt;template v-slot:item.utilization="{ item }">
                  &lt;v-progress-linear
                    :value="item.utilization"
                    :color="getUtilizationColorByValue(item.utilization)"
                    height="20"
                  >
                    &lt;template v-slot:default>
                      {{ item.utilization }}%
                    &lt;/template>
                  &lt;/v-progress-linear>
                &lt;/template>
              &lt;/v-data-table>
            &lt;/v-tab-item>
          &lt;/v-tabs-items>
        &lt;/v-card-text>
        
        &lt;v-card-actions>
          &lt;v-spacer>&lt;/v-spacer>
          &lt;v-btn
            color="primary"
            text
            @click="detailsDialog = false"
          >
            Close
          &lt;/v-btn>
        &lt;/v-card-actions>
      &lt;/v-card>
    &lt;/v-dialog>
  &lt;/div>
&lt;/template>

&lt;script>
// Import ECharts
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, HeatmapChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

// Register ECharts components
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
]);

export default {
  name: 'ResourceAllocation',
  components: {
    VChart
  },
  data() {
    return {
      dateRange: [
        new Date().toISOString().substr(0, 10),
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10)
      ],
      dateMenu: false,
      selectedProjects: [],
      selectedDepartments: [],
      viewMode: 'calendar',
      viewModes: [
        { text: 'Calendar View', value: 'calendar' },
        { text: 'Chart View', value: 'chart' },
        { text: 'Table View', value: 'table' }
      ],
      showOverallocatedOnly: false,
      
      // Resource details dialog
      detailsDialog: false,
      selectedResource: null,
      detailsTab: 0,
      
      // Mock data (would come from API)
      resources: [
        { 
          id: 'user1', 
          name: 'John Smith', 
          department: 'Development',
          allocations: [
            { projectId: 'proj1', date: '2025-04-18', hours: 6 },
            { projectId: 'proj1', date: '2025-04-19', hours: 4 },
            { projectId: 'proj1', date: '2025-04-21', hours: 8 },
            { projectId: 'proj1', date: '2025-04-22', hours: 8 },
            { projectId: 'proj2', date: '2025-04-23', hours: 4 },
            { projectId: 'proj2', date: '2025-04-24', hours: 4 },
            { projectId: 'proj1', date: '2025-04-24', hours: 6 },
            { projectId: 'proj1', date: '2025-04-25', hours: 8 }
          ]
        },
        { 
          id: 'user2', 
          name: 'Jane Doe', 
          department: 'Design',
          allocations: [
            { projectId: 'proj2', date: '2025-04-18', hours: 8 },
            { projectId: 'proj2', date: '2025-04-21', hours: 8 },
            { projectId: 'proj2', date: '2025-04-22', hours: 4 },
            { projectId: 'proj1', date: '2025-04-22', hours: 6 },
            { projectId: 'proj1', date: '2025-04-23', hours: 8 },
            { projectId: 'proj1', date: '2025-04-24', hours: 8 },
            { projectId: 'proj1', date: '2025-04-25', hours: 4 }
          ]
        },
        { 
          id: 'user3', 
          name: 'Bob Johnson', 
          department: 'Development',
          allocations: [
            { projectId: 'proj1', date: '2025-04-18', hours: 4 },
            { projectId: 'proj2', date: '2025-04-18', hours: 6 },
            { projectId: 'proj2', date: '2025-04-21', hours: 10 },
            { projectId: 'proj2', date: '2025-04-22', hours: 10 },
            { projectId: 'proj2', date: '2025-04-23', hours: 8 },
            { projectId: 'proj1', date: '2025-04-24', hours: 8 },
            { projectId: 'proj1', date: '2025-04-25', hours: 8 }
          ]
        },
        { 
          id: 'user4', 
          name: 'Alice Williams', 
          department: 'QA',
          allocations: [
            { projectId: 'proj1', date: '2025-04-21', hours: 8 },
            { projectId: 'proj1', date: '2025-04-22', hours: 8 },
            { projectId: 'proj1', date: '2025-04-23', hours: 8 },
            { projectId: 'proj2', date: '2025-04-24', hours: 8 },
            { projectId: 'proj2', date: '2025-04-25', hours: 8 }
          ]
        }
      ],
      projects: [
        { id: 'proj1', name: 'Project Alpha' },
        { id: 'proj2', name: 'Project Beta' }
      ],
      departments: ['Development', 'Design', 'QA'],
      
      // Table headers
      tableHeaders: [
        { text: 'Name', value: 'name' },
        { text: 'Department', value: 'department' },
        { text: 'Utilization', value: 'utilization' },
        { text: 'Projects', value: 'projects' },
        { text: 'Actions', value: 'actions', sortable: false }
      ]
    };
  },
  
  computed: {
    formattedDateRange() {
      if (!this.dateRange || this.dateRange.length < 2) {
        return 'Select date range';
      }
      
      const start = new Date(this.dateRange[0]);
      const end = new Date(this.dateRange[1]);
      
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    },
    
    calendarDates() {
      if (!this.dateRange || this.dateRange.length < 2) {
        return [];
      }
      
      const start = new Date(this.dateRange[0]);
      const end = new Date(this.dateRange[1]);
      const dates = [];
      
      let current = new Date(start);
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      
      return dates;
    },
    
    filteredResources() {
      let resources = [...this.resources];
      
      // Filter by projects
      if (this.selectedProjects.length > 0) {
        resources = resources.filter(resource => {
          return resource.allocations.some(allocation => 
            this.selectedProjects.includes(allocation.projectId)
          );
        });
      }
      
      // Filter by departments
      if (this.selectedDepartments.length > 0) {
        resources = resources.filter(resource => 
          this.selectedDepartments.includes(resource.department)
        );
      }
      
      // Filter by overallocation
      if (this.showOverallocatedOnly) {
        resources = resources.filter(resource => 
          this.isResourceOverallocated(resource)
        );
      }
      
      return resources;
    },
    
    overallocatedResources() {
      return this.resources.filter(resource => 
        this.isResourceOverallocated(resource)
      );
    },
    
    chartOption() {
      // Prepare data for chart
      const resourceNames = this.filteredResources.map(r => r.name);
      const projectNames = this.projects.map(p => p.name);
      const series = this.projects.map(project => {
        return {
          name: project.name,
          type: 'bar',
          stack: 'total',
          emphasis: {
            focus: 'series'
          },
          data: this.filteredResources.map(resource => {
            return this.getResourceAllocationForProject(resource, project.id);
          })
        };
      });
      
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: projectNames
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: 'Hours',
          axisLabel: {
            formatter: '{value}h'
          }
        },
        yAxis: {
          type: 'category',
          data: resourceNames
        },
        series
      };
    },
    
    resourceChartOption() {
      if (!this.selectedResource) return {};
      
      // Prepare data for resource chart
      const dates = this.calendarDates.map(d => this.formatDateShort(d));
      const projectData = {};
      
      // Initialize project data
      this.projects.forEach(project => {
        projectData[project.id] = Array(dates.length).fill(0);
      });
      
      // Fill in allocation data
      this.selectedResource.allocations.forEach(allocation => {
        const dateIndex = dates.indexOf(this.formatDateShort(new Date(allocation.date)));
        if (dateIndex !== -1) {
          projectData[allocation.projectId][dateIndex] = allocation.hours;
        }
      });
      
      // Create series
      const series = this.projects.map(project => {
        return {
          name: project.name,
          type: 'bar',
          stack: 'total',
          emphasis: {
            focus: 'series'
          },
          data: projectData[project.id]
        };
      });
      
      // Add overallocation line
      series.push({
        name: 'Capacity',
        type: 'line',
        symbol: 'none',
        lineStyle: {
          type: 'dashed',
          color: '#ff4081'
        },
        data: Array(dates.length).fill(8)
      });
      
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: [...this.projects.map(p => p.name), 'Capacity']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates
        },
        yAxis: {
          type: 'value',
          name: 'Hours',
          axisLabel: {
            formatter: '{value}h'
          }
        },
        series
      };
    }
  },
  
  methods: {
    formatDateShort(date) {
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    },
    
    isWeekend(date) {
      const day = date.getDay();
      return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    },
    
    getAllocationForDate(resource, date) {
      const dateStr = date.toISOString().substr(0, 10);
      
      // Sum all allocations for this date
      return resource.allocations
        .filter(a => a.date === dateStr)
        .reduce((sum, a) => sum + a.hours, 0);
    },
    
    getResourceAllocationForProject(resource, projectId) {
      // Sum all allocations for this project within date range
      return resource.allocations
        .filter(a => {
          const date = new Date(a.date);
          const start = new Date(this.dateRange[0]);
          const end = new Date(this.dateRange[1]);
          return a.projectId === projectId && date >= start && date <= end;
        })
        .reduce((sum, a) => sum + a.hours, 0);
    },
    
    getResourceProjects(resource) {
      // Get unique projects this resource is allocated to
      const projectIds = [...new Set(resource.allocations.map(a => a.projectId))];
      
      return projectIds.map(id => {
        const project = this.projects.find(p => p.id === id);
        const allocation = this.getResourceAllocationForProject(resource, id);
        
        return {
          id,
          name: project ? project.name : 'Unknown Project',
          role: 'Member', // This would come from the API in a real app
          allocation,
          status: 'Active' // This would come from the API in a real app
        };
      });
    },
    
    getResourceTimesheets(resource) {
      // In a real app, this would fetch from the API
      // For now, generate mock data
      const weeks = [];
      let currentDate = new Date(this.dateRange[0]);
      
      while (currentDate <= new Date(this.dateRange[1])) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const hours = Math.floor(Math.random() * 20) + 20; // Random hours between 20-40
        const utilization = Math.floor(hours / 40 * 100);
        
        weeks.push({
          week: `${this.formatDateShort(weekStart)} - ${this.formatDateShort(weekEnd)}`,
          hours,
          utilization
        });
        
        currentDate.setDate(currentDate.getDate() + 7);
      }
      
      return weeks;
    },
    
    getUtilizationPercentage(resource) {
      // Calculate utilization as total allocated hours / total available hours
      const totalAllocatedHours = resource.allocations
        .filter(a => {
          const date = new Date(a.date);
          const start = new Date(this.dateRange[0]);
          const end = new Date(this.dateRange[1]);
          return date >= start && date <= end;
        })
        .reduce((sum, a) => sum + a.hours, 0);
      
      // Calculate business days in range
      let businessDays = 0;
      let currentDate = new Date(this.dateRange[0]);
      const endDate = new Date(this.dateRange[1]);
      
      while (currentDate <= endDate) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) { // Not weekend
          businessDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const totalAvailableHours = businessDays * 8; // 8 hours per business day
      
      return Math.round(totalAllocatedHours / totalAvailableHours * 100);
    },
    
    getUtilizationColor(resource) {
      const utilization = this.getUtilizationPercentage(resource);
      return this.getUtilizationColorByValue(utilization);
    },
    
    getUtilizationColorByValue(utilization) {
      if (utilization > 100) return 'error';
      if (utilization > 90) return 'warning';
      if (utilization > 70) return 'success';
      return 'info';
    },
    
    getStatusColor(status) {
      switch (status) {
        case 'Active': return 'success';
        case 'On Hold': return 'warning';
        case 'Completed': return 'info';
        case 'Cancelled': return 'error';
        default: return 'grey';
      }
    },
    
    isResourceOverallocated(resource) {
      // Check if resource has any day with more than 8 hours allocated
      return this.calendarDates.some(date => {
        return this.getAllocationForDate(resource, date) > 8;
      });
    },
    
    showResourceDetails(resource) {
      this.selectedResource = resource;
      this.detailsDialog = true;
    }
  }
};
&lt;/script>

&lt;style scoped>
.allocation-calendar {
  overflow-x: auto;
}

.calendar-header, .calendar-row {
  display: flex;
  min-width: 100%;
}

.resource-column {
  min-width: 150px;
  padding: 8px;
  font-weight: bold;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  left: 0;
  background-color: white;
  z-index: 1;
}

.resource-dept {
  font-size: 0.8rem;
  font-weight: normal;
  color: #757575;
}

.date-column {
  min-width: 60px;
  padding: 8px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  border-left: 1px solid #e0e0e0;
}

.calendar-header .date-column {
  font-weight: bold;
}

.weekend {
  background-color: #f5f5f5;
}

.allocated {
  background-color: #e3f2fd;
}

.overallocated {
  background-color: #ffebee;
}

.allocation-hours {
  font-weight: bold;
}
&lt;/style>
