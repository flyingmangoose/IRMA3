import { shallowMount } from '@vue/test-utils';
import ResourceAllocation from '@/components/ResourceAllocation.vue';
import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

describe('ResourceAllocation.vue', () => {
  let vuetify;
  let wrapper;

  beforeEach(() => {
    vuetify = new Vuetify();
    wrapper = shallowMount(ResourceAllocation, {
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
    expect(wrapper.find('.v-card__title').text()).toContain('Resource Allocation');
  });

  it('has the correct number of resources in the mock data', () => {
    expect(wrapper.vm.resources.length).toBe(4);
  });

  it('has the correct number of projects in the mock data', () => {
    expect(wrapper.vm.projects.length).toBe(2);
  });

  it('formats date correctly', () => {
    const testDate = new Date('2025-04-01');
    expect(wrapper.vm.formatDateShort(testDate)).toBeTruthy();
  });

  it('identifies weekends correctly', () => {
    const weekday = new Date('2025-04-18'); // Friday
    const weekend = new Date('2025-04-19'); // Saturday
    
    expect(wrapper.vm.isWeekend(weekday)).toBe(false);
    expect(wrapper.vm.isWeekend(weekend)).toBe(true);
  });

  it('calculates allocation for a date correctly', () => {
    const resource = wrapper.vm.resources[0]; // John Smith
    const date = new Date('2025-04-18');
    const dateStr = date.toISOString().substr(0, 10);
    
    expect(wrapper.vm.getAllocationForDate(resource, date)).toBe(6);
  });

  it('calculates resource allocation for a project correctly', () => {
    const resource = wrapper.vm.resources[0]; // John Smith
    const projectId = 'proj1';
    
    // Set date range to include all of April
    wrapper.setData({
      dateRange: [
        '2025-04-01',
        '2025-04-30'
      ]
    });
    
    expect(wrapper.vm.getResourceAllocationForProject(resource, projectId)).toBeGreaterThan(0);
  });

  it('gets resource projects correctly', () => {
    const resource = wrapper.vm.resources[0]; // John Smith
    const projects = wrapper.vm.getResourceProjects(resource);
    
    expect(projects.length).toBe(2);
    expect(projects[0].name).toBeTruthy();
    expect(projects[0].allocation).toBeGreaterThanOrEqual(0);
  });

  it('calculates utilization percentage correctly', () => {
    const resource = wrapper.vm.resources[0]; // John Smith
    
    // Set date range to include all of April
    wrapper.setData({
      dateRange: [
        '2025-04-01',
        '2025-04-30'
      ]
    });
    
    const utilization = wrapper.vm.getUtilizationPercentage(resource);
    expect(utilization).toBeGreaterThanOrEqual(0);
    expect(utilization).toBeLessThanOrEqual(100);
  });

  it('assigns the correct color to utilization values', () => {
    expect(wrapper.vm.getUtilizationColorByValue(110)).toBe('error');
    expect(wrapper.vm.getUtilizationColorByValue(95)).toBe('warning');
    expect(wrapper.vm.getUtilizationColorByValue(80)).toBe('success');
    expect(wrapper.vm.getUtilizationColorByValue(50)).toBe('info');
  });

  it('assigns the correct color to status values', () => {
    expect(wrapper.vm.getStatusColor('Active')).toBe('success');
    expect(wrapper.vm.getStatusColor('On Hold')).toBe('warning');
    expect(wrapper.vm.getStatusColor('Completed')).toBe('info');
    expect(wrapper.vm.getStatusColor('Cancelled')).toBe('error');
    expect(wrapper.vm.getStatusColor('Unknown')).toBe('grey');
  });

  it('identifies overallocated resources correctly', () => {
    const overallocatedResource = wrapper.vm.resources[2]; // Bob Johnson
    const normalResource = wrapper.vm.resources[3]; // Alice Williams
    
    expect(wrapper.vm.isResourceOverallocated(overallocatedResource)).toBe(true);
    expect(wrapper.vm.isResourceOverallocated(normalResource)).toBe(false);
  });

  it('filters resources correctly', async () => {
    // Filter by project
    wrapper.setData({ selectedProjects: ['proj1'] });
    await Vue.nextTick();
    expect(wrapper.vm.filteredResources.length).toBeGreaterThan(0);
    
    // Filter by department
    wrapper.setData({ 
      selectedProjects: [],
      selectedDepartments: ['Development'] 
    });
    await Vue.nextTick();
    expect(wrapper.vm.filteredResources.length).toBe(2);
    
    // Filter by overallocation
    wrapper.setData({ 
      selectedProjects: [],
      selectedDepartments: [],
      showOverallocatedOnly: true 
    });
    await Vue.nextTick();
    expect(wrapper.vm.filteredResources.length).toBe(1);
  });

  it('shows resource details correctly', async () => {
    const resource = wrapper.vm.resources[0]; // John Smith
    
    wrapper.vm.showResourceDetails(resource);
    expect(wrapper.vm.selectedResource).toBe(resource);
    expect(wrapper.vm.detailsDialog).toBe(true);
  });

  it('generates calendar dates correctly', async () => {
    wrapper.setData({
      dateRange: [
        '2025-04-01',
        '2025-04-07'
      ]
    });
    
    expect(wrapper.vm.calendarDates.length).toBe(7);
  });

  it('generates chart options correctly', async () => {
    // Set date range to include all of April
    wrapper.setData({
      dateRange: [
        '2025-04-01',
        '2025-04-30'
      ]
    });
    
    expect(wrapper.vm.chartOption).toBeTruthy();
    expect(wrapper.vm.chartOption.series).toBeTruthy();
    expect(wrapper.vm.chartOption.series.length).toBe(2); // Two projects
    
    // Test resource chart option
    wrapper.vm.selectedResource = wrapper.vm.resources[0];
    expect(wrapper.vm.resourceChartOption).toBeTruthy();
    expect(wrapper.vm.resourceChartOption.series).toBeTruthy();
    expect(wrapper.vm.resourceChartOption.series.length).toBe(3); // Two projects + capacity line
  });
});
