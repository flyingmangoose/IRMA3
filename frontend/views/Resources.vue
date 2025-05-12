<template>
  <div class="resources-container">
    <v-card class="mb-4">
      <v-card-title>
        Resources
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search resources"
          single-line
          hide-details
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="dialogResource = true" class="ml-2">
          <v-icon left>mdi-account-plus</v-icon>
          Add Resource
        </v-btn>
        <v-btn outlined class="ml-2" @click="showFilters = !showFilters">
          <v-icon left>mdi-filter</v-icon>
          Filter
        </v-btn>
      </v-card-title>

      <v-expand-transition>
        <div v-if="showFilters">
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="filters.roles"
                  :items="roleOptions"
                  label="Filter by Role"
                  multiple
                  chips
                  small-chips
                  deletable-chips
                ></v-select>
              </v-col>
              
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="filters.departments"
                  :items="departmentOptions"
                  label="Filter by Department"
                  multiple
                  chips
                  small-chips
                  deletable-chips
                ></v-select>
              </v-col>
              
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="filters.availability"
                  :items="availabilityStatusOptions"
                  label="Filter by Availability"
                  multiple
                  chips
                  small-chips
                  deletable-chips
                ></v-select>
              </v-col>
              
              <v-col cols="12" sm="6" md="3">
                <v-combobox
                  v-model="filters.skills"
                  :items="skillOptions"
                  label="Required Skills"
                  multiple
                  chips
                  small-chips
                  deletable-chips
                ></v-combobox>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-checkbox
                  v-model="filters.activeOnly"
                  label="Active Resources Only"
                ></v-checkbox>
              </v-col>
              
              <v-col cols="12" sm="6" md="4">
                <v-checkbox
                  v-model="filters.availableOnly"
                  label="Available Resources Only"
                ></v-checkbox>
              </v-col>
              
              <v-col cols="12" sm="6" md="4">
                <v-slider
                  v-model="filters.minAvailableHours"
                  label="Min. Available Hours per Week"
                  thumb-label
                  :max="40"
                  :min="0"
                  :step="5"
                ></v-slider>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" class="text-right">
                <v-btn text color="red" @click="clearFilters">Clear Filters</v-btn>
                <v-btn text color="primary" @click="applyFilters">Apply Filters</v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </div>
      </v-expand-transition>

      <v-data-table
        :headers="headers"
        :items="filteredResources"
        :search="search"
        :loading="loading"
        class="elevation-1"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20],
          'items-per-page-text': 'Resources per page'
        }"
      >
        <!-- Status column -->
        <template v-slot:[`item.status`]="{ item }">
          <v-chip
            :color="item.isActive ? 'green' : 'grey'"
            text-color="white"
            small
          >
            {{ item.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <!-- Role column -->
        <template v-slot:[`item.role`]="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            text-color="white"
            small
          >
            {{ item.role }}
          </v-chip>
        </template>

        <!-- Utilization column -->
        <template v-slot:[`item.utilization`]="{ item }">
          <v-progress-linear
            :value="item.utilization"
            height="15"
            :color="getUtilizationColor(item.utilization)"
          >
            <template v-slot:default>
              <span class="white--text">{{ item.utilization }}%</span>
            </template>
          </v-progress-linear>
        </template>

        <!-- Availability column -->
        <template v-slot:[`item.availabilityStatus`]="{ item }">
          <v-chip
            :color="getAvailabilityColor(item.availabilityStatus)"
            text-color="white"
            small
          >
            {{ item.availabilityStatus }}
          </v-chip>
        </template>

        <!-- Actions column -->
        <template v-slot:[`item.actions`]="{ item }">
          <v-icon small class="mr-2" @click="viewResource(item)">
            mdi-eye
          </v-icon>
          <v-icon small class="mr-2" @click="editResource(item)">
            mdi-pencil
          </v-icon>
          <v-icon small @click="confirmDelete(item)">
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <!-- Resources Report Card -->
    <v-card class="mb-4">
      <v-card-title>
        Resource Reports
        <v-spacer></v-spacer>
        <v-btn-toggle v-model="reportView" mandatory class="ml-2">
          <v-btn value="table">
            <v-icon>mdi-table</v-icon>
          </v-btn>
          <v-btn value="chart">
            <v-icon>mdi-chart-bar</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" sm="3">
            <v-select
              v-model="reportTimeframe"
              :items="timeframeOptions"
              label="Timeframe"
              outlined
              dense
              @change="generateResourceReport"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="3">
            <v-select
              v-model="reportType"
              :items="reportTypeOptions"
              label="Report Type"
              outlined
              dense
              @change="generateResourceReport"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="3">
            <v-autocomplete
              v-model="selectedResource"
              :items="resources"
              item-text="fullName"
              item-value="id"
              label="Search by Resource"
              outlined
              dense
              clearable
              @change="generateResourceReport"
            ></v-autocomplete>
          </v-col>
          
          <v-col cols="12" sm="3">
            <v-menu
              ref="dateMenu"
              v-model="dateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="dateRangeText"
                  label="Custom Date Range"
                  prepend-icon="mdi-calendar"
                  readonly
                  outlined
                  dense
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="dates"
                range
                no-title
                @change="dateMenu = false"
                @input="generateResourceReport"
              ></v-date-picker>
            </v-menu>
          </v-col>
        </v-row>
        
        <!-- Report loading indicator -->
        <div v-if="reportLoading" class="text-center my-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="mt-2">Loading report data...</div>
        </div>
        
        <!-- Table View -->
        <div v-else-if="reportView === 'table' && !reportLoading">
          <v-data-table
            :headers="reportHeaders"
            :items="reportData"
            :items-per-page="10"
            class="elevation-1 mt-4"
            v-if="reportData.length > 0"
          >
            <!-- Utilization column -->
            <template v-slot:[`item.utilization`]="{ item }">
              <v-progress-linear
                :value="item.utilization"
                height="15"
                :color="getUtilizationColor(item.utilization)"
              >
                <template v-slot:default>
                  <span class="white--text">{{ item.utilization }}%</span>
                </template>
              </v-progress-linear>
            </template>
            
            <!-- Availability column -->
            <template v-slot:[`item.availableHours`]="{ item }">
              <v-progress-linear
                :value="(item.availableHours / 40) * 100"
                height="15"
                color="success"
              >
                <template v-slot:default>
                  <span class="white--text">{{ item.availableHours }} hrs</span>
                </template>
              </v-progress-linear>
            </template>
          </v-data-table>
          
          <div v-else class="text-center pa-4">
            <v-icon large color="grey lighten-1">mdi-alert-circle-outline</v-icon>
            <div class="mt-2">No data available for the selected filters.</div>
            <v-btn text color="primary" class="mt-2" @click="resetReportFilters">
              Reset Filters
            </v-btn>
          </div>
        </div>
        
        <!-- Chart View -->
        <div v-else-if="reportView === 'chart' && !reportLoading" class="mt-4">
          <div v-if="reportData.length > 0">
            <div class="d-flex mb-4 justify-center">
              <v-chip-group v-model="chartMetric" mandatory>
                <v-chip value="utilization">Utilization %</v-chip>
                <v-chip value="billableHours">Billable Hours</v-chip>
                <v-chip value="availableHours">Available Hours</v-chip>
              </v-chip-group>
            </div>
            
            <!-- Simple bar chart for monthly view -->
            <div class="simple-chart-container">
              <div v-for="(item, index) in chartData" :key="index" class="month-column">
                <div 
                  class="month-bar" 
                  :style="{ 
                    height: `${getBarHeight(item[chartMetric])}px`, 
                    backgroundColor: getBarColor(item[chartMetric], chartMetric) 
                  }"
                >
                  <div class="month-value">{{ formatChartValue(item[chartMetric], chartMetric) }}</div>
                </div>
                <div class="month-label">{{ item.period }}</div>
              </div>
            </div>
            
            <!-- Chart Legend -->
            <div class="d-flex justify-center mt-4">
              <v-chip :color="getBarColor(30, chartMetric)" small class="mr-2">Low</v-chip>
              <v-chip :color="getBarColor(60, chartMetric)" small class="mr-2">Medium</v-chip>
              <v-chip :color="getBarColor(90, chartMetric)" small>High</v-chip>
            </div>
          </div>
          
          <div v-else class="text-center pa-4">
            <v-icon large color="grey lighten-1">mdi-chart-bar</v-icon>
            <div class="mt-2">No chart data available for the selected filters.</div>
            <v-btn text color="primary" class="mt-2" @click="resetReportFilters">
              Reset Filters
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- New/Edit Resource Dialog -->
    <v-dialog v-model="dialogResource" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="form" v-model="valid">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.firstName"
                    label="First Name"
                    :rules="[v => !!v || 'First name is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.lastName"
                    label="Last Name"
                    :rules="[v => !!v || 'Last name is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.email"
                    label="Email"
                    :rules="emailRules"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.phone"
                    label="Phone"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editedItem.role"
                    :items="roleOptions"
                    label="Role"
                    :rules="[v => !!v || 'Role is required']"
                    required
                  ></v-select>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editedItem.department"
                    :items="departmentOptions"
                    label="Department"
                    :rules="[v => !!v || 'Department is required']"
                    required
                  ></v-select>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.hourlyRate"
                    label="Hourly Rate"
                    prefix="$"
                    type="number"
                    :rules="[v => v >= 0 || 'Hourly rate must be positive']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="editedItem.isActive"
                    label="Active Resource"
                    color="success"
                  ></v-switch>
                </v-col>

                <v-col cols="12">
                  <v-combobox
                    v-model="editedItem.skills"
                    :items="skillOptions"
                    label="Skills"
                    multiple
                    chips
                    small-chips
                    deletable-chips
                  ></v-combobox>
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
            @click="saveResource"
            :disabled="!valid"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Resource Dialog -->
    <v-dialog v-model="dialogViewResource" max-width="800px">
      <v-card v-if="viewedResource">
        <v-card-title class="headline">
          {{ viewedResource.firstName }} {{ viewedResource.lastName }}
          <v-spacer></v-spacer>
          <v-chip
            :color="viewedResource.isActive ? 'green' : 'grey'"
            text-color="white"
          >
            {{ viewedResource.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </v-card-title>

        <v-tabs v-model="activeResourceTab" background-color="primary" dark>
          <v-tab>Details</v-tab>
          <v-tab>Capacity &amp; Availability</v-tab>
          <v-tab>Projects</v-tab>
        </v-tabs>

        <v-tabs-items v-model="activeResourceTab">
          <!-- Details Tab -->
          <v-tab-item>
            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <v-list>
                    <v-list-item>
                      <v-list-item-icon>
                        <v-icon>mdi-email</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>Email</v-list-item-title>
                        <v-list-item-subtitle>{{ viewedResource.email }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item v-if="viewedResource.phone">
                      <v-list-item-icon>
                        <v-icon>mdi-phone</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>Phone</v-list-item-title>
                        <v-list-item-subtitle>{{ viewedResource.phone }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-icon>
                        <v-icon>mdi-badge-account</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>Role</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip
                            :color="getRoleColor(viewedResource.role)"
                            text-color="white"
                            small
                          >
                            {{ viewedResource.role }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-icon>
                        <v-icon>mdi-domain</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>Department</v-list-item-title>
                        <v-list-item-subtitle>{{ viewedResource.department }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-icon>
                        <v-icon>mdi-currency-usd</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>Hourly Rate</v-list-item-title>
                        <v-list-item-subtitle>{{ formatCurrency(viewedResource.hourlyRate) }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-icon>
                        <v-icon>mdi-chart-timeline-variant</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>Current Utilization</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-progress-linear
                            :value="viewedResource.utilization"
                            height="20"
                            :color="getUtilizationColor(viewedResource.utilization)"
                          >
                            <template v-slot:default>
                              <strong>{{ viewedResource.utilization }}%</strong>
                            </template>
                          </v-progress-linear>
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-col>

                <v-col cols="12">
                  <v-card outlined>
                    <v-card-title>Skills</v-card-title>
                    <v-card-text>
                      <v-chip
                        v-for="skill in viewedResource.skills"
                        :key="skill"
                        class="ma-1"
                        color="primary"
                        small
                      >
                        {{ skill }}
                      </v-chip>
                      <p v-if="!viewedResource.skills || viewedResource.skills.length === 0" class="text-caption">
                        No skills listed
                      </p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tab-item>

          <!-- Capacity & Availability Tab -->
          <v-tab-item>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-card outlined>
                    <v-card-title class="subtitle-1">Capacity Overview</v-card-title>
                    <v-card-text>
                      <v-list dense>
                        <v-list-item>
                          <v-list-item-content>
                            <v-list-item-title>Maximum Weekly Hours</v-list-item-title>
                            <v-list-item-subtitle>
                              {{ viewedResource.maxWeeklyHours || 40 }} hours
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-content>
                            <v-list-item-title>Current Allocated Hours</v-list-item-title>
                            <v-list-item-subtitle>
                              {{ viewedResource.allocatedHours || 0 }} hours per week
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-content>
                            <v-list-item-title>Available Capacity</v-list-item-title>
                            <v-list-item-subtitle>
                              {{ getAvailableHours(viewedResource) }} hours per week
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                      </v-list>
                      
                      <v-card-title class="subtitle-1 pt-4">Capacity Utilization</v-card-title>
                      <v-progress-linear
                        :value="getCapacityPercentage(viewedResource)"
                        height="25"
                        :color="getUtilizationColor(getCapacityPercentage(viewedResource))"
                      >
                        <template v-slot:default>
                          <strong>{{ getCapacityPercentage(viewedResource) }}%</strong>
                        </template>
                      </v-progress-linear>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-card outlined>
                    <v-card-title class="subtitle-1">
                      Upcoming Availability
                      <v-spacer></v-spacer>
                      <v-btn small text color="primary" @click="editAvailability">
                        <v-icon small left>mdi-pencil</v-icon>
                        Edit
                      </v-btn>
                    </v-card-title>
                    <v-card-text>
                      <v-list dense>
                        <v-list-item>
                          <v-list-item-content>
                            <v-list-item-title>Current Status</v-list-item-title>
                            <v-list-item-subtitle>
                              <v-chip
                                :color="getAvailabilityColor(viewedResource.availabilityStatus)"
                                text-color="white"
                                small
                              >
                                {{ viewedResource.availabilityStatus || 'Available' }}
                              </v-chip>
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                        
                        <v-list-item v-if="viewedResource.nextAvailableDate">
                          <v-list-item-content>
                            <v-list-item-title>Next Availability</v-list-item-title>
                            <v-list-item-subtitle>
                              {{ formatDate(viewedResource.nextAvailableDate) }}
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                      </v-list>
                      
                      <v-card-title class="subtitle-1 pt-4">Upcoming Time Off</v-card-title>
                      <v-timeline dense v-if="resourceTimeOff.length > 0">
                        <v-timeline-item
                          v-for="(timeOff, index) in resourceTimeOff"
                          :key="index"
                          :color="timeOff.approved ? 'green' : 'amber'"
                          small
                        >
                          <div>
                            <div class="font-weight-normal">
                              {{ formatDateRange(timeOff.startDate, timeOff.endDate) }}
                            </div>
                            <div class="text-caption">
                              {{ timeOff.reason }}
                              <v-chip x-small :color="timeOff.approved ? 'success' : 'warning'" class="ml-2">
                                {{ timeOff.approved ? 'Approved' : 'Pending' }}
                              </v-chip>
                            </div>
                          </div>
                        </v-timeline-item>
                      </v-timeline>
                      <p v-else class="text-caption">No scheduled time off</p>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12">
                  <v-card outlined>
                    <v-card-title class="subtitle-1">Monthly Allocation</v-card-title>
                    <v-card-text>
                      <v-sparkline
                        :value="resourceMonthlyAllocation"
                        :gradient="['#1867C0', '#5CBBF6']"
                        :smooth="10"
                        auto-draw
                        line-width="2"
                        padding="16"
                        :labels="monthLabels"
                        :fill="true"
                      ></v-sparkline>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tab-item>

          <!-- Projects Tab -->
          <v-tab-item>
            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <v-card outlined>
                    <v-card-title>Current Projects</v-card-title>
                    <v-card-text>
                      <div v-if="resourceProjects.length > 0">
                        <v-list dense>
                          <v-list-item v-for="project in resourceProjects" :key="project.id">
                            <v-list-item-icon>
                              <v-icon :color="getStatusColor(project.status)">mdi-folder</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                              <v-list-item-title>{{ project.name }}</v-list-item-title>
                              <v-list-item-subtitle>
                                {{ project.status }} | Role: {{ project.resourceRole }}
                              </v-list-item-subtitle>
                            </v-list-item-content>
                            <v-list-item-action>
                              <v-chip small>{{ project.hoursPerWeek || 10 }} hrs/week</v-chip>
                            </v-list-item-action>
                          </v-list-item>
                        </v-list>
                      </div>
                      <p v-else class="text-caption">Not assigned to any projects</p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tab-item>
        </v-tabs-items>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="editResource(viewedResource)">
            Edit
          </v-btn>
          <v-btn color="blue darken-1" text @click="dialogViewResource = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDeleteConfirm" max-width="500px">
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this resource? This action cannot be undone.
          <div class="warning-text mt-3" v-if="resourceProjects.length > 0">
            <v-alert type="warning" text dense>
              This resource is assigned to {{ resourceProjects.length }} project(s). Deleting this resource will affect these projects.
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogDeleteConfirm = false">
            Cancel
          </v-btn>
          <v-btn color="red darken-1" text @click="deleteResource">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Availability Edit Dialog -->
    <v-dialog v-model="dialogAvailability" max-width="600px">
      <v-card v-if="viewedResource">
        <v-card-title>
          Edit Availability - {{ viewedResource.firstName }} {{ viewedResource.lastName }}
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="availabilityForm.status"
                  :items="availabilityStatusOptions"
                  label="Availability Status"
                  outlined
                ></v-select>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="availabilityForm.maxWeeklyHours"
                  type="number"
                  label="Maximum Weekly Hours"
                  outlined
                  min="0"
                  max="40"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-menu
                  v-model="availabilityDateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="availabilityForm.nextAvailableDate"
                      label="Next Available Date"
                      prepend-icon="mdi-calendar"
                      readonly
                      outlined
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="availabilityForm.nextAvailableDate"
                    @input="availabilityDateMenu = false"
                  ></v-date-picker>
                </v-menu>
              </v-col>
              
              <v-col cols="12">
                <v-divider class="my-4"></v-divider>
                <h3 class="text-subtitle-1 mb-2">Add Time Off</h3>
                
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-menu
                      v-model="timeOffStartMenu"
                      :close-on-content-click="false"
                      transition="scale-transition"
                      offset-y
                      min-width="auto"
                    >
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field
                          v-model="timeOffForm.startDate"
                          label="Start Date"
                          prepend-icon="mdi-calendar"
                          readonly
                          outlined
                          v-bind="attrs"
                          v-on="on"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="timeOffForm.startDate"
                        @input="timeOffStartMenu = false"
                      ></v-date-picker>
                    </v-menu>
                  </v-col>
                  
                  <v-col cols="12" sm="6">
                    <v-menu
                      v-model="timeOffEndMenu"
                      :close-on-content-click="false"
                      transition="scale-transition"
                      offset-y
                      min-width="auto"
                    >
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field
                          v-model="timeOffForm.endDate"
                          label="End Date"
                          prepend-icon="mdi-calendar"
                          readonly
                          outlined
                          v-bind="attrs"
                          v-on="on"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="timeOffForm.endDate"
                        @input="timeOffEndMenu = false"
                      ></v-date-picker>
                    </v-menu>
                  </v-col>
                  
                  <v-col cols="12">
                    <v-text-field
                      v-model="timeOffForm.reason"
                      label="Reason"
                      outlined
                    ></v-text-field>
                  </v-col>
                  
                  <v-col cols="12">
                    <v-btn color="primary" @click="addTimeOff" :disabled="!isTimeOffFormValid">
                      Add Time Off
                    </v-btn>
                  </v-col>
                </v-row>
                
                <v-divider class="my-4"></v-divider>
                
                <h3 class="text-subtitle-1 mb-2">Current Time Off Requests</h3>
                <v-simple-table v-if="resourceTimeOff.length > 0">
                  <template v-slot:default>
                    <thead>
                      <tr>
                        <th>Dates</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(timeOff, index) in resourceTimeOff" :key="index">
                        <td>{{ formatDateRange(timeOff.startDate, timeOff.endDate) }}</td>
                        <td>{{ timeOff.reason }}</td>
                        <td>
                          <v-chip x-small :color="timeOff.approved ? 'success' : 'warning'">
                            {{ timeOff.approved ? 'Approved' : 'Pending' }}
                          </v-chip>
                        </td>
                        <td>
                          <v-icon small @click="removeTimeOff(index)" color="red">
                            mdi-delete
                          </v-icon>
                        </td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
                <p v-else class="text-caption">No time off scheduled</p>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogAvailability = false">
            Cancel
          </v-btn>
          <v-btn color="blue darken-1" text @click="saveAvailability">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';

export default {
  name: 'ResourcesPage',
  
  data() {
    return {
      resources: [],
      search: '',
      loading: false,
      showFilters: false,
      filters: {
        roles: [],
        departments: [],
        skills: [],
        availability: [],
        activeOnly: false,
        availableOnly: false,
        minAvailableHours: 0
      },
      headers: [
        { text: 'Name', value: 'fullName', sortable: true },
        { text: 'Email', value: 'email' },
        { text: 'Role', value: 'role' },
        { text: 'Department', value: 'department' },
        { text: 'Status', value: 'status' },
        { text: 'Utilization', value: 'utilization' },
        { text: 'Availability', value: 'availabilityStatus' },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      dialogResource: false,
      dialogViewResource: false,
      dialogDeleteConfirm: false,
      dialogAvailability: false,
      valid: false,
      editedIndex: -1,
      viewedResource: null,
      resourceProjects: [],
      activeResourceTab: 0,
      availabilityDateMenu: false,
      timeOffStartMenu: false,
      timeOffEndMenu: false,
      resourceTimeOff: [],
      resourceMonthlyAllocation: [40, 65, 30, 50, 75, 90],
      monthLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      availabilityStatusOptions: [
        'Available',
        'Partially Available',
        'Fully Allocated',
        'Upcoming Leave',
        'Out of Office'
      ],
      availabilityForm: {
        status: 'Available',
        maxWeeklyHours: 40,
        nextAvailableDate: null
      },
      timeOffForm: {
        startDate: null,
        endDate: null,
        reason: '',
        approved: false
      },
      editedItem: {
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        hourlyRate: 0,
        isActive: true,
        utilization: 0,
        skills: [],
        maxWeeklyHours: 40,
        allocatedHours: 0,
        availabilityStatus: 'Available',
        nextAvailableDate: null
      },
      defaultItem: {
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        hourlyRate: 0,
        isActive: true,
        utilization: 0,
        skills: [],
        maxWeeklyHours: 40,
        allocatedHours: 0,
        availabilityStatus: 'Available',
        nextAvailableDate: null
      },
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid'
      ],
      roleOptions: ['Developer', 'Designer', 'Project Manager', 'Business Analyst', 'QA Engineer', 'DevOps', 'Admin'],
      departmentOptions: ['Engineering', 'Design', 'Product', 'Marketing', 'Operations', 'Sales', 'HR'],
      skillOptions: [
        'JavaScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'C#',
        'UI/UX Design', 'Product Design', 'Database Design', 'SQL', 'MongoDB', 
        'Project Management', 'Agile', 'Scrum', 'DevOps', 'AWS', 'Azure', 'GCP'
      ],
      reportView: 'table',
      reportTimeframe: 'ytd',
      reportType: 'all',
      timeframeOptions: [
        { text: 'Year to Date', value: 'ytd' },
        { text: 'Last 6 Months', value: 'last6' },
        { text: 'Last 12 Months', value: 'last12' },
        { text: 'Custom Range', value: 'custom' }
      ],
      reportTypeOptions: [
        { text: 'All Resources', value: 'all' },
        { text: 'By Department', value: 'department' },
        { text: 'By Role', value: 'role' }
      ],
      selectedResource: null,
      dates: [],
      dateMenu: false,
      reportLoading: false,
      reportData: [],
      chartData: [],
      chartMetric: 'utilization',
      reportHeaders: [
        { text: 'Period', value: 'period', sortable: true },
        { text: 'Resource', value: 'resourceName', sortable: true },
        { text: 'Department', value: 'department', sortable: true },
        { text: 'Role', value: 'role', sortable: true },
        { text: 'Utilization %', value: 'utilization', sortable: true },
        { text: 'Billable Hours', value: 'billableHours', sortable: true },
        { text: 'Available Hours', value: 'availableHours', sortable: true },
        { text: 'Projects', value: 'projectCount', sortable: true }
      ]
    };
  },

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? 'New Resource' : 'Edit Resource';
    },
    
    isTimeOffFormValid() {
      return this.timeOffForm.startDate && 
             this.timeOffForm.endDate && 
             this.timeOffForm.reason && 
             this.timeOffForm.startDate <= this.timeOffForm.endDate;
    },
    
    filteredResources() {
      return this.resources.filter(resource => {
        // Check active status
        if (this.filters.activeOnly && !resource.isActive) {
          return false;
        }
        
        // Check availability status
        if (this.filters.availableOnly && 
            (resource.availabilityStatus === 'Fully Allocated' || 
             resource.availabilityStatus === 'Out of Office')) {
          return false;
        }
        
        // Check role filter
        if (this.filters.roles.length > 0 && !this.filters.roles.includes(resource.role)) {
          return false;
        }
        
        // Check department filter
        if (this.filters.departments.length > 0 && !this.filters.departments.includes(resource.department)) {
          return false;
        }
        
        // Check availability status filter
        if (this.filters.availability.length > 0 && 
            !this.filters.availability.includes(resource.availabilityStatus)) {
          return false;
        }
        
        // Check min available hours
        const availableHours = this.getAvailableHours(resource);
        if (availableHours < this.filters.minAvailableHours) {
          return false;
        }
        
        // Check required skills
        if (this.filters.skills.length > 0) {
          const resourceSkills = resource.skills || [];
          // Check if resource has ALL required skills
          const hasAllSkills = this.filters.skills.every(skill => 
            resourceSkills.includes(skill)
          );
          if (!hasAllSkills) {
            return false;
          }
        }
        
        return true;
      });
    },
    
    dateRangeText() {
      if (!this.dates || this.dates.length !== 2) return 'Select date range';
      return `${this.formatShortDate(this.dates[0])} - ${this.formatShortDate(this.dates[1])}`;
    }
  },

  watch: {
    dialogResource(val) {
      val || this.closeDialog();
    }
  },

  created() {
    this.fetchResources();
    this.initializeReportDates();
    this.generateResourceReport();
  },

  methods: {
    fetchResources() {
      this.loading = true;
      
      // Mock data for demo
      setTimeout(() => {
        this.resources = [
          {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '(555) 123-4567',
            department: 'Engineering',
            role: 'Senior Developer',
            isActive: true,
            skills: ['JavaScript', 'React', 'Node.js'],
            utilization: 85,
            availabilityStatus: 'Fully Allocated',
            maxWeeklyHours: 40,
            startDate: '2020-03-15',
            costRate: 85,
            billRate: 150
          },
          {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '(555) 987-6543',
            department: 'Design',
            role: 'UX Designer',
            isActive: true,
            skills: ['UI/UX Design', 'Figma', 'Sketch'],
            utilization: 75,
            availabilityStatus: 'Partially Available',
            maxWeeklyHours: 40,
            startDate: '2021-01-10',
            costRate: 75,
            billRate: 140
          },
          {
            id: 3,
            firstName: 'Michael',
            lastName: 'Johnson',
            email: 'michael.johnson@example.com',
            phone: '(555) 345-6789',
            department: 'Engineering',
            role: 'Junior Developer',
            isActive: true,
            skills: ['HTML', 'CSS', 'JavaScript'],
            utilization: 60,
            availabilityStatus: 'Available',
            maxWeeklyHours: 40,
            startDate: '2022-05-20',
            costRate: 55,
            billRate: 110
          },
          {
            id: 4,
            firstName: 'Emily',
            lastName: 'Davis',
            email: 'emily.davis@example.com',
            phone: '(555) 567-8901',
            department: 'Project Management',
            role: 'Project Manager',
            isActive: true,
            skills: ['Project Management', 'Agile', 'Scrum'],
            utilization: 90,
            availabilityStatus: 'Fully Allocated',
            maxWeeklyHours: 40,
            startDate: '2019-11-05',
            costRate: 90,
            billRate: 160
          },
          {
            id: 5,
            firstName: 'David',
            lastName: 'Wilson',
            email: 'david.wilson@example.com',
            phone: '(555) 234-5678',
            department: 'Engineering',
            role: 'DevOps Engineer',
            isActive: true,
            skills: ['AWS', 'Docker', 'Kubernetes'],
            utilization: 80,
            availabilityStatus: 'Partially Available',
            maxWeeklyHours: 40,
            startDate: '2020-08-12',
            costRate: 85,
            billRate: 150
          },
          {
            id: 6,
            firstName: 'Sarah',
            lastName: 'Taylor',
            email: 'sarah.taylor@example.com',
            phone: '(555) 678-9012',
            department: 'Design',
            role: 'Graphic Designer',
            isActive: false,
            skills: ['Photoshop', 'Illustrator', 'InDesign'],
            utilization: 0,
            availabilityStatus: 'On Leave',
            maxWeeklyHours: 40,
            startDate: '2021-02-15',
            costRate: 70,
            billRate: 130
          }
        ];
        
        // Add fullName property to each resource for searching
        this.resources.forEach(resource => {
          resource.fullName = `${resource.firstName} ${resource.lastName}`;
        });
        
        this.loading = false;
      }, 500);
    },

    calculateUtilization(user) {
      // For existing resources, calculate based on allocated hours vs max hours
      if (user.maxWeeklyHours && user.allocatedHours) {
        return Math.min(100, Math.round((user.allocatedHours / user.maxWeeklyHours) * 100));
      }
      
      // Fallback to random value for demonstration
      return Math.floor(Math.random() * 100);
    },

    getRoleColor(role) {
      const colorMap = {
        'Developer': 'indigo',
        'Designer': 'purple',
        'Project Manager': 'blue',
        'Business Analyst': 'cyan',
        'QA Engineer': 'teal',
        'DevOps': 'green',
        'Admin': 'red'
      };
      return colorMap[role] || 'grey';
    },

    getUtilizationColor(utilization) {
      if (utilization < 40) return 'green';
      if (utilization < 75) return 'amber';
      return 'red';
    },

    getStatusColor(status) {
      const colorMap = {
        'Active': 'green',
        'On Hold': 'orange',
        'Completed': 'blue',
        'Cancelled': 'red'
      };
      return colorMap[status] || 'grey';
    },

    formatCurrency(value) {
      return `$${value.toFixed(2)}`;
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    },
    
    formatDateRange(startDate, endDate) {
      if (!startDate || !endDate) return 'N/A';
      return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
    },

    getAvailableHours(resource) {
      const maxHours = resource.maxWeeklyHours || 40;
      const allocated = resource.allocatedHours || 0;
      return Math.max(0, maxHours - allocated);
    },
    
    getCapacityPercentage(resource) {
      const maxHours = resource.maxWeeklyHours || 40;
      const allocated = resource.allocatedHours || 0;
      return Math.min(100, Math.round((allocated / maxHours) * 100));
    },
    
    getAvailabilityColor(status) {
      const colorMap = {
        'Available': 'green',
        'Partially Available': 'amber',
        'Fully Allocated': 'red',
        'Upcoming Leave': 'blue',
        'Out of Office': 'grey'
      };
      return colorMap[status] || 'grey';
    },

    viewResource(item) {
      this.viewedResource = Object.assign({}, item);
      this.fetchResourceProjects(item.id);
      this.fetchResourceTimeOff(item.id);
      this.activeResourceTab = 0;
      this.dialogViewResource = true;
    },
    
    editResource(item) {
      this.editedIndex = this.resources.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialogViewResource = false;
      this.dialogResource = true;
    },

    confirmDelete(item) {
      this.editedIndex = this.resources.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.fetchResourceProjects(item.id);
      this.dialogDeleteConfirm = true;
    },

    deleteResource() {
      axios.delete(`/api/users/${this.editedItem.id}`)
        .then(() => {
          this.resources.splice(this.editedIndex, 1);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Resource deleted successfully',
            color: 'success'
          });
        })
        .catch(error => {
          console.error('Error deleting resource:', error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: 'Error deleting resource. Please try again.',
            color: 'error'
          });
        })
        .finally(() => {
          this.closeDelete();
        });
    },

    closeDelete() {
      this.dialogDeleteConfirm = false;
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    },

    closeDialog() {
      this.dialogResource = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        this.$refs.form.resetValidation();
      });
    },

    saveResource() {
      if (!this.$refs.form.validate()) return;

      const isNewResource = this.editedIndex === -1;
      const resourceData = {
        firstName: this.editedItem.firstName,
        lastName: this.editedItem.lastName,
        email: this.editedItem.email,
        phone: this.editedItem.phone,
        role: this.editedItem.role,
        department: this.editedItem.department,
        hourlyRate: this.editedItem.hourlyRate,
        isActive: this.editedItem.isActive,
        skills: this.editedItem.skills,
        maxWeeklyHours: this.editedItem.maxWeeklyHours,
        allocatedHours: this.editedItem.allocatedHours,
        availabilityStatus: this.editedItem.availabilityStatus,
        nextAvailableDate: this.editedItem.nextAvailableDate
      };

      // For a new resource, we need to include password for user creation
      if (isNewResource) {
        // For demo purposes, set a default password
        resourceData.password = 'tempPassword123';
        // In production, you might generate a random password or
        // implement a separate flow to set passwords
      }

      const request = isNewResource
        ? axios.post('/api/users', resourceData)
        : axios.put(`/api/users/${this.editedItem.id}`, resourceData);

      request
        .then(response => {
          if (isNewResource) {
            // Format the response data to match our resource structure
            const newResource = {
              id: response.data._id,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              fullName: `${response.data.firstName} ${response.data.lastName}`,
              email: response.data.email,
              phone: response.data.phone || '',
              role: response.data.role,
              department: response.data.department,
              hourlyRate: response.data.hourlyRate || 0,
              isActive: response.data.isActive !== undefined ? response.data.isActive : true,
              utilization: 0, // New resources start with 0 utilization
              skills: response.data.skills || [],
              maxWeeklyHours: response.data.maxWeeklyHours || 40,
              allocatedHours: response.data.allocatedHours || 0,
              availabilityStatus: response.data.availabilityStatus || 'Available',
              nextAvailableDate: response.data.nextAvailableDate || null
            };
            this.resources.push(newResource);
          } else {
            // Update the existing resource
            const updatedResource = {
              ...this.resources[this.editedIndex],
              firstName: resourceData.firstName,
              lastName: resourceData.lastName,
              fullName: `${resourceData.firstName} ${resourceData.lastName}`,
              email: resourceData.email,
              phone: resourceData.phone,
              role: resourceData.role,
              department: resourceData.department,
              hourlyRate: resourceData.hourlyRate,
              isActive: resourceData.isActive,
              skills: resourceData.skills,
              maxWeeklyHours: resourceData.maxWeeklyHours,
              allocatedHours: resourceData.allocatedHours,
              availabilityStatus: resourceData.availabilityStatus,
              nextAvailableDate: resourceData.nextAvailableDate
            };
            Object.assign(this.resources[this.editedIndex], updatedResource);
          }

          this.$store.dispatch('setSnackbar', {
            show: true,
            text: `Resource ${isNewResource ? 'added' : 'updated'} successfully`,
            color: 'success'
          });
          this.closeDialog();
        })
        .catch(error => {
          console.error(`Error ${isNewResource ? 'adding' : 'updating'} resource:`, error);
          this.$store.dispatch('setSnackbar', {
            show: true,
            text: `Error ${isNewResource ? 'adding' : 'updating'} resource. Please try again.`,
            color: 'error'
          });
        });
    },

    editAvailability() {
      if (!this.viewedResource) return;
      
      this.availabilityForm = {
        status: this.viewedResource.availabilityStatus || 'Available',
        maxWeeklyHours: this.viewedResource.maxWeeklyHours || 40,
        nextAvailableDate: this.viewedResource.nextAvailableDate || null
      };
      
      this.dialogAvailability = true;
    },
    
    saveAvailability() {
      if (!this.viewedResource) return;
      
      // Update the viewed resource with the new availability data
      this.viewedResource.availabilityStatus = this.availabilityForm.status;
      this.viewedResource.maxWeeklyHours = this.availabilityForm.maxWeeklyHours;
      this.viewedResource.nextAvailableDate = this.availabilityForm.nextAvailableDate;
      
      // Update the resource in the resources array
      const index = this.resources.findIndex(r => r.id === this.viewedResource.id);
      if (index !== -1) {
        this.resources[index].availabilityStatus = this.availabilityForm.status;
        this.resources[index].maxWeeklyHours = this.availabilityForm.maxWeeklyHours;
        this.resources[index].nextAvailableDate = this.availabilityForm.nextAvailableDate;
      }
      
      // In a real app, save to backend
      /*
      axios.put(`/api/users/${this.viewedResource.id}/availability`, {
        availabilityStatus: this.availabilityForm.status,
        maxWeeklyHours: this.availabilityForm.maxWeeklyHours,
        nextAvailableDate: this.availabilityForm.nextAvailableDate,
        timeOff: this.resourceTimeOff
      })
      .then(() => {
        this.$store.dispatch('setSnackbar', {
          show: true,
          text: 'Availability updated successfully',
          color: 'success'
        });
      })
      .catch(error => {
        console.error('Error updating availability:', error);
        this.$store.dispatch('setSnackbar', {
          show: true,
          text: 'Error updating availability',
          color: 'error'
        });
      });
      */
      
      // For demo purposes, just show a success message
      this.$store.dispatch('setSnackbar', {
        show: true,
        text: 'Availability updated successfully',
        color: 'success'
      });
      
      this.dialogAvailability = false;
    },
    
    addTimeOff() {
      if (!this.isTimeOffFormValid) return;
      
      this.resourceTimeOff.push({
        startDate: this.timeOffForm.startDate,
        endDate: this.timeOffForm.endDate,
        reason: this.timeOffForm.reason,
        approved: false
      });
      
      // Reset the form
      this.timeOffForm = {
        startDate: null,
        endDate: null,
        reason: '',
        approved: false
      };
    },
    
    removeTimeOff(index) {
      this.resourceTimeOff.splice(index, 1);
    },
    
    fetchResourceTimeOff(resourceId) {
      // In a real app, this would fetch time off from the backend
      // For demo purposes, use mock data
      this.resourceTimeOff = [
        {
          startDate: '2023-12-24',
          endDate: '2023-12-31',
          reason: 'Holiday Break',
          approved: true
        },
        {
          startDate: '2024-03-15',
          endDate: '2024-03-22',
          reason: 'Spring Vacation',
          approved: false
        }
      ];
    },
    
    // eslint-disable-next-line no-unused-vars
    fetchResourceProjects(resourceId) {
      // This would fetch projects assigned to this resource
      // For now, use mock data for demonstration
      this.resourceProjects = [
        { 
          id: 1, 
          name: 'Website Redesign', 
          status: 'Active', 
          resourceRole: 'Developer',
          hoursPerWeek: 15
        },
        { 
          id: 2, 
          name: 'Mobile App Development', 
          status: 'On Hold', 
          resourceRole: 'Lead Developer',
          hoursPerWeek: 10
        }
      ];
      
      // Calculate allocated hours
      const allocatedHours = this.resourceProjects.reduce((total, project) => {
        return total + (project.hoursPerWeek || 0);
      }, 0);
      
      // Update the viewed resource
      if (this.viewedResource) {
        this.viewedResource.allocatedHours = allocatedHours;
        
        // Also update in the resources array
        const index = this.resources.findIndex(r => r.id === this.viewedResource.id);
        if (index !== -1) {
          this.resources[index].allocatedHours = allocatedHours;
        }
      }
      
      // Real implementation would be:
      /*
      axios.get(`/api/projects/resource/${resourceId}`)
        .then(response => {
          this.resourceProjects = response.data;
          
          // Calculate allocated hours
          const allocatedHours = this.resourceProjects.reduce((total, project) => {
            return total + (project.hoursPerWeek || 0);
          }, 0);
          
          // Update the viewed resource
          if (this.viewedResource) {
            this.viewedResource.allocatedHours = allocatedHours;
            
            // Also update in the resources array
            const index = this.resources.findIndex(r => r.id === this.viewedResource.id);
            if (index !== -1) {
              this.resources[index].allocatedHours = allocatedHours;
            }
          }
        })
        .catch(error => {
          console.error('Error fetching resource projects:', error);
          this.resourceProjects = [];
        });
      */
    },

    clearFilters() {
      this.filters = {
        roles: [],
        departments: [],
        skills: [],
        availability: [],
        activeOnly: false,
        availableOnly: false,
        minAvailableHours: 0
      };
    },

    applyFilters() {
      // This method could add additional logic if needed
      this.showFilters = false;
    },
    
    // Find resources with specific skills
    findResourcesBySkills(skills) {
      if (!skills || !skills.length) return this.resources;
      
      return this.resources.filter(resource => {
        const resourceSkills = resource.skills || [];
        return skills.every(skill => resourceSkills.includes(skill));
      });
    },
    
    // Find available resources
    findAvailableResources(minHours = 0) {
      return this.resources.filter(resource => {
        if (!resource.isActive) return false;
        
        const availableHours = this.getAvailableHours(resource);
        return availableHours >= minHours;
      });
    },

    initializeReportDates() {
      const today = new Date();
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      this.dates = [
        firstDayOfYear.toISOString().substr(0, 10),
        today.toISOString().substr(0, 10)
      ];
    },
    
    formatShortDate(dateString) {
      return moment(dateString).format('MMM DD, YYYY');
    },
    
    resetReportFilters() {
      this.reportTimeframe = 'ytd';
      this.reportType = 'all';
      this.selectedResource = null;
      this.initializeReportDates();
      this.generateResourceReport();
    },
    
    generateResourceReport() {
      this.reportLoading = true;
      
      // Set date range based on selected timeframe
      if (this.reportTimeframe !== 'custom') {
        const today = new Date();
        let startDate;
        
        switch (this.reportTimeframe) {
          case 'ytd':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
          case 'last6':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 6);
            break;
          case 'last12':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 12);
            break;
          default:
            startDate = new Date(today.getFullYear(), 0, 1);
        }
        
        this.dates = [
          startDate.toISOString().substr(0, 10),
          today.toISOString().substr(0, 10)
        ];
      }
      
      // In a real app, this would be an API call
      setTimeout(() => {
        // Generate mock data
        this.generateMockReportData();
        this.reportLoading = false;
      }, 800);
    },
    
    generateMockReportData() {
      const months = [];
      const startDate = moment(this.dates[0]);
      const endDate = moment(this.dates[1]);
      let currentDate = moment(startDate);
      
      // Create array of months between start and end dates
      while (currentDate.isSameOrBefore(endDate, 'month')) {
        months.push(currentDate.format('YYYY-MM'));
        currentDate.add(1, 'month');
      }
      
      // Filter resources if a specific one is selected
      const filteredResources = this.selectedResource ? 
        this.resources.filter(r => r.id === this.selectedResource) : 
        this.resources;
      
      // Generate report data based on months and resources
      this.reportData = [];
      this.chartData = [];
      
      // Group data by month or resource based on report type
      if (this.reportType === 'all' && this.selectedResource) {
        // Generate monthly data for a single resource
        months.forEach(month => {
          const resource = filteredResources[0];
          const monthData = this.generateResourceMonthData(resource, month);
          this.reportData.push(monthData);
          this.chartData.push(monthData);
        });
      } else if (this.reportType === 'all') {
        // Generate aggregated monthly data for all resources
        months.forEach(month => {
          const monthYear = moment(month).format('MMM YYYY');
          const utilization = Math.floor(Math.random() * 35) + 45; // 45-80%
          const billableHours = Math.floor(Math.random() * 500) + 1500; // 1500-2000
          const availableHours = Math.floor(Math.random() * 300) + 700; // 700-1000
          
          const monthData = {
            period: monthYear,
            resourceName: 'All Resources',
            department: 'All Departments',
            role: 'All Roles',
            utilization: utilization,
            billableHours: billableHours,
            availableHours: availableHours,
            projectCount: Math.floor(Math.random() * 10) + 10 // 10-20
          };
          
          this.reportData.push(monthData);
          this.chartData.push(monthData);
        });
        
        // Add detailed data for each resource in the latest month
        const latestMonth = months[months.length - 1];
        filteredResources.forEach(resource => {
          const resourceData = this.generateResourceMonthData(resource, latestMonth);
          this.reportData.push(resourceData);
        });
      } else if (this.reportType === 'department' || this.reportType === 'role') {
        // Group by department or role
        const groupField = this.reportType === 'department' ? 'department' : 'role';
        const groupMap = {};
        
        // First, group resources by department/role
        filteredResources.forEach(resource => {
          const groupValue = resource[groupField];
          if (!groupMap[groupValue]) {
            groupMap[groupValue] = [];
          }
          groupMap[groupValue].push(resource);
        });
        
        // Generate aggregated data for each group and month
        Object.keys(groupMap).forEach(groupValue => {
          const groupResources = groupMap[groupValue];
          
          months.forEach(month => {
            const monthYear = moment(month).format('MMM YYYY');
            const utilization = Math.floor(Math.random() * 35) + 45; // 45-80%
            const billableHours = Math.floor(Math.random() * 200) + 300; // 300-500
            const availableHours = Math.floor(Math.random() * 100) + 150; // 150-250
            
            const groupData = {
              period: monthYear,
              resourceName: `${groupValue} (${groupResources.length} resources)`,
              department: this.reportType === 'department' ? groupValue : 'Multiple',
              role: this.reportType === 'role' ? groupValue : 'Multiple',
              utilization: utilization,
              billableHours: billableHours,
              availableHours: availableHours,
              projectCount: Math.floor(Math.random() * 5) + 3 // 3-8
            };
            
            this.reportData.push(groupData);
            if (months.indexOf(month) === months.length - 1) {
              this.chartData.push(groupData);
            }
          });
        });
        
        // Create chart data - one bar per group
        if (this.reportType === 'department') {
          this.chartData = Object.keys(groupMap).map(dept => {
            return {
              period: dept,
              utilization: Math.floor(Math.random() * 35) + 45,
              billableHours: Math.floor(Math.random() * 500) + 500,
              availableHours: Math.floor(Math.random() * 300) + 300
            };
          });
        }
      }
    },
    
    generateResourceMonthData(resource, month) {
      const monthYear = moment(month).format('MMM YYYY');
      const utilization = Math.floor(Math.random() * 40) + 40; // 40-80%
      const billableHours = Math.floor(Math.random() * 50) + 100; // 100-150
      const availableHours = Math.floor(Math.random() * 20) + 20; // 20-40
      
      return {
        period: monthYear,
        resourceName: resource.fullName || `${resource.firstName} ${resource.lastName}`,
        department: resource.department,
        role: resource.role,
        utilization: utilization,
        billableHours: billableHours,
        availableHours: availableHours,
        projectCount: Math.floor(Math.random() * 3) + 1 // 1-3
      };
    },
    
    formatChartValue(value, metric) {
      if (metric === 'utilization') {
        return `${value}%`;
      } else {
        return `${value}h`;
      }
    },
    
    getBarHeight(value) {
      let maxValue;
      
      if (this.chartMetric === 'utilization') {
        maxValue = 100;
        return (value / maxValue) * 200;
      } else if (this.chartMetric === 'billableHours') {
        maxValue = 2000;
        return (value / maxValue) * 200;
      } else {
        maxValue = 1000;
        return (value / maxValue) * 200;
      }
    },
    
    getBarColor(value, metric) {
      if (metric === 'utilization') {
        if (value < 40) return '#E57373';
        if (value < 70) return '#FFB74D';
        return '#81C784';
      } else if (metric === 'billableHours') {
        if (value < 500) return '#E57373'; 
        if (value < 1000) return '#FFB74D';
        return '#81C784';
      } else {
        if (value < 200) return '#81C784';
        if (value < 500) return '#FFB74D';
        return '#E57373';
      }
    }
  }
};
</script>

<style scoped>
.resources-container {
  padding: 20px;
}

.resources-title {
  color: #333;
  font-weight: 500;
}

.search-field {
  max-width: 300px;
}

.resource-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.resource-details h3 {
  margin-bottom: 8px;
  font-size: 1.2rem;
  color: #333;
}

.resource-details p {
  margin-bottom: 4px;
  color: #666;
}

.resource-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.projects-assigned {
  margin-top: 24px;
}

.projects-table {
  margin-top: 8px;
}

.resource-dialog .v-card__title {
  padding-bottom: 8px;
}

.utilization-meter {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
}

.v-chip {
  margin: 2px;
}

.resource-details-section {
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.filter-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.actions-column {
  width: 120px;
}

.dialog-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}

.v-card__subtitle {
  font-size: 14px;
  color: #666;
  padding-top: 0;
}

.simple-chart-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 250px;
  margin: 20px 0;
  border-bottom: 1px solid #e0e0e0;
}

.month-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 50px;
}

.month-bar {
  width: 30px;
  border-radius: 3px 3px 0 0;
  position: relative;
  display: flex;
  justify-content: center;
  transition: height 0.5s ease;
}

.month-value {
  position: absolute;
  top: -25px;
  font-size: 12px;
  white-space: nowrap;
}

.month-label {
  margin-top: 8px;
  font-size: 12px;
  white-space: nowrap;
  transform: rotate(-45deg);
  text-align: left;
  width: 70px;
  height: 30px;
}
</style>
