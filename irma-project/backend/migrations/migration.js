const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Timesheet = require('../models/Timesheet');
const Invoice = require('../models/Invoice');
const Report = require('../models/Report');

// Sample data for initial setup
const sampleData = {
  users: [
    {
      username: 'admin',
      email: 'admin@irma.com',
      password: '$2a$10$XFE0rQyZ5GFMBVWNvX0KQeKl8d2/AcWwHnHD0FaslbVFJdAR/xyNO', // hashed 'password123'
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      department: 'Administration',
      hourlyRate: 100,
      isActive: true
    },
    {
      username: 'manager',
      email: 'manager@irma.com',
      password: '$2a$10$XFE0rQyZ5GFMBVWNvX0KQeKl8d2/AcWwHnHD0FaslbVFJdAR/xyNO',
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager',
      department: 'Management',
      hourlyRate: 85,
      isActive: true
    },
    {
      username: 'employee',
      email: 'employee@irma.com',
      password: '$2a$10$XFE0rQyZ5GFMBVWNvX0KQeKl8d2/AcWwHnHD0FaslbVFJdAR/xyNO',
      firstName: 'Employee',
      lastName: 'User',
      role: 'employee',
      department: 'Development',
      hourlyRate: 65,
      isActive: true
    }
  ],
  clients: [
    {
      name: 'Test Client',
      contactPerson: 'John Doe',
      email: 'john@test.com',
      phone: '555-0123',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
      totalBudget: 50000,
      notes: 'Important client',
      isActive: true
    }
  ]
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/irma', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
};

// Migration functions
const migrations = {
  // Initialize database with sample data
  async initializeDatabase() {
    console.log('Initializing database with sample data...');
    
    // Clear existing data
    await User.deleteMany({});
    await Client.deleteMany({});
    await Project.deleteMany({});
    await Timesheet.deleteMany({});
    await Invoice.deleteMany({});
    await Report.deleteMany({});
    
    // Insert sample users
    const users = await User.insertMany(sampleData.users);
    console.log(`${users.length} users created`);
    
    // Insert sample clients
    const adminUser = users.find(user => user.role === 'admin');
    const clients = await Client.insertMany(
      sampleData.clients.map(client => ({
        ...client,
        createdBy: adminUser._id
      }))
    );
    console.log(`${clients.length} clients created`);
    
    // Create sample projects
    const projects = [
      {
        name: 'Project Alpha',
        clientId: clients[0]._id,
        description: 'First test project',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        budget: 10000,
        status: 'Active',
        assignedUsers: [
          { userId: users[0]._id, role: 'Lead' },
          { userId: users[2]._id, role: 'Member' }
        ],
        createdBy: adminUser._id
      },
      {
        name: 'Project Beta',
        clientId: clients[0]._id,
        description: 'Second test project',
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        budget: 5000,
        status: 'Active',
        assignedUsers: [
          { userId: users[1]._id, role: 'Lead' },
          { userId: users[2]._id, role: 'Member' }
        ],
        createdBy: adminUser._id
      }
    ];
    
    const createdProjects = await Project.insertMany(projects);
    console.log(`${createdProjects.length} projects created`);
    
    console.log('Database initialization complete');
    return { users, clients, projects: createdProjects };
  },
  
  // Export data to JSON files
  async exportData() {
    console.log('Exporting data to JSON files...');
    
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const users = await User.find({});
    const clients = await Client.find({});
    const projects = await Project.find({});
    const timesheets = await Timesheet.find({});
    const invoices = await Invoice.find({});
    const reports = await Report.find({});
    
    fs.writeFileSync(path.join(exportDir, 'users.json'), JSON.stringify(users, null, 2));
    fs.writeFileSync(path.join(exportDir, 'clients.json'), JSON.stringify(clients, null, 2));
    fs.writeFileSync(path.join(exportDir, 'projects.json'), JSON.stringify(projects, null, 2));
    fs.writeFileSync(path.join(exportDir, 'timesheets.json'), JSON.stringify(timesheets, null, 2));
    fs.writeFileSync(path.join(exportDir, 'invoices.json'), JSON.stringify(invoices, null, 2));
    fs.writeFileSync(path.join(exportDir, 'reports.json'), JSON.stringify(reports, null, 2));
    
    console.log('Data export complete');
    return { users, clients, projects, timesheets, invoices, reports };
  },
  
  // Import data from JSON files
  async importData() {
    console.log('Importing data from JSON files...');
    
    const importDir = path.join(__dirname, 'imports');
    if (!fs.existsSync(importDir)) {
      console.log('Import directory not found');
      return false;
    }
    
    try {
      if (fs.existsSync(path.join(importDir, 'users.json'))) {
        const userData = JSON.parse(fs.readFileSync(path.join(importDir, 'users.json')));
        await User.deleteMany({});
        await User.insertMany(userData);
        console.log(`${userData.length} users imported`);
      }
      
      if (fs.existsSync(path.join(importDir, 'clients.json'))) {
        const clientData = JSON.parse(fs.readFileSync(path.join(importDir, 'clients.json')));
        await Client.deleteMany({});
        await Client.insertMany(clientData);
        console.log(`${clientData.length} clients imported`);
      }
      
      if (fs.existsSync(path.join(importDir, 'projects.json'))) {
        const projectData = JSON.parse(fs.readFileSync(path.join(importDir, 'projects.json')));
        await Project.deleteMany({});
        await Project.insertMany(projectData);
        console.log(`${projectData.length} projects imported`);
      }
      
      if (fs.existsSync(path.join(importDir, 'timesheets.json'))) {
        const timesheetData = JSON.parse(fs.readFileSync(path.join(importDir, 'timesheets.json')));
        await Timesheet.deleteMany({});
        await Timesheet.insertMany(timesheetData);
        console.log(`${timesheetData.length} timesheets imported`);
      }
      
      if (fs.existsSync(path.join(importDir, 'invoices.json'))) {
        const invoiceData = JSON.parse(fs.readFileSync(path.join(importDir, 'invoices.json')));
        await Invoice.deleteMany({});
        await Invoice.insertMany(invoiceData);
        console.log(`${invoiceData.length} invoices imported`);
      }
      
      if (fs.existsSync(path.join(importDir, 'reports.json'))) {
        const reportData = JSON.parse(fs.readFileSync(path.join(importDir, 'reports.json')));
        await Report.deleteMany({});
        await Report.insertMany(reportData);
        console.log(`${reportData.length} reports imported`);
      }
      
      console.log('Data import complete');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
};

// Main migration function
const runMigration = async (migrationName) => {
  if (!migrations[migrationName]) {
    console.error(`Migration '${migrationName}' not found`);
    return false;
  }
  
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to database');
    return false;
  }
  
  try {
    await migrations[migrationName]();
    console.log(`Migration '${migrationName}' completed successfully`);
    return true;
  } catch (error) {
    console.error(`Migration '${migrationName}' failed:`, error);
    return false;
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// If script is run directly
if (require.main === module) {
  const migrationName = process.argv[2];
  if (!migrationName) {
    console.error('Please specify a migration to run');
    console.log('Available migrations:');
    Object.keys(migrations).forEach(name => console.log(`- ${name}`));
    process.exit(1);
  }
  
  runMigration(migrationName)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = {
  migrations,
  runMigration
};
