import { shallowMount } from '@vue/test-utils';
import UserManagement from '@/components/UserManagement.vue';
import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

describe('UserManagement.vue', () => {
  let vuetify;
  let wrapper;

  beforeEach(() => {
    vuetify = new Vuetify();
    wrapper = shallowMount(UserManagement, {
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
    expect(wrapper.find('.v-card__title').text()).toContain('User Management');
  });

  it('has the correct number of users in the mock data', () => {
    expect(wrapper.vm.users.length).toBe(5);
  });

  it('filters users by role correctly', async () => {
    wrapper.setData({ roleFilter: 'admin' });
    await Vue.nextTick();
    expect(wrapper.vm.filteredUsers.length).toBe(1);
    expect(wrapper.vm.filteredUsers[0].role).toBe('admin');
  });

  it('filters users by department correctly', async () => {
    wrapper.setData({ departmentFilter: 'Development' });
    await Vue.nextTick();
    expect(wrapper.vm.filteredUsers.length).toBe(2);
    expect(wrapper.vm.filteredUsers[0].department).toBe('Development');
    expect(wrapper.vm.filteredUsers[1].department).toBe('Development');
  });

  it('formats roles correctly', () => {
    expect(wrapper.vm.formatRole('admin')).toBe('Admin');
    expect(wrapper.vm.formatRole('employee')).toBe('Employee');
  });

  it('assigns the correct color to roles', () => {
    expect(wrapper.vm.getRoleColor('admin')).toBe('purple');
    expect(wrapper.vm.getRoleColor('manager')).toBe('primary');
    expect(wrapper.vm.getRoleColor('supervisor')).toBe('success');
    expect(wrapper.vm.getRoleColor('employee')).toBe('info');
  });

  it('opens the create user dialog when add user button is clicked', async () => {
    const addButton = wrapper.find('.v-card__title button');
    await addButton.trigger('click');
    expect(wrapper.vm.createUserDialog).toBe(true);
  });

  it('validates the user form correctly', async () => {
    wrapper.vm.userForm = {
      firstName: '',
      lastName: 'Doe',
      email: 'invalid-email',
      phone: '555-1234',
      department: 'Development',
      role: 'employee',
      hourlyRate: 75,
      password: '123', // too short
      confirmPassword: '1234' // doesn't match
    };
    
    // Mock the validate method
    wrapper.vm.$refs.userForm = {
      validate: () => false
    };
    
    wrapper.vm.saveUser();
    // The user should not be added due to validation failure
    expect(wrapper.vm.users.length).toBe(5);
  });

  it('adds a new user correctly', async () => {
    wrapper.vm.userForm = {
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      phone: '555-9999',
      department: 'Sales',
      role: 'employee',
      hourlyRate: 65,
      password: 'password123',
      confirmPassword: 'password123'
    };
    
    // Mock the validate method
    wrapper.vm.$refs.userForm = {
      validate: () => true
    };
    
    const initialCount = wrapper.vm.users.length;
    wrapper.vm.saveUser();
    expect(wrapper.vm.users.length).toBe(initialCount + 1);
    
    const newUser = wrapper.vm.users.find(u => u.email === 'new@example.com');
    expect(newUser).toBeTruthy();
    expect(newUser.firstName).toBe('New');
    expect(newUser.lastName).toBe('User');
    expect(newUser.department).toBe('Sales');
    expect(newUser.role).toBe('employee');
  });

  it('edits an existing user correctly', async () => {
    const userToEdit = wrapper.vm.users[0];
    wrapper.vm.editUser(userToEdit);
    
    expect(wrapper.vm.editMode).toBe(true);
    expect(wrapper.vm.userForm.id).toBe(userToEdit.id);
    expect(wrapper.vm.userForm.firstName).toBe(userToEdit.firstName);
    
    // Update the user's information
    wrapper.vm.userForm.firstName = 'Updated';
    wrapper.vm.userForm.department = 'Sales';
    
    // Mock the validate method
    wrapper.vm.$refs.userForm = {
      validate: () => true
    };
    
    wrapper.vm.saveUser();
    
    // Find the updated user
    const updatedUser = wrapper.vm.users.find(u => u.id === userToEdit.id);
    expect(updatedUser.firstName).toBe('Updated');
    expect(updatedUser.department).toBe('Sales');
  });

  it('deletes a user correctly', async () => {
    // Mock the confirm dialog to return true
    global.confirm = jest.fn(() => true);
    
    const userToDelete = wrapper.vm.users[0];
    const initialCount = wrapper.vm.users.length;
    
    wrapper.vm.deleteUser(userToDelete);
    
    expect(wrapper.vm.users.length).toBe(initialCount - 1);
    expect(wrapper.vm.users.find(u => u.id === userToDelete.id)).toBeUndefined();
  });

  it('manages 2FA correctly', async () => {
    const userWithout2FA = wrapper.vm.users.find(u => !u.twoFactorEnabled);
    wrapper.vm.selectedUser = userWithout2FA;
    
    wrapper.vm.manage2FA();
    expect(wrapper.vm.twoFactorDialog).toBe(true);
    expect(wrapper.vm.twoFactorQR).toBeTruthy();
    
    // Mock the validate method
    wrapper.vm.$refs.twoFactorForm = {
      validate: () => true
    };
    
    wrapper.vm.twoFactorCode = '123456';
    wrapper.vm.updateTwoFactor();
    
    // The user should now have 2FA enabled
    const updatedUser = wrapper.vm.users.find(u => u.id === userWithout2FA.id);
    expect(updatedUser.twoFactorEnabled).toBe(true);
    
    // Now test disabling 2FA
    wrapper.vm.selectedUser = updatedUser;
    wrapper.vm.manage2FA();
    wrapper.vm.updateTwoFactor();
    
    // The user should now have 2FA disabled
    const finalUser = wrapper.vm.users.find(u => u.id === userWithout2FA.id);
    expect(finalUser.twoFactorEnabled).toBe(false);
  });
});
