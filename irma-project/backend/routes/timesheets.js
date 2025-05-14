const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Import middleware and models
const auth = require('../middleware/auth');
const Timesheet = require('../models/Timesheet');
const Project = require('../models/Project');
const User = require('../models/User');

// Middleware to check if user is supervisor or above
const checkSupervisorRole = (req, res, next) => {
  if (req.user.role !== 'supervisor' && req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized to approve timesheets' });
  }
  next();
};

// @route   GET api/timesheets
// @desc    Get all timesheets (filtered by role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    // Filter based on user role
    if (req.user.role === 'employee') {
      // Employees can only see their own timesheets
      filter.userId = req.user.id;
    } else if (req.user.role === 'supervisor') {
      // Supervisors can see timesheets from their team members
      // This would require a more complex query in a real system
      // For now, let's assume supervisors can see all submitted timesheets
      filter.status = { $ne: 'Draft' };
    }
    
    // Apply date range filter if provided
    if (req.query.startDate && req.query.endDate) {
      filter.startDate = { $gte: new Date(req.query.startDate) };
      filter.endDate = { $lte: new Date(req.query.endDate) };
    }
    
    // Apply status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const timesheets = await Timesheet.find(filter)
      .populate('userId', 'firstName lastName')
      .sort({ startDate: -1 });
      
    res.json(timesheets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/timesheets/:id
// @desc    Get timesheet by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('entries.projectId', 'name clientId');
    
    if (!timesheet) {
      return res.status(404).json({ msg: 'Timesheet not found' });
    }
    
    // Check if user has access to this timesheet
    if (req.user.role === 'employee' && timesheet.userId._id.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Timesheet not found' });
    }
    
    res.json(timesheet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Timesheet not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/timesheets
// @desc    Create a timesheet
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('startDate', 'Start date is required').not().isEmpty(),
      check('endDate', 'End date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { startDate, endDate, entries, notes } = req.body;

      // Check if timesheet already exists for this period
      const existingTimesheet = await Timesheet.findOne({
        userId: req.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      
      if (existingTimesheet) {
        return res.status(400).json({ 
          errors: [{ msg: 'A timesheet already exists for this period' }] 
        });
      }

      // Create new timesheet
      const newTimesheet = new Timesheet({
        userId: req.user.id,
        startDate,
        endDate,
        entries: entries || [],
        notes,
        status: 'Draft'
      });

      const timesheet = await newTimesheet.save();
      res.json(timesheet);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/timesheets/:id
// @desc    Update a timesheet
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('startDate', 'Start date is required').not().isEmpty(),
      check('endDate', 'End date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find timesheet by ID
      let timesheet = await Timesheet.findById(req.params.id);
      
      if (!timesheet) {
        return res.status(404).json({ msg: 'Timesheet not found' });
      }

      // Check if user owns this timesheet or is admin
      if (timesheet.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Not authorized to update this timesheet' });
      }

      // Check if timesheet is already approved
      if (timesheet.status === 'Approved') {
        return res.status(400).json({ 
          errors: [{ msg: 'Cannot update an approved timesheet' }] 
        });
      }

      const { startDate, endDate, entries, notes } = req.body;

      // Update timesheet fields
      timesheet.startDate = startDate;
      timesheet.endDate = endDate;
      timesheet.entries = entries || timesheet.entries;
      timesheet.notes = notes !== undefined ? notes : timesheet.notes;
      timesheet.updatedAt = Date.now();

      // If timesheet was rejected, set back to submitted
      if (timesheet.status === 'Rejected') {
        timesheet.status = 'Submitted';
        timesheet.submittedAt = Date.now();
        timesheet.submittedBy = req.user.id;
        timesheet.rejectionReason = '';
      }

      await timesheet.save();
      res.json(timesheet);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Timesheet not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/timesheets/:id/submit
// @desc    Submit a timesheet for approval
// @access  Private
router.post('/:id/submit', auth, async (req, res) => {
  try {
    // Find timesheet by ID
    let timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ msg: 'Timesheet not found' });
    }

    // Check if user owns this timesheet
    if (timesheet.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to submit this timesheet' });
    }

    // Check if timesheet is already submitted or approved
    if (timesheet.status === 'Submitted' || timesheet.status === 'Approved') {
      return res.status(400).json({ 
        errors: [{ msg: `Timesheet is already ${timesheet.status.toLowerCase()}` }] 
      });
    }

    // Update timesheet status
    timesheet.status = 'Submitted';
    timesheet.submittedAt = Date.now();
    timesheet.submittedBy = req.user.id;
    timesheet.updatedAt = Date.now();

    await timesheet.save();
    res.json(timesheet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Timesheet not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/timesheets/:id/approve
// @desc    Approve a timesheet
// @access  Private (Supervisor+ only)
router.post('/:id/approve', [auth, checkSupervisorRole], async (req, res) => {
  try {
    // Find timesheet by ID
    let timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ msg: 'Timesheet not found' });
    }

    // Check if timesheet is submitted
    if (timesheet.status !== 'Submitted' && timesheet.status !== 'Pending') {
      return res.status(400).json({ 
        errors: [{ msg: 'Only submitted timesheets can be approved' }] 
      });
    }

    // Update timesheet status
    timesheet.status = 'Approved';
    timesheet.approvedAt = Date.now();
    timesheet.approvedBy = req.user.id;
    timesheet.updatedAt = Date.now();

    // Update project budget remaining for each entry
    if (timesheet.entries && timesheet.entries.length > 0) {
      for (const entry of timesheet.entries) {
        if (entry.billable) {
          const project = await Project.findById(entry.projectId);
          if (project) {
            // Get user's hourly rate
            const user = await User.findById(timesheet.userId);
            const hourlyRate = user ? user.hourlyRate : 0;
            
            // Calculate cost and update budget
            const entryCost = entry.hours * hourlyRate;
            project.budgetRemaining -= entryCost;
            await project.save();
          }
        }
      }
    }

    await timesheet.save();
    res.json(timesheet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Timesheet not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/timesheets/:id/reject
// @desc    Reject a timesheet
// @access  Private (Supervisor+ only)
router.post(
  '/:id/reject',
  [
    auth,
    checkSupervisorRole,
    [
      check('reason', 'Rejection reason is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find timesheet by ID
      let timesheet = await Timesheet.findById(req.params.id);
      
      if (!timesheet) {
        return res.status(404).json({ msg: 'Timesheet not found' });
      }

      // Check if timesheet is submitted
      if (timesheet.status !== 'Submitted' && timesheet.status !== 'Pending') {
        return res.status(400).json({ 
          errors: [{ msg: 'Only submitted timesheets can be rejected' }] 
        });
      }

      // Update timesheet status
      timesheet.status = 'Rejected';
      timesheet.rejectedAt = Date.now();
      timesheet.rejectedBy = req.user.id;
      timesheet.rejectionReason = req.body.reason;
      timesheet.updatedAt = Date.now();

      await timesheet.save();
      res.json(timesheet);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Timesheet not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/timesheets/:id/entry
// @desc    Add a time entry to a timesheet
// @access  Private
router.post(
  '/:id/entry',
  [
    auth,
    [
      check('projectId', 'Project is required').not().isEmpty(),
      check('date', 'Date is required').not().isEmpty(),
      check('hours', 'Hours is required').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find timesheet by ID
      let timesheet = await Timesheet.findById(req.params.id);
      
      if (!timesheet) {
        return res.status(404).json({ msg: 'Timesheet not found' });
      }

      // Check if user owns this timesheet
      if (timesheet.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Not authorized to update this timesheet' });
      }

      // Check if timesheet is already approved
      if (timesheet.status === 'Approved') {
        return res.status(400).json({ 
          errors: [{ msg: 'Cannot update an approved timesheet' }] 
        });
      }

      const { projectId, date, hours, description, billable } = req.body;

      // Verify project exists and user has access
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(400).json({ errors: [{ msg: 'Project not found' }] });
      }

      // Check if user is assigned to this project
      if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        const isAssigned = project.assignedUsers.some(
          user => user.userId.toString() === req.user.id
        );
        
        if (!isAssigned) {
          return res.status(400).json({ 
            errors: [{ msg: 'You are not assigned to this project' }] 
          });
        }
      }

      // Create new entry
      const newEntry = {
        projectId,
        date,
        hours: parseFloat(hours),
        description: description || '',
        billable: billable !== undefined ? billable : true
      };

      // Add entry to timesheet
      timesheet.entries.push(newEntry);
      timesheet.updatedAt = Date.now();

      await timesheet.save();
      res.json(timesheet);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Timesheet or project not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/timesheets/:id/entry/:entryId
// @desc    Delete a time entry from a timesheet
// @access  Private
router.delete('/:id/entry/:entryId', auth, async (req, res) => {
  try {
    // Find timesheet by ID
    let timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ msg: 'Timesheet not found' });
    }

    // Check if user owns this timesheet
    if (timesheet.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to update this timesheet' });
    }

    // Check if timesheet is already approved
    if (timesheet.status === 'Approved') {
      return res.status(400).json({ 
        errors: [{ msg: 'Cannot update an approved timesheet' }] 
      });
    }

    // Find entry index
    const entryIndex = timesheet.entries.findIndex(
      entry => entry._id.toString() === req.params.entryId
    );
    
    if (entryIndex === -1) {
      return res.status(404).json({ msg: 'Entry not found' });
    }

    // Remove entry
    timesheet.entries.splice(entryIndex, 1);
    timesheet.updatedAt = Date.now();

    await timesheet.save();
    res.json(timesheet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Timesheet or entry not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
