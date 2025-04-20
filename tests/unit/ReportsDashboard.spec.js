import { shallowMount } from '@vue/test-utils';
import ReportsDashboard from '@/components/ReportsDashboard.vue';
import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

describe('ReportsDashboard.vue', () => {
  let vuetify;
  let wrapper;

  beforeEach(() => {
    vuetify = new Vuetify();
    wrapper = shallowMount(ReportsDashboard, {
      vuetify,
      propsData: {},
      mocks: {},
      stubs: {},
      methods: {},
    });
  });

  it('renders the component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('displays the correct title', () => {
    expect(wrapper.find('.v-card__title').text()).toContain('Reports & Analytics');
  });

  it('has the correct number of reports in the mock data', () => {
    expect(wrapper.vm.myReports.length).toBe(3);
    expect(wrapper.vm.reportTemplates.length).toBe(2);
    expect(wrapper.vm.scheduledReports.length).toBe(2);
  });

  it('assigns the correct color to report types', () => {
    expect(wrapper.vm.getReportTypeColor('Time')).toBe('primary');
    expect(wrapper.vm.getReportTypeColor('Budget')).toBe('success');
    expect(wrapper.vm.getReportTypeColor('Client')).toBe('info');
    expect(wrapper.vm.getReportTypeColor('Project')).toBe('warning');
    expect(wrapper.vm.getReportTypeColor('Resource')).toBe('purple');
    expect(wrapper.vm.getReportTypeColor('Custom')).toBe('grey');
  });

  it('formats date time correctly', () => {
    const testDate = new Date('2025-04-01T12:00:00Z');
    expect(wrapper.vm.formatDateTime(testDate)).toBeTruthy();
  });

  it('opens the create report dialog when new report button is clicked', async () => {
    const addButton = wrapper.find('.v-card__title button');
    await addButton.trigger('click');
    expect(wrapper.vm.createReportDialog).toBe(true);
  });

  it('validates the report form correctly', async () => {
    wrapper.vm.reportForm = {
      name: '',
      type: 'Time',
      parameters: {},
      format: 'Table',
      chartType: 'Bar',
      isTemplate: false,
      isScheduled: false
    };
    
    // Mock the validate method
    wrapper.vm.$refs.reportForm = {
      validate: () => false
    };
    
    wrapper.vm.saveReport();
    // The report should not be added due to validation failure
    expect(wrapper.vm.myReports.length).toBe(3);
  });

  it('adds a new report correctly', async () => {
    wrapper.vm.reportForm = {
      name: 'New Test Report',
      description: 'Test description',
      type: 'Time',
      parameters: {
        startDate: '2025-04-01',
        endDate: '2025-04-30'
      },
      format: 'Table',
      chartType: 'Bar',
      isTemplate: false,
      isScheduled: false
    };
    
    // Mock the validate method
    wrapper.vm.$refs.reportForm = {
      validate: () => true
    };
    
    const initialCount = wrapper.vm.myReports.length;
    wrapper.vm.saveReport();
    expect(wrapper.vm.myReports.length).toBe(initialCount + 1);
    
    const newReport = wrapper.vm.myReports.find(r => r.name === 'New Test Report');
    expect(newReport).toBeTruthy();
    expect(newReport.description).toBe('Test description');
    expect(newReport.type).toBe('Time');
    expect(newReport.format).toBe('Table');
  });

  it('adds a new template correctly', async () => {
    wrapper.vm.reportForm = {
      name: 'New Template',
      description: 'Template description',
      type: 'Budget',
      parameters: {},
      format: 'Chart',
      chartType: 'Pie',
      isTemplate: true,
      isScheduled: false
    };
    
    // Mock the validate method
    wrapper.vm.$refs.reportForm = {
      validate: () => true
    };
    
    const initialCount = wrapper.vm.reportTemplates.length;
    wrapper.vm.saveReport();
    expect(wrapper.vm.reportTemplates.length).toBe(initialCount + 1);
    
    const newTemplate = wrapper.vm.reportTemplates.find(r => r.name === 'New Template');
    expect(newTemplate).toBeTruthy();
    expect(newTemplate.description).toBe('Template description');
    expect(newTemplate.type).toBe('Budget');
    expect(newTemplate.format).toBe('Chart');
    expect(newTemplate.chartType).toBe('Pie');
    expect(newTemplate.isTemplate).toBe(true);
  });

  it('adds a new scheduled report correctly', async () => {
    wrapper.vm.reportForm = {
      name: 'New Scheduled Report',
      description: 'Scheduled report description',
      type: 'Project',
      parameters: {},
      format: 'Combined',
      chartType: 'Bar',
      isTemplate: false,
      isScheduled: true,
      schedule: {
        frequency: 'Weekly',
        dayOfWeek: 1,
        recipients: ['test@example.com']
      }
    };
    
    // Mock the validate method
    wrapper.vm.$refs.reportForm = {
      validate: () => true
    };
    
    const initialCount = wrapper.vm.scheduledReports.length;
    wrapper.vm.saveReport();
    expect(wrapper.vm.scheduledReports.length).toBe(initialCount + 1);
    
    const newScheduledReport = wrapper.vm.scheduledReports.find(r => r.name === 'New Scheduled Report');
    expect(newScheduledReport).toBeTruthy();
    expect(newScheduledReport.description).toBe('Scheduled report description');
    expect(newScheduledReport.type).toBe('Project');
    expect(newScheduledReport.format).toBe('Combined');
    expect(newScheduledReport.isScheduled).toBe(true);
    expect(newScheduledReport.schedule.frequency).toBe('Weekly');
    expect(newScheduledReport.schedule.dayOfWeek).toBe(1);
    expect(newScheduledReport.schedule.recipients).toContain('test@example.com');
  });

  it('edits an existing report correctly', async () => {
    const reportToEdit = wrapper.vm.myReports[0];
    wrapper.vm.editReport(reportToEdit);
    
    expect(wrapper.vm.editMode).toBe(true);
    expect(wrapper.vm.reportForm.name).toBe(reportToEdit.name);
    
    // Update the report's information
    wrapper.vm.reportForm.name = 'Updated Report';
    wrapper.vm.reportForm.description = 'Updated description';
    
    // Mock the validate method
    wrapper.vm.$refs.reportForm = {
      validate: () => true
    };
    
    wrapper.vm.saveReport();
    
    // Find the updated report
    const updatedReport = wrapper.vm.myReports.find(r => r.id === reportToEdit.id);
    expect(updatedReport.name).toBe('Updated Report');
    expect(updatedReport.description).toBe('Updated description');
  });

  it('deletes a report correctly', async () => {
    // Mock the confirm dialog to return true
    global.confirm = jest.fn(() => true);
    
    const reportToDelete = wrapper.vm.myReports[0];
    const initialCount = wrapper.vm.myReports.length;
    
    wrapper.vm.deleteReport(reportToDelete);
    
    expect(wrapper.vm.myReports.length).toBe(initialCount - 1);
    expect(wrapper.vm.myReports.find(r => r.id === reportToDelete.id)).toBeUndefined();
  });

  it('runs a report correctly', async () => {
    const reportToRun = wrapper.vm.myReports[0];
    wrapper.vm.runReport(reportToRun);
    
    expect(wrapper.vm.currentReport).toBe(reportToRun);
    expect(wrapper.vm.reportResultsDialog).toBe(true);
    expect(wrapper.vm.reportResults.length).toBeGreaterThan(0);
  });

  it('uses a template correctly', async () => {
    const templateToUse = wrapper.vm.reportTemplates[0];
    wrapper.vm.useTemplate(templateToUse);
    
    expect(wrapper.vm.editMode).toBe(false);
    expect(wrapper.vm.reportForm.name).toBe(`${templateToUse.name} Copy`);
    expect(wrapper.vm.reportForm.isTemplate).toBe(false);
    expect(wrapper.vm.createReportDialog).toBe(true);
  });

  it('toggles schedule correctly', async () => {
    const reportToToggle = wrapper.vm.scheduledReports[0];
    const initialState = reportToToggle.isScheduled;
    
    wrapper.vm.toggleSchedule(reportToToggle);
    
    expect(reportToToggle.isScheduled).toBe(!initialState);
  });

  it('generates chart options correctly', () => {
    // Set up a mock report and results
    wrapper.vm.currentReport = {
      type: 'Time',
      chartType: 'Bar'
    };
    wrapper.vm.reportResults = [
      {
        user: 'John Smith',
        totalHours: 40
      },
      {
        user: 'Jane Doe',
        totalHours: 38
      }
    ];
    
    const chartOption = wrapper.vm.getReportChartOption();
    expect(chartOption).toBeTruthy();
    expect(chartOption.series).toBeTruthy();
    expect(chartOption.series[0].data).toHaveLength(2);
    expect(chartOption.series[0].data[0]).toBe(40);
    expect(chartOption.series[0].data[1]).toBe(38);
  });
});
