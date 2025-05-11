const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Import middleware and models
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Timesheet = require('../models/Timesheet');
const Invoice = require('../models/Invoice');

// Middleware to check if user is manager or admin
const checkManagerRole = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized to manage reports' });
  }
  next();
};

// @route   GET api/reports
// @desc    Get all reports
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Get filter parameters
    const { type, isTemplate } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (isTemplate !== undefined) {
      filter.isTemplate = isTemplate === 'true';
    }
    
    // If user is not manager or admin, only show reports they created
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      filter.createdBy = req.user.id;
    }
    
    const reports = await Report.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
      
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reports/:id
// @desc    Get report by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('parameters.clientId', 'name')
      .populate('parameters.projectId', 'name')
      .populate('parameters.userId', 'firstName lastName');
    
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    
    // Check if user has access to this report
    if (req.user.role !== 'manager' && req.user.role !== 'admin' && 
        report.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to access this report' });
    }
    
    res.json(report);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/reports
// @desc    Create a report
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('type', 'Type is required').isIn(['Time', 'Budget', 'Client', 'Project', 'Resource', 'Custom'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        name,
        description,
        type,
        parameters,
        format,
        chartType,
        columns,
        sortBy,
        isTemplate,
        isScheduled,
        schedule
      } = req.body;

      // Create new report
      const newReport = new Report({
        name,
        description,
        type,
        parameters: parameters || {},
        format: format || 'Table',
        chartType: chartType || 'None',
        columns: columns || [],
        sortBy: sortBy || { field: 'createdAt', direction: 'desc' },
        isTemplate: isTemplate || false,
        isScheduled: isScheduled || false,
        schedule: schedule || {
          frequency: 'None',
          recipients: []
        },
        createdBy: req.user.id
      });

      const report = await newReport.save();
      res.json(report);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/reports/:id
// @desc    Update a report
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('type', 'Type is required').isIn(['Time', 'Budget', 'Client', 'Project', 'Resource', 'Custom'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find report by ID
      let report = await Report.findById(req.params.id);
      
      if (!report) {
        return res.status(404).json({ msg: 'Report not found' });
      }

      // Check if user has permission to update this report
      if (req.user.role !== 'manager' && req.user.role !== 'admin' && 
          report.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to update this report' });
      }

      const {
        name,
        description,
        type,
        parameters,
        format,
        chartType,
        columns,
        sortBy,
        isTemplate,
        isScheduled,
        schedule
      } = req.body;

      // Update report fields
      report.name = name;
      report.description = description;
      report.type = type;
      report.parameters = parameters || report.parameters;
      report.format = format || report.format;
      report.chartType = chartType || report.chartType;
      report.columns = columns || report.columns;
      report.sortBy = sortBy || report.sortBy;
      report.isTemplate = isTemplate !== undefined ? isTemplate : report.isTemplate;
      report.isScheduled = isScheduled !== undefined ? isScheduled : report.isScheduled;
      report.schedule = schedule || report.schedule;
      report.updatedAt = Date.now();

      await report.save();
      res.json(report);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Report not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/reports/:id
// @desc    Delete a report
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Check if user has permission to delete this report
    if (req.user.role !== 'manager' && req.user.role !== 'admin' && 
        report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this report' });
    }

    await report.remove();
    res.json({ msg: 'Report removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/reports/:id/run
// @desc    Run a report and get results
// @access  Private
router.post('/:id/run', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    
    // Check if user has access to this report
    if (req.user.role !== 'manager' && req.user.role !== 'admin' && 
        report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to run this report' });
    }
    
    // Get report parameters (use request parameters if provided, otherwise use saved parameters)
    const parameters = req.body.parameters || report.parameters;
    
    // Run report based on type
    let results;
    switch (report.type) {
      case 'Time':
        results = await runTimeReport(parameters);
        break;
      case 'Budget':
        results = await runBudgetReport(parameters);
        break;
      case 'Client':
        results = await runClientReport(parameters);
        break;
      case 'Project':
        results = await runProjectReport(parameters);
        break;
      case 'Resource':
        results = await runResourceReport(parameters);
        break;
      case 'Custom':
        results = await runCustomReport(parameters);
        break;
      default:
        return res.status(400).json({ msg: 'Invalid report type' });
    }
    
    // Update last run time
    report.lastRunAt = Date.now();
    await report.save();
    
    res.json({
      report,
      results
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/reports/template/:id
// @desc    Create a report from template
// @access  Private
router.post('/template/:id', auth, async (req, res) => {
  try {
    // Find template report
    const templateReport = await Report.findById(req.params.id);
    
    if (!templateReport || !templateReport.isTemplate) {
      return res.status(404).json({ msg: 'Report template not found' });
    }

    const { name, parameters } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        errors: [{ msg: 'Name is required' }] 
      });
    }

    // Create new report from template
    const newReport = new Report({
      name,
      description: templateReport.description,
      type: templateReport.type,
      parameters: parameters || templateReport.parameters,
      format: templateReport.format,
      chartType: templateReport.chartType,
      columns: templateReport.columns,
      sortBy: templateReport.sortBy,
      isTemplate: false,
      isScheduled: false,
      schedule: {
        frequency: 'None',
        recipients: []
      },
      createdBy: req.user.id
    });

    const report = await newReport.save();
    res.json(report);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Report template not found' });
    }
    res.status(500).send('Server error');
  }
});

// Helper functions to run different report types
async function runTimeReport(parameters) {
  const { startDate, endDate, clientId, projectId, userId } = parameters;
  
  // Build filter object
  let filter = {};
  
  if (startDate && endDate) {
    filter.startDate = { $gte: new Date(startDate) };
    filter.endDate = { $lte: new Date(endDate) };
  }
  
  if (userId) {
    filter.userId = userId;
  }
  
  // Get timesheets
  const timesheets = await Timesheet.find(filter)
    .populate('userId', 'firstName lastName email department')
    .populate('entries.projectId', 'name clientId');
  
  // Filter entries by project and client if specified
  const results = timesheets.map(timesheet => {
    // Filter entries if projectId is specified
    const filteredEntries = timesheet.entries.filter(entry => {
      if (projectId && entry.projectId._id.toString() !== projectId) {
        return false;
      }
      
      if (clientId && entry.projectId.clientId.toString() !== clientId) {
        return false;
      }
      
      return true;
    });
    
    // Calculate total hours for filtered entries
    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
    
    return {
      timesheetId: timesheet._id,
      user: `${timesheet.userId.firstName} ${timesheet.userId.lastName}`,
      department: timesheet.userId.department,
      startDate: timesheet.startDate,
      endDate: timesheet.endDate,
      status: timesheet.status,
      totalHours,
      entries: filteredEntries.map(entry => ({
        projectId: entry.projectId._id,
        projectName: entry.projectId.name,
        date: entry.date,
        hours: entry.hours,
        description: entry.description,
        billable: entry.billable
      }))
    };
  });
  
  return results;
}

async function runBudgetReport(parameters) {
  const { clientId, projectId, includeInactive } = parameters;
  
  // Build filter object
  let filter = {};
  
  if (clientId) {
    filter.clientId = clientId;
  }
  
  if (projectId) {
    filter._id = projectId;
  }
  
  if (!includeInactive) {
    filter.status = { $ne: 'Cancelled' };
  }
  
  // Get projects
  const projects = await Project.find(filter)
    .populate('clientId', 'name')
    .populate('assignedUsers.userId', 'firstName lastName');
  
  // Calculate budget metrics
  const results = await Promise.all(projects.map(async project => {
    // Get approved timesheets for this project
    const timesheets = await Timesheet.find({
      status: 'Approved',
      'entries.projectId': project._id
    }).populate('userId', 'hourlyRate');
    
    // Calculate total billed hours and amount
    let totalBilledHours = 0;
    let totalBilledAmount = 0;
    
    timesheets.forEach(timesheet => {
      const hourlyRate = timesheet.userId.hourlyRate || 0;
      
      timesheet.entries.forEach(entry => {
        if (entry.projectId.toString() === project._id.toString() && entry.billable) {
          totalBilledHours += entry.hours;
          totalBilledAmount += entry.hours * hourlyRate;
        }
      });
    });
    
    // Calculate budget metrics
    const budgetUsedPercentage = project.budget > 0 ? 
      Math.round((project.budget - project.budgetRemaining) / project.budget * 100) : 0;
    
    return {
      projectId: project._id,
      projectName: project.name,
      client: project.clientId.name,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      budgetRemaining: project.budgetRemaining,
      budgetUsed: project.budget - project.budgetRemaining,
      budgetUsedPercentage,
      totalBilledHours,
      totalBilledAmount,
      assignedUsers: project.assignedUsers.map(user => ({
        userId: user.userId._id,
        name: `${user.userId.firstName} ${user.userId.lastName}`,
        role: user.role
      }))
    };
  }));
  
  return results;
}

async function runClientReport(parameters) {
  const { includeInactive } = parameters;
  
  // Build filter object
  let filter = {};
  
  if (!includeInactive) {
    filter.isActive = true;
  }
  
  // Get clients
  const clients = await Client.find(filter);
  
  // Get projects and invoices for each client
  const results = await Promise.all(clients.map(async client => {
    // Get projects for this client
    const projects = await Project.find({ clientId: client._id });
    
    // Get invoices for this client
    const invoices = await Invoice.find({ clientId: client._id });
    
    // Calculate total budget and remaining budget
    const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
    const totalBudgetRemaining = projects.reduce((sum, project) => sum + project.budgetRemaining, 0);
    
    // Calculate total invoiced and paid amounts
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalPaid = invoices
      .filter(invoice => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    return {
      clientId: client._id,
      name: client.name,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      isActive: client.isActive,
      totalBudget: client.totalBudget,
      projectCount: projects.length,
      activeProjectCount: projects.filter(p => p.status === 'Active').length,
      totalProjectBudget: totalBudget,
      totalProjectBudgetRemaining: totalBudgetRemaining,
      totalInvoiced,
      totalPaid,
      outstandingBalance: totalInvoiced - totalPaid
    };
  }));
  
  return results;
}

async function runProjectReport(parameters) {
  const { startDate, endDate, clientId, status } = parameters;
  
  // Build filter object
  let filter = {};
  
  if (startDate) {
    filter.startDate = { $gte: new Date(startDate) };
  }
  
  if (endDate) {
    filter.endDate = { $lte: new Date(endDate) };
  }
  
  if (clientId) {
    filter.clientId = clientId;
  }
  
  if (status) {
    filter.status = status;
  }
  
  // Get projects
  const projects = await Project.find(filter)
    .populate('clientId', 'name')
    .populate('assignedUsers.userId', 'firstName lastName');
  
  // Get additional data for each project
  const results = await Promise.all(projects.map(async project => {
    // Get approved timesheets for this project
    const timesheets = await Timesheet.find({
      status: 'Approved',
      'entries.projectId': project._id
    });
    
    // Calculate total hours
    let totalHours = 0;
    let billableHours = 0;
    let nonBillableHours = 0;
    
    timesheets.forEach(timesheet => {
      timesheet.entries.forEach(entry => {
        if (entry.projectId.toString() === project._id.toString()) {
          totalHours += entry.hours;
          if (entry.billable) {
            billableHours += entry.hours;
          } else {
            nonBillableHours += entry.hours;
          }
        }
      });
    });
    
    // Get invoices for this project
    const invoices = await Invoice.find({
      'items.projectId': project._id
    });
    
    // Calculate total invoiced amount for this project
    let totalInvoiced = 0;
    
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (item.projectId && item.projectId.toString() === project._id.toString()) {
          totalInvoiced += item.amount;
        }
      });
    });
    
    return {
      projectId: project._id,
      projectName: project.name,
      client: project.clientId.name,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      budgetRemaining: project.budgetRemaining,
      budgetUsed: project.budget - project.budgetRemaining,
      budgetUsedPercentage: project.budget > 0 ? 
        Math.round((project.budget - project.budgetRemaining) / project.budget * 100) : 0,
      totalHours,
      billableHours,
      nonBillableHours,
      totalInvoiced,
      assignedUsers: project.assignedUsers.map(user => ({
        userId: user.userId._id,
        name: `${user.userId.firstName} ${user.userId.lastName}`,
        role: user.role
      }))
    };
  }));
  
  return results;
}

async function runResourceReport(parameters) {
  const { startDate, endDate, departmentId, userId } = parameters;
  
  // Build filter object for users
  let userFilter = {};
  
  if (departmentId) {
    userFilter.department = departmentId;
  }
  
  if (userId) {
    userFilter._id = userId;
  }
  
  // Get users
  const users = await User.find(userFilter);
  
  // Build filter object for timesheets
  let timesheetFilter = {
    status: 'Approved'
  };
  
  if (startDate && endDate) {
    timesheetFilter.startDate = { $gte: new Date(startDate) };
    timesheetFilter.endDate = { $lte: new Date(endDate) };
  }
  
  if (userId) {
    timesheetFilter.userId = userId;
  } else if (users.length > 0) {
    timesheetFilter.userId = { $in: users.map(user => user._id) };
  }
  
  // Get timesheets
  const timesheets = await Timesheet.find(timesheetFilter)
    .populate('userId', 'firstName lastName email department hourlyRate')
    .populate('entries.projectId', 'name clientId');
  
  // Get projects for assigned users
  const projects = await Project.find({
    'assignedUsers.userId': { $in: users.map(user => user._id) }
  });
  
  // Calculate resource metrics
  const results = users.map(user => {
    // Get timesheets for this user
    const userTimesheets = timesheets.filter(ts => 
      ts.userId._id.toString() === user._id.toString()
    );
    
    // Calculate total hours
    let totalHours = 0;
    let billableHours = 0;
    let nonBillableHours = 0;
    
    // Track hours by project
    const projectHours = {};
    
    userTimesheets.forEach(timesheet => {
      timesheet.entries.forEach(entry => {
        totalHours += entry.hours;
        
        if (entry.billable) {
          billableHours += entry.hours;
        } else {
          nonBillableHours += entry.hours;
        }
        
        // Add to project hours
        const projectId = entry.projectId._id.toString();
        if (!projectHours[projectId]) {
          projectHours[projectId] = {
            projectId,
            projectName: entry.projectId.name,
            hours: 0,
            billableHours: 0,
            nonBillableHours: 0
          };
        }
        
        projectHours[projectId].hours += entry.hours;
        if (entry.billable) {
          projectHours[projectId].billableHours += entry.hours;
        } else {
          projectHours[projectId].nonBillableHours += entry.hours;
        }
      });
    });
    
    // Get assigned projects for this user
    const assignedProjects = projects.filter(project => 
      project.assignedUsers.some(assignment => 
        assignment.userId.toString() === user._id.toString()
      )
    );
    
    // Calculate utilization
    // Assuming 40 hours per week
    const startDateObj = startDate ? new Date(startDate) : new Date();
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const weekDiff = Math.ceil((endDateObj - startDateObj) / (7 * 24 * 60 * 60 * 1000));
    const availableHours = weekDiff * 40;
    const utilization = availableHours > 0 ? Math.round(totalHours / availableHours * 100) : 0;
    
    return {
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      department: user.department,
      hourlyRate: user.hourlyRate,
      totalHours,
      billableHours,
      nonBillableHours,
      utilization,
      billablePercentage: totalHours > 0 ? Math.round(billableHours / totalHours * 100) : 0,
      assignedProjects: assignedProjects.map(project => ({
        projectId: project._id,
        projectName: project.name,
        role: project.assignedUsers.find(a => a.userId.toString() === user._id.toString()).role
      })),
      projectHours: Object.values(projectHours)
    };
  });
  
  return results;
}

async function runCustomReport(parameters) {
  // Custom reports can be implemented based on specific requirements
  // This is a placeholder that returns some sample data
  return [
    {
      id: 1,
      name: 'Custom Report Result 1',
      value: Math.random() * 1000
    },
    {
      id: 2,
      name: 'Custom Report Result 2',
      value: Math.random() * 1000
    },
    {
      id: 3,
      name: 'Custom Report Result 3',
      value: Math.random() * 1000
    }
  ];
}

module.exports = router;
