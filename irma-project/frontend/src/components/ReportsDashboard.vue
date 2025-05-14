&lt;template>
  &lt;div class="reports-dashboard">
    &lt;v-card>
      &lt;v-card-title>
        Reports &amp; Analytics
        &lt;v-spacer>&lt;/v-spacer>
        &lt;v-btn
          color="primary"
          @click="createReportDialog = true"
        >
          &lt;v-icon left>mdi-plus&lt;/v-icon>
          New Report
        &lt;/v-btn>
      &lt;/v-card-title>
      
      &lt;v-card-text>
        &lt;v-tabs v-model="activeTab">
          &lt;v-tab>My Reports&lt;/v-tab>
          &lt;v-tab>Templates&lt;/v-tab>
          &lt;v-tab>Scheduled Reports&lt;/v-tab>
          &lt;v-tab>Analytics Dashboard&lt;/v-tab>
        &lt;/v-tabs>
        
        &lt;v-tabs-items v-model="activeTab">
          <!-- My Reports Tab -->
          &lt;v-tab-item>
            &lt;v-row>
              &lt;v-col cols="12">
                &lt;v-data-table
                  :headers="reportHeaders"
                  :items="myReports"
                  :items-per-page="10"
                  class="elevation-1"
                >
                  &lt;template v-slot:item.type="{ item }">
                    &lt;v-chip small :color="getReportTypeColor(item.type)">
                      {{ item.type }}
                    &lt;/v-chip>
                  &lt;/template>
                  
                  &lt;template v-slot:item.lastRunAt="{ item }">
                    {{ item.lastRunAt ? formatDateTime(item.lastRunAt) : 'Never' }}
                  &lt;/template>
                  
                  &lt;template v-slot:item.actions="{ item }">
                    &lt;v-btn
                      small
                      icon
                      color="primary"
                      @click="runReport(item)"
                      title="Run Report"
                    >
                      &lt;v-icon>mdi-play&lt;/v-icon>
                    &lt;/v-btn>
                    
                    &lt;v-btn
                      small
                      icon
                      color="info"
                      @click="editReport(item)"
                      title="Edit Report"
                    >
                      &lt;v-icon>mdi-pencil&lt;/v-icon>
                    &lt;/v-btn>
                    
                    &lt;v-btn
                      small
                      icon
                      color="error"
                      @click="deleteReport(item)"
                      title="Delete Report"
                    >
                      &lt;v-icon>mdi-delete&lt;/v-icon>
                    &lt;/v-btn>
                  &lt;/template>
                &lt;/v-data-table>
              &lt;/v-col>
            &lt;/v-row>
          &lt;/v-tab-item>
          
          <!-- Templates Tab -->
          &lt;v-tab-item>
            &lt;v-row>
              &lt;v-col cols="12">
                &lt;v-data-table
                  :headers="templateHeaders"
                  :items="reportTemplates"
                  :items-per-page="10"
                  class="elevation-1"
                >
                  &lt;template v-slot:item.type="{ item }">
                    &lt;v-chip small :color="getReportTypeColor(item.type)">
                      {{ item.type }}
                    &lt;/v-chip>
                  &lt;/template>
                  
                  &lt;template v-slot:item.actions="{ item }">
                    &lt;v-btn
                      small
                      icon
                      color="primary"
                      @click="useTemplate(item)"
                      title="Use Template"
                    >
                      &lt;v-icon>mdi-content-copy&lt;/v-icon>
                    &lt;/v-btn>
                    
                    &lt;v-btn
                      small
                      icon
                      color="info"
                      @click="editReport(item)"
                      title="Edit Template"
                      v-if="isManager"
                    >
                      &lt;v-icon>mdi-pencil&lt;/v-icon>
                    &lt;/v-btn>
                    
                    &lt;v-btn
                      small
                      icon
                      color="error"
                      @click="deleteReport(item)"
                      title="Delete Template"
                      v-if="isManager"
                    >
                      &lt;v-icon>mdi-delete&lt;/v-icon>
                    &lt;/v-btn>
                  &lt;/template>
                &lt;/v-data-table>
              &lt;/v-col>
            &lt;/v-row>
          &lt;/v-tab-item>
          
          <!-- Scheduled Reports Tab -->
          &lt;v-tab-item>
            &lt;v-row>
              &lt;v-col cols="12">
                &lt;v-data-table
                  :headers="scheduledHeaders"
                  :items="scheduledReports"
                  :items-per-page="10"
                  class="elevation-1"
                >
                  &lt;template v-slot:item.type="{ item }">
                    &lt;v-chip small :color="getReportTypeColor(item.type)">
                      {{ item.type }}
                    &lt;/v-chip>
                  &lt;/template>
                  
                  &lt;template v-slot:item.schedule.frequency="{ item }">
                    {{ item.schedule.frequency }}
                  &lt;/template>
                  
                  &lt;template v-slot:item.lastRunAt="{ item }">
                    {{ item.lastRunAt ? formatDateTime(item.lastRunAt) : 'Never' }}
                  &lt;/template>
                  
                  &lt;template v-slot:item.actions="{ item }">
                    &lt;v-btn
                      small
                      icon
                      color="primary"
                      @click="runReport(item)"
                      title="Run Report"
                    >
                      &lt;v-icon>mdi-play&lt;/v-icon>
                    &lt;/v-btn>
                    
                    &lt;v-btn
                      small
                      icon
                      color="info"
                      @click="editSchedule(item)"
                      title="Edit Schedule"
                    >
                      &lt;v-icon>mdi-calendar-edit&lt;/v-icon>
                    &lt;/v-btn>
                    
                    &lt;v-btn
                      small
                      icon
                      color="warning"
                      @click="toggleSchedule(item)"
                      :title="item.isScheduled ? 'Pause Schedule' : 'Resume Schedule'"
                    >
                      &lt;v-icon>{{ item.isScheduled ? 'mdi-pause' : 'mdi-play' }}&lt;/v-icon>
                    &lt;/v-btn>
                  &lt;/template>
                &lt;/v-data-table>
              &lt;/v-col>
            &lt;/v-row>
          &lt;/v-tab-item>
          
          <!-- Analytics Dashboard Tab -->
          &lt;v-tab-item>
            &lt;v-row>
              &lt;v-col cols="12" md="6">
                &lt;v-card outlined class="mb-4">
                  &lt;v-card-title>Time Tracking Overview&lt;/v-card-title>
                  &lt;v-card-text>
                    &lt;v-chart
                      :option="timeTrackingChartOption"
                      autoresize
                      style="width: 100%; height: 300px;"
                    />
                  &lt;/v-card-text>
                &lt;/v-card>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-card outlined class="mb-4">
                  &lt;v-card-title>Budget Utilization&lt;/v-card-title>
                  &lt;v-card-text>
                    &lt;v-chart
                      :option="budgetChartOption"
                      autoresize
                      style="width: 100%; height: 300px;"
                    />
                  &lt;/v-card-text>
                &lt;/v-card>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-card outlined class="mb-4">
                  &lt;v-card-title>Resource Utilization&lt;/v-card-title>
                  &lt;v-card-text>
                    &lt;v-chart
                      :option="resourceChartOption"
                      autoresize
                      style="width: 100%; height: 300px;"
                    />
                  &lt;/v-card-text>
                &lt;/v-card>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-card outlined class="mb-4">
                  &lt;v-card-title>Invoice Status&lt;/v-card-title>
                  &lt;v-card-text>
                    &lt;v-chart
                      :option="invoiceChartOption"
                      autoresize
                      style="width: 100%; height: 300px;"
                    />
                  &lt;/v-card-text>
                &lt;/v-card>
              &lt;/v-col>
            &lt;/v-row>
            
            &lt;v-row>
              &lt;v-col cols="12">
                &lt;v-card outlined>
                  &lt;v-card-title>
                    Key Performance Indicators
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
                          {{ dateRangeText }}
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
                      &lt;v-col cols="12" md="3">
                        &lt;v-card outlined class="kpi-card">
                          &lt;v-card-text class="text-center">
                            &lt;div class="text-h4 primary--text">{{ kpis.totalHours }}&lt;/div>
                            &lt;div class="text-subtitle-1">Total Hours Logged&lt;/div>
                            &lt;div class="text-caption" :class="kpis.hoursChange >= 0 ? 'success--text' : 'error--text'">
                              {{ kpis.hoursChange >= 0 ? '+' : '' }}{{ kpis.hoursChange }}% from previous period
                            &lt;/div>
                          &lt;/v-card-text>
                        &lt;/v-card>
                      &lt;/v-col>
                      
                      &lt;v-col cols="12" md="3">
                        &lt;v-card outlined class="kpi-card">
                          &lt;v-card-text class="text-center">
                            &lt;div class="text-h4 success--text">${{ kpis.totalRevenue.toLocaleString() }}&lt;/div>
                            &lt;div class="text-subtitle-1">Total Revenue&lt;/div>
                            &lt;div class="text-caption" :class="kpis.revenueChange >= 0 ? 'success--text' : 'error--text'">
                              {{ kpis.revenueChange >= 0 ? '+' : '' }}{{ kpis.revenueChange }}% from previous period
                            &lt;/div>
                          &lt;/v-card-text>
                        &lt;/v-card>
                      &lt;/v-col>
                      
                      &lt;v-col cols="12" md="3">
                        &lt;v-card outlined class="kpi-card">
                          &lt;v-card-text class="text-center">
                            &lt;div class="text-h4 info--text">{{ kpis.utilization }}%&lt;/div>
                            &lt;div class="text-subtitle-1">Resource Utilization&lt;/div>
                            &lt;div class="text-caption" :class="kpis.utilizationChange >= 0 ? 'success--text' : 'error--text'">
                              {{ kpis.utilizationChange >= 0 ? '+' : '' }}{{ kpis.utilizationChange }}% from previous period
                            &lt;/div>
                          &lt;/v-card-text>
                        &lt;/v-card>
                      &lt;/v-col>
                      
                      &lt;v-col cols="12" md="3">
                        &lt;v-card outlined class="kpi-card">
                          &lt;v-card-text class="text-center">
                            &lt;div class="text-h4 warning--text">{{ kpis.projectCompletion }}%&lt;/div>
                            &lt;div class="text-subtitle-1">Project Completion&lt;/div>
                            &lt;div class="text-caption" :class="kpis.completionChange >= 0 ? 'success--text' : 'error--text'">
                              {{ kpis.completionChange >= 0 ? '+' : '' }}{{ kpis.completionChange }}% from previous period
                            &lt;/div>
                          &lt;/v-card-text>
                        &lt;/v-card>
                      &lt;/v-col>
                    &lt;/v-row>
                  &lt;/v-card-text>
                &lt;/v-card>
              &lt;/v-col>
            &lt;/v-row>
          &lt;/v-tab-item>
        &lt;/v-tabs-items>
      &lt;/v-card-text>
    &lt;/v-card>
    
    <!-- Create/Edit Report Dialog -->
    &lt;v-dialog
      v-model="createReportDialog"
      max-width="800px"
    >
      &lt;v-card>
        &lt;v-card-title>
          {{ editMode ? 'Edit Report' : 'Create New Report' }}
        &lt;/v-card-title>
        
        &lt;v-card-text>
          &lt;v-form ref="reportForm">
            &lt;v-row>
              &lt;v-col cols="12" md="6">
                &lt;v-text-field
                  v-model="reportForm.name"
                  label="Report Name"
                  required
                  :rules="[v => !!v || 'Name is required']"
                >&lt;/v-text-field>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6">
                &lt;v-select
                  v-model="reportForm.type"
                  :items="reportTypes"
                  label="Report Type"
                  required
                  :rules="[v => !!v || 'Type is required']"
                >&lt;/v-select>
              &lt;/v-col>
              
              &lt;v-col cols="12">
                &lt;v-textarea
                  v-model="reportForm.description"
                  label="Description"
                  rows="2"
                >&lt;/v-textarea>
              &lt;/v-col>
            &lt;/v-row>
            
            &lt;v-divider class="my-4">&lt;/v-divider>
            
            &lt;v-row>
              &lt;v-col cols="12">
                &lt;div class="text-subtitle-1 mb-2">Report Parameters&lt;/div>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6" v-if="['Time', 'Budget', 'Project', 'Resource'].includes(reportForm.type)">
                &lt;v-menu
                  ref="startDateMenu"
                  v-model="startDateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  &lt;template v-slot:activator="{ on, attrs }">
                    &lt;v-text-field
                      v-model="reportForm.parameters.startDate"
                      label="Start Date"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                    >&lt;/v-text-field>
                  &lt;/template>
                  &lt;v-date-picker
                    v-model="reportForm.parameters.startDate"
                    @input="startDateMenu = false"
                  >&lt;/v-date-picker>
                &lt;/v-menu>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6" v-if="['Time', 'Budget', 'Project', 'Resource'].includes(reportForm.type)">
                &lt;v-menu
                  ref="endDateMenu"
                  v-model="endDateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  &lt;template v-slot:activator="{ on, attrs }">
                    &lt;v-text-field
                      v-model="reportForm.parameters.endDate"
                      label="End Date"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                    >&lt;/v-text-field>
                  &lt;/template>
                  &lt;v-date-picker
                    v-model="reportForm.parameters.endDate"
                    @input="endDateMenu = false"
                  >&lt;/v-date-picker>
                &lt;/v-menu>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6" v-if="['Time', 'Budget', 'Project', 'Client'].includes(reportForm.type)">
                &lt;v-select
                  v-model="reportForm.parameters.clientId"
                  :items="clients"
                  item-text="name"
                  item-value="id"
                  label="Client"
                  clearable
                >&lt;/v-select>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6" v-if="['Time', 'Resource'].includes(reportForm.type)">
                &lt;v-select
                  v-model="reportForm.parameters.projectId"
                  :items="projects"
                  item-text="name"
                  item-value="id"
                  label="Project"
                  clearable
                >&lt;/v-select>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6" v-if="['Time', 'Resource'].includes(reportForm.type)">
                &lt;v-select
                  v-model="reportForm.parameters.userId"
                  :items="users"
                  item-text="name"
                  item-value="id"
                  label="User"
                  clearable
                >&lt;/v-select>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6" v-if="['Project'].includes(reportForm.type)">
                &lt;v-select
                  v-model="reportForm.parameters.status"
                  :items="projectStatuses"
                  label="Project Status"
                  clearable
                >&lt;/v-select>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="6" v-if="['Client', 'Project', 'Resource'].includes(reportForm.type)">
                &lt;v-switch
                  v-model="reportForm.parameters.includeInactive"
                  label="Include Inactive"
                >&lt;/v-switch>
              &lt;/v-col>
            &lt;/v-row>
            
            &lt;v-divider class="my-4">&lt;/v-divider>
            
            &lt;v-row>
              &lt;v-col cols="12">
                &lt;div class="text-subtitle-1 mb-2">Report Format&lt;/div>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="4">
                &lt;v-select
                  v-model="reportForm.format"
                  :items="reportFormats"
                  label="Format"
                >&lt;/v-select>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="4" v-if="reportForm.format !== 'Table'">
                &lt;v-select
                  v-model="reportForm.chartType"
                  :items="chartTypes"
                  label="Chart Type"
                >&lt;/v-select>
              &lt;/v-col>
              
              &lt;v-col cols="12" md="4">
                &lt;v-switch
                  v-model="reportForm.isTemplate"
                  label="Save as Template"
                >&lt;/v-switch>
              &lt;/v-col>
            &lt;/v-row>
            
            &lt;v-divider class="my-4">&lt;/v-divider>
            
            &lt;v-row>
              &lt;v-col cols="12">
                &lt;v-switch
                  v-model="reportForm.isScheduled"
                  label="Schedule Report"
                >&lt;/v-switch>
              &lt;/v-col>
              
              &lt;template v-if="reportForm.isScheduled">
                &lt;v-col cols="12" md="4">
                  &lt;v-select
                    v-model="reportForm.schedule.frequency"
                    :items="scheduleFrequencies"
                    label="Frequency"
                  >&lt;/v-select>
                &lt;/v-col>
                
                &lt;v-col cols="12" md="4" v-if="reportForm.schedule.frequency === 'Weekly'">
                  &lt;v-select
                    v-model="reportForm.schedule.dayOfWeek"
                    :items="daysOfWeek"
                    label="Day of Week"
                  >&lt;/v-select>
                &lt;/v-col>
                
                &lt;v-col cols="12" md="4" v-if="reportForm.schedule.frequency === 'Monthly'">
                  &lt;v-select
                    v-model="reportForm.schedule.dayOfMonth"
                    :items="daysOfMonth"
                    label="Day of Month"
                  >&lt;/v-select>
                &lt;/v-col>
                
                &lt;v-col cols="12">
                  &lt;v-combobox
                    v-model="reportForm.schedule.recipients"
                    label="Recipients"
                    chips
                    multiple
                    hint="Enter email addresses"
                    persistent-hint
                  >&lt;/v-combobox>
                &lt;/v-col>
              &lt;/template>
            &lt;/v-row>
          &lt;/v-form>
        &lt;/v-card-text>
        
        &lt;v-card-actions>
          &lt;v-spacer>&lt;/v-spacer>
          &lt;v-btn
            color="blue darken-1"
            text
            @click="createReportDialog = false"
          >
            Cancel
          &lt;/v-btn>
          &lt;v-btn
            color="blue darken-1"
            text
            @click="saveReport"
          >
            Save
          &lt;/v-btn>
        &lt;/v-card-actions>
      &lt;/v-card>
    &lt;/v-dialog>
    
    <!-- Report Results Dialog -->
    &lt;v-dialog
      v-model="reportResultsDialog"
      max-width="1000px"
    >
      &lt;v-card v-if="currentReport">
        &lt;v-card-title>
          {{ currentReport.name }}
          &lt;v-spacer>&lt;/v-spacer>
          &lt;v-btn
            icon
            @click="exportReport"
            title="Export"
          >
            &lt;v-icon>mdi-download&lt;/v-icon>
          &lt;/v-btn>
        &lt;/v-card-title>
        
        &lt;v-card-subtitle>
          {{ currentReport.description }}
        &lt;/v-card-subtitle>
        
        &lt;v-card-text>
          &lt;div v-if="reportResults.length === 0" class="text-center pa-4">
            No data found for the selected parameters.
          &lt;/div>
          
          &lt;template v-else>
            &lt;div v-if="currentReport.format === 'Table' || currentReport.format === 'Combined'">
              &lt;v-data-table
                :headers="getReportHeaders()"
                :items="reportResults"
                :items-per-page="10"
                class="elevation-1"
              >&lt;/v-data-table>
            &lt;/div>
            
            &lt;div v-if="currentReport.format === 'Chart' || currentReport.format === 'Combined'" class="mt-4">
              &lt;v-chart
                :option="getReportChartOption()"
                autoresize
                style="width: 100%; height: 400px;"
              />
            &lt;/div>
          &lt;/template>
        &lt;/v-card-text>
        
        &lt;v-card-actions>
          &lt;v-spacer>&lt;/v-spacer>
          &lt;v-btn
            color="primary"
            text
            @click="reportResultsDialog = false"
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
import { BarChart, LineChart, PieChart } from 'echarts/charts';
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
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
]);

export default {
  name: 'ReportsDashboard',
  components: {
    VChart
  },
  data() {
    return {
      activeTab: 0,
      
      // Report dialogs
      createReportDialog: false,
      reportResultsDialog: false,
      editMode: false,
      
      // Date menus
      startDateMenu: false,
      endDateMenu: false,
      dateMenu: false,
      
      // Current report and results
      currentReport: null,
      reportResults: [],
      
      // Report form
      reportForm: {
        name: '',
        description: '',
        type: 'Time',
        parameters: {
          startDate: new Date().toISOString().substr(0, 10),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10),
          clientId: null,
          projectId: null,
          userId: null,
          status: null,
          includeInactive: false
        },
        format: 'Table',
        chartType: 'Bar',
        columns: [],
        sortBy: { field: 'createdAt', direction: 'desc' },
        isTemplate: false,
        isScheduled: false,
        schedule: {
          frequency: 'Weekly',
          dayOfWeek: 1, // Monday
          dayOfMonth: 1,
          recipients: []
        }
      },
      
      // Dashboard date range
      dateRange: [
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10),
        new Date().toISOString().substr(0, 10)
      ],
      
      // Table headers
      reportHeaders: [
        { text: 'Name', value: 'name' },
        { text: 'Type', value: 'type' },
        { text: 'Last Run', value: 'lastRunAt' },
        { text: 'Created By', value: 'createdBy.firstName', sort: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`) },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      
      templateHeaders: [
        { text: 'Name', value: 'name' },
        { text: 'Type', value: 'type' },
        { text: 'Description', value: 'description' },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      
      scheduledHeaders: [
        { text: 'Name', value: 'name' },
        { text: 'Type', value: 'type' },
        { text: 'Frequency', value: 'schedule.frequency' },
        { text: 'Last Run', value: 'lastRunAt' },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      
      // Form options
      reportTypes: [
        { text: 'Time Report', value: 'Time' },
        { text: 'Budget Report', value: 'Budget' },
        { text: 'Client Report', value: 'Client' },
        { text: 'Project Report', value: 'Project' },
        { text: 'Resource Report', value: 'Resource' },
        { text: 'Custom Report', value: 'Custom' }
      ],
      
      reportFormats: [
        { text: 'Table', value: 'Table' },
        { text: 'Chart', value: 'Chart' },
        { text: 'Table and Chart', value: 'Combined' }
      ],
      
      chartTypes: [
        { text: 'Bar Chart', value: 'Bar' },
        { text: 'Line Chart', value: 'Line' },
        { text: 'Pie Chart', value: 'Pie' }
      ],
      
      scheduleFrequencies: [
        { text: 'Daily', value: 'Daily' },
        { text: 'Weekly', value: 'Weekly' },
        { text: 'Monthly', value: 'Monthly' }
      ],
      
      daysOfWeek: [
        { text: 'Monday', value: 1 },
        { text: 'Tuesday', value: 2 },
        { text: 'Wednesday', value: 3 },
        { text: 'Thursday', value: 4 },
        { text: 'Friday', value: 5 },
        { text: 'Saturday', value: 6 },
        { text: 'Sunday', value: 0 }
      ],
      
      daysOfMonth: Array.from({ length: 31 }, (_, i) => ({ text: `${i + 1}`, value: i + 1 })),
      
      projectStatuses: [
        'Planning',
        'Active',
        'On Hold',
        'Completed',
        'Cancelled'
      ],
      
      // Mock data (would come from API)
      myReports: [
        {
          id: 'report1',
          name: 'Weekly Time Report',
          type: 'Time',
          description: 'Weekly time tracking report for all projects',
          lastRunAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          createdBy: { firstName: 'John', lastName: 'Doe' }
        },
        {
          id: 'report2',
          name: 'Project Budget Status',
          type: 'Budget',
          description: 'Budget status for all active projects',
          lastRunAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          createdBy: { firstName: 'John', lastName: 'Doe' }
        },
        {
          id: 'report3',
          name: 'Resource Allocation',
          type: 'Resource',
          description: 'Resource allocation and utilization',
          lastRunAt: null,
          createdBy: { firstName: 'John', lastName: 'Doe' }
        }
      ],
      
      reportTemplates: [
        {
          id: 'template1',
          name: 'Monthly Client Summary',
          type: 'Client',
          description: 'Monthly summary of client activity',
          isTemplate: true,
          createdBy: { firstName: 'Admin', lastName: 'User' }
        },
        {
          id: 'template2',
          name: 'Project Performance',
          type: 'Project',
          description: 'Project performance metrics',
          isTemplate: true,
          createdBy: { firstName: 'Admin', lastName: 'User' }
        }
      ],
      
      scheduledReports: [
        {
          id: 'scheduled1',
          name: 'Weekly Timesheet Summary',
          type: 'Time',
          description: 'Weekly summary of all timesheets',
          isScheduled: true,
          schedule: {
            frequency: 'Weekly',
            dayOfWeek: 1,
            recipients: ['manager@example.com']
          },
          lastRunAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'scheduled2',
          name: 'Monthly Budget Report',
          type: 'Budget',
          description: 'Monthly budget status report',
          isScheduled: true,
          schedule: {
            frequency: 'Monthly',
            dayOfMonth: 1,
            recipients: ['manager@example.com', 'admin@example.com']
          },
          lastRunAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ],
      
      clients: [
        { id: 'client1', name: 'Test Client' }
      ],
      
      projects: [
        { id: 'proj1', name: 'Project Alpha' },
        { id: 'proj2', name: 'Project Beta' }
      ],
      
      users: [
        { id: 'user1', name: 'John Smith' },
        { id: 'user2', name: 'Jane Doe' },
        { id: 'user3', name: 'Bob Johnson' }
      ],
      
      // KPI data
      kpis: {
        totalHours: 1250,
        hoursChange: 5.2,
        totalRevenue: 87500,
        revenueChange: 12.8,
        utilization: 78,
        utilizationChange: -2.3,
        projectCompletion: 65,
        completionChange: 8.5
      }
    };
  },
  
  computed: {
    isManager() {
      // In a real app, this would check the user's role
      return true;
    },
    
    dateRangeText() {
      if (!this.dateRange || this.dateRange.length < 2) {
        return 'Select date range';
      }
      
      const start = new Date(this.dateRange[0]);
      const end = new Date(this.dateRange[1]);
      
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    },
    
    timeTrackingChartOption() {
      return {
        title: {
          text: 'Hours by Project',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['Billable Hours', 'Non-Billable Hours'],
          bottom: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['Project Alpha', 'Project Beta']
        },
        yAxis: {
          type: 'value',
          name: 'Hours'
        },
        series: [
          {
            name: 'Billable Hours',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: [320, 240]
          },
          {
            name: 'Non-Billable Hours',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: [80, 60]
          }
        ]
      };
    },
    
    budgetChartOption() {
      return {
        title: {
          text: 'Budget Utilization',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: ${c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: ['Used', 'Remaining']
        },
        series: [
          {
            name: 'Project Alpha',
            type: 'pie',
            radius: ['40%', '55%'],
            center: ['30%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: 6000, name: 'Used' },
              { value: 4000, name: 'Remaining' }
            ]
          },
          {
            name: 'Project Beta',
            type: 'pie',
            radius: ['40%', '55%'],
            center: ['70%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: 2500, name: 'Used' },
              { value: 2500, name: 'Remaining' }
            ]
          }
        ]
      };
    },
    
    resourceChartOption() {
      return {
        title: {
          text: 'Resource Utilization',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['Project Alpha', 'Project Beta'],
          bottom: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
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
          data: ['John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Williams']
        },
        series: [
          {
            name: 'Project Alpha',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: [30, 20, 15, 25]
          },
          {
            name: 'Project Beta',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: [10, 20, 25, 15]
          }
        ]
      };
    },
    
    invoiceChartOption() {
      return {
        title: {
          text: 'Invoice Status',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: ${c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: 10,
          data: ['Paid', 'Sent', 'Draft', 'Overdue']
        },
        series: [
          {
            name: 'Invoice Status',
            type: 'pie',
            radius: '55%',
            center: ['50%', '45%'],
            data: [
              { value: 45000, name: 'Paid', itemStyle: { color: '#4CAF50' } },
              { value: 25000, name: 'Sent', itemStyle: { color: '#2196F3' } },
              { value: 15000, name: 'Draft', itemStyle: { color: '#9E9E9E' } },
              { value: 10000, name: 'Overdue', itemStyle: { color: '#F44336' } }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
    }
  },
  
  methods: {
    formatDateTime(date) {
      if (!date) return '';
      const dateObj = new Date(date);
      return dateObj.toLocaleString();
    },
    
    getReportTypeColor(type) {
      switch (type) {
        case 'Time': return 'primary';
        case 'Budget': return 'success';
        case 'Client': return 'info';
        case 'Project': return 'warning';
        case 'Resource': return 'purple';
        case 'Custom': return 'grey';
        default: return 'primary';
      }
    },
    
    runReport(report) {
      this.currentReport = report;
      
      // In a real app, this would call the API to run the report
      // For now, generate mock data based on report type
      switch (report.type) {
        case 'Time':
          this.reportResults = this.generateTimeReportData();
          break;
        case 'Budget':
          this.reportResults = this.generateBudgetReportData();
          break;
        case 'Client':
          this.reportResults = this.generateClientReportData();
          break;
        case 'Project':
          this.reportResults = this.generateProjectReportData();
          break;
        case 'Resource':
          this.reportResults = this.generateResourceReportData();
          break;
        default:
          this.reportResults = [];
      }
      
      this.reportResultsDialog = true;
    },
    
    editReport(report) {
      this.editMode = true;
      this.reportForm = { ...report };
      this.createReportDialog = true;
    },
    
    deleteReport(report) {
      if (confirm(`Are you sure you want to delete the report "${report.name}"?`)) {
        // In a real app, this would call the API to delete the report
        // For now, just remove from the local array
        if (report.isTemplate) {
          this.reportTemplates = this.reportTemplates.filter(r => r.id !== report.id);
        } else if (report.isScheduled) {
          this.scheduledReports = this.scheduledReports.filter(r => r.id !== report.id);
        } else {
          this.myReports = this.myReports.filter(r => r.id !== report.id);
        }
      }
    },
    
    useTemplate(template) {
      this.editMode = false;
      this.reportForm = { 
        ...template,
        name: `${template.name} Copy`,
        isTemplate: false
      };
      this.createReportDialog = true;
    },
    
    editSchedule(report) {
      this.editMode = true;
      this.reportForm = { ...report };
      this.createReportDialog = true;
    },
    
    toggleSchedule(report) {
      // In a real app, this would call the API to toggle the schedule
      // For now, just update the local object
      report.isScheduled = !report.isScheduled;
    },
    
    saveReport() {
      if (!this.$refs.reportForm.validate()) {
        return;
      }
      
      // In a real app, this would call the API to save the report
      // For now, just update the local arrays
      const newReport = { ...this.reportForm, id: this.editMode ? this.reportForm.id : `report${Date.now()}` };
      
      if (newReport.isTemplate) {
        if (this.editMode) {
          const index = this.reportTemplates.findIndex(r => r.id === newReport.id);
          if (index !== -1) {
            this.reportTemplates.splice(index, 1, newReport);
          } else {
            this.reportTemplates.push(newReport);
          }
        } else {
          this.reportTemplates.push(newReport);
        }
      } else if (newReport.isScheduled) {
        if (this.editMode) {
          const index = this.scheduledReports.findIndex(r => r.id === newReport.id);
          if (index !== -1) {
            this.scheduledReports.splice(index, 1, newReport);
          } else {
            this.scheduledReports.push(newReport);
          }
        } else {
          this.scheduledReports.push(newReport);
        }
      } else {
        if (this.editMode) {
          const index = this.myReports.findIndex(r => r.id === newReport.id);
          if (index !== -1) {
            this.myReports.splice(index, 1, newReport);
          } else {
            this.myReports.push(newReport);
          }
        } else {
          this.myReports.push(newReport);
        }
      }
      
      this.createReportDialog = false;
      this.resetReportForm();
    },
    
    resetReportForm() {
      this.reportForm = {
        name: '',
        description: '',
        type: 'Time',
        parameters: {
          startDate: new Date().toISOString().substr(0, 10),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10),
          clientId: null,
          projectId: null,
          userId: null,
          status: null,
          includeInactive: false
        },
        format: 'Table',
        chartType: 'Bar',
        columns: [],
        sortBy: { field: 'createdAt', direction: 'desc' },
        isTemplate: false,
        isScheduled: false,
        schedule: {
          frequency: 'Weekly',
          dayOfWeek: 1,
          dayOfMonth: 1,
          recipients: []
        }
      };
      this.editMode = false;
    },
    
    exportReport() {
      // In a real app, this would generate and download a file
      alert('Report export functionality would be implemented here.');
    },
    
    getReportHeaders() {
      // Generate headers based on report type
      switch (this.currentReport.type) {
        case 'Time':
          return [
            { text: 'User', value: 'user' },
            { text: 'Department', value: 'department' },
            { text: 'Start Date', value: 'startDate' },
            { text: 'End Date', value: 'endDate' },
            { text: 'Status', value: 'status' },
            { text: 'Total Hours', value: 'totalHours' }
          ];
        case 'Budget':
          return [
            { text: 'Project', value: 'projectName' },
            { text: 'Client', value: 'client' },
            { text: 'Status', value: 'status' },
            { text: 'Budget', value: 'budget' },
            { text: 'Used', value: 'budgetUsed' },
            { text: 'Remaining', value: 'budgetRemaining' },
            { text: 'Used %', value: 'budgetUsedPercentage' }
          ];
        case 'Client':
          return [
            { text: 'Client', value: 'name' },
            { text: 'Contact', value: 'contactPerson' },
            { text: 'Projects', value: 'projectCount' },
            { text: 'Total Budget', value: 'totalBudget' },
            { text: 'Invoiced', value: 'totalInvoiced' },
            { text: 'Paid', value: 'totalPaid' },
            { text: 'Outstanding', value: 'outstandingBalance' }
          ];
        case 'Project':
          return [
            { text: 'Project', value: 'projectName' },
            { text: 'Client', value: 'client' },
            { text: 'Status', value: 'status' },
            { text: 'Budget', value: 'budget' },
            { text: 'Used %', value: 'budgetUsedPercentage' },
            { text: 'Total Hours', value: 'totalHours' },
            { text: 'Billable Hours', value: 'billableHours' }
          ];
        case 'Resource':
          return [
            { text: 'Name', value: 'name' },
            { text: 'Department', value: 'department' },
            { text: 'Total Hours', value: 'totalHours' },
            { text: 'Billable Hours', value: 'billableHours' },
            { text: 'Utilization', value: 'utilization' },
            { text: 'Billable %', value: 'billablePercentage' }
          ];
        default:
          return [];
      }
    },
    
    getReportChartOption() {
      // Generate chart options based on report type and chart type
      if (!this.currentReport || !this.reportResults.length) {
        return {};
      }
      
      switch (this.currentReport.type) {
        case 'Time':
          if (this.currentReport.chartType === 'Pie') {
            return {
              title: {
                text: 'Time Distribution',
                left: 'center'
              },
              tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} hours ({d}%)'
              },
              legend: {
                orient: 'vertical',
                left: 10,
                data: this.reportResults.map(r => r.user)
              },
              series: [
                {
                  name: 'Hours',
                  type: 'pie',
                  radius: '55%',
                  center: ['50%', '50%'],
                  data: this.reportResults.map(r => ({
                    name: r.user,
                    value: r.totalHours
                  })),
                  emphasis: {
                    itemStyle: {
                      shadowBlur: 10,
                      shadowOffsetX: 0,
                      shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                  }
                }
              ]
            };
          } else {
            return {
              title: {
                text: 'Time Report',
                left: 'center'
              },
              tooltip: {
                trigger: 'axis',
                axisPointer: {
                  type: 'shadow'
                }
              },
              legend: {
                data: ['Total Hours'],
                bottom: 10
              },
              grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
              },
              xAxis: {
                type: 'category',
                data: this.reportResults.map(r => r.user)
              },
              yAxis: {
                type: 'value',
                name: 'Hours'
              },
              series: [
                {
                  name: 'Total Hours',
                  type: this.currentReport.chartType.toLowerCase(),
                  data: this.reportResults.map(r => r.totalHours)
                }
              ]
            };
          }
        
        case 'Budget':
          if (this.currentReport.chartType === 'Pie') {
            return {
              title: {
                text: 'Budget Distribution',
                left: 'center'
              },
              tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: ${c} ({d}%)'
              },
              legend: {
                orient: 'vertical',
                left: 10,
                data: this.reportResults.map(r => r.projectName)
              },
              series: [
                {
                  name: 'Budget',
                  type: 'pie',
                  radius: '55%',
                  center: ['50%', '50%'],
                  data: this.reportResults.map(r => ({
                    name: r.projectName,
                    value: r.budget
                  })),
                  emphasis: {
                    itemStyle: {
                      shadowBlur: 10,
                      shadowOffsetX: 0,
                      shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                  }
                }
              ]
            };
          } else {
            return {
              title: {
                text: 'Budget Report',
                left: 'center'
              },
              tooltip: {
                trigger: 'axis',
                axisPointer: {
                  type: 'shadow'
                }
              },
              legend: {
                data: ['Budget', 'Used', 'Remaining'],
                bottom: 10
              },
              grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
              },
              xAxis: {
                type: 'category',
                data: this.reportResults.map(r => r.projectName)
              },
              yAxis: {
                type: 'value',
                name: 'Amount ($)'
              },
              series: [
                {
                  name: 'Budget',
                  type: this.currentReport.chartType.toLowerCase(),
                  data: this.reportResults.map(r => r.budget)
                },
                {
                  name: 'Used',
                  type: this.currentReport.chartType.toLowerCase(),
                  data: this.reportResults.map(r => r.budgetUsed)
                },
                {
                  name: 'Remaining',
                  type: this.currentReport.chartType.toLowerCase(),
                  data: this.reportResults.map(r => r.budgetRemaining)
                }
              ]
            };
          }
          
        // Add similar cases for other report types
        default:
          return {};
      }
    },
    
    // Mock data generation methods for report results
    generateTimeReportData() {
      return [
        {
          timesheetId: 'ts1',
          user: 'John Smith',
          department: 'Development',
          startDate: '2025-04-01',
          endDate: '2025-04-07',
          status: 'Approved',
          totalHours: 40,
          entries: [
            {
              projectId: 'proj1',
              projectName: 'Project Alpha',
              date: '2025-04-01',
              hours: 8,
              description: 'Development work',
              billable: true
            },
            // More entries would be here
          ]
        },
        {
          timesheetId: 'ts2',
          user: 'Jane Doe',
          department: 'Design',
          startDate: '2025-04-01',
          endDate: '2025-04-07',
          status: 'Approved',
          totalHours: 38,
          entries: [
            {
              projectId: 'proj2',
              projectName: 'Project Beta',
              date: '2025-04-01',
              hours: 7,
              description: 'Design work',
              billable: true
            },
            // More entries would be here
          ]
        },
        {
          timesheetId: 'ts3',
          user: 'Bob Johnson',
          department: 'Development',
          startDate: '2025-04-01',
          endDate: '2025-04-07',
          status: 'Approved',
          totalHours: 42,
          entries: [
            {
              projectId: 'proj1',
              projectName: 'Project Alpha',
              date: '2025-04-01',
              hours: 9,
              description: 'Backend development',
              billable: true
            },
            // More entries would be here
          ]
        }
      ];
    },
    
    generateBudgetReportData() {
      return [
        {
          projectId: 'proj1',
          projectName: 'Project Alpha',
          client: 'Test Client',
          status: 'Active',
          startDate: '2025-03-01',
          endDate: '2025-06-30',
          budget: 10000,
          budgetRemaining: 4000,
          budgetUsed: 6000,
          budgetUsedPercentage: 60,
          totalBilledHours: 80,
          totalBilledAmount: 6000
        },
        {
          projectId: 'proj2',
          projectName: 'Project Beta',
          client: 'Test Client',
          status: 'Active',
          startDate: '2025-04-01',
          endDate: '2025-07-31',
          budget: 5000,
          budgetRemaining: 2500,
          budgetUsed: 2500,
          budgetUsedPercentage: 50,
          totalBilledHours: 40,
          totalBilledAmount: 2500
        }
      ];
    },
    
    generateClientReportData() {
      return [
        {
          clientId: 'client1',
          name: 'Test Client',
          contactPerson: 'John Doe',
          email: 'john@test.com',
          phone: '555-0123',
          isActive: true,
          totalBudget: 50000,
          projectCount: 2,
          activeProjectCount: 2,
          totalProjectBudget: 15000,
          totalProjectBudgetRemaining: 6500,
          totalInvoiced: 8500,
          totalPaid: 6000,
          outstandingBalance: 2500
        }
      ];
    },
    
    generateProjectReportData() {
      return [
        {
          projectId: 'proj1',
          projectName: 'Project Alpha',
          client: 'Test Client',
          status: 'Active',
          startDate: '2025-03-01',
          endDate: '2025-06-30',
          budget: 10000,
          budgetRemaining: 4000,
          budgetUsed: 6000,
          budgetUsedPercentage: 60,
          totalHours: 100,
          billableHours: 80,
          nonBillableHours: 20,
          totalInvoiced: 6000
        },
        {
          projectId: 'proj2',
          projectName: 'Project Beta',
          client: 'Test Client',
          status: 'Active',
          startDate: '2025-04-01',
          endDate: '2025-07-31',
          budget: 5000,
          budgetRemaining: 2500,
          budgetUsed: 2500,
          budgetUsedPercentage: 50,
          totalHours: 50,
          billableHours: 40,
          nonBillableHours: 10,
          totalInvoiced: 2500
        }
      ];
    },
    
    generateResourceReportData() {
      return [
        {
          userId: 'user1',
          name: 'John Smith',
          email: 'john@example.com',
          department: 'Development',
          hourlyRate: 75,
          totalHours: 160,
          billableHours: 140,
          nonBillableHours: 20,
          utilization: 85,
          billablePercentage: 87.5
        },
        {
          userId: 'user2',
          name: 'Jane Doe',
          email: 'jane@example.com',
          department: 'Design',
          hourlyRate: 65,
          totalHours: 150,
          billableHours: 120,
          nonBillableHours: 30,
          utilization: 80,
          billablePercentage: 80
        },
        {
          userId: 'user3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          department: 'Development',
          hourlyRate: 70,
          totalHours: 170,
          billableHours: 150,
          nonBillableHours: 20,
          utilization: 90,
          billablePercentage: 88.2
        }
      ];
    }
  }
};
&lt;/script>

&lt;style scoped>
.kpi-card {
  height: 100%;
}
&lt;/style>
