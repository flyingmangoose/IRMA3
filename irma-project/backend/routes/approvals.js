const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import middleware and models
const auth = require('../middleware/auth');
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');
const Project = require('../models/Project');

// Middleware to check if user is supervisor or above
const checkSupervisorRole = (req, res, next) => {
  if (req.user.role !== 'supervisor' && req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized to manage approvals' });
  }
  next();
};

// @route   GET api/approvals/pending
// @desc    Get all pending approvals
// @access  Private (Supervisor+ only)
router.get('/pending', [auth, checkSupervisorRole], async (req, res) => {
  try {
    // Get all timesheets with status 'Submitted' or 'Pending'
    const pendingTimesheets = await Timesheet.find({
      status: { $in: ['Submitted', 'Pending'] }
    })
      .populate('userId', 'firstName lastName email department')
      .populate('entries.projectId', 'name clientId')
      .sort({ submittedAt: 1 });
    
    res.json(pendingTimesheets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/approvals/history
// @desc    Get approval history
// @access  Private (Supervisor+ only)
router.get('/history', [auth, checkSupervisorRole], async (req, res) => {
  try {
    // Get filter parameters
    const { startDate, endDate, status, userId } = req.query;
    
    // Build filter object
    let filter = {
      status: { $in: ['Approved', 'Rejected'] }
    };
    
    if (startDate && endDate) {
      filter.updatedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status && (status === 'Approved' || status === 'Rejected')) {
      filter.status = status;
    }
    
    if (userId) {
      filter.userId = userId;
    }
    
    // Get timesheets based on filter
    const timesheets = await Timesheet.find(filter)
      .populate('userId', 'firstName lastName email department')
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .sort({ updatedAt: -1 });
    
    res.json(timesheets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/approvals/batch
// @desc    Batch approve or reject timesheets
// @access  Private (Supervisor+ only)
router.post(
  '/batch',
  [
    auth,
    checkSupervisorRole,
    [
      check('timesheetIds', 'Timesheet IDs are required').isArray(),
      check('action', 'Action is required').isIn(['approve', 'reject']),
      check('reason', 'Reason is required for rejection').custom((value, { req }) => {
        if (req.body.action === 'reject' && (!value || value.trim() === '')) {
          throw new Error('Reason is required for rejection');
        }
        return true;
      })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { timesheetIds, action, reason } = req.body;

    try {
      // Process each timesheet
      const results = [];
      
      for (const id of timesheetIds) {
        try {
          // Find timesheet by ID
          const timesheet = await Timesheet.findById(id);
          
          if (!timesheet) {
            results.push({
              id,
              success: false,
              message: 'Timesheet not found'
            });
            continue;
          }
          
          // Check if timesheet is in a state that can be approved/rejected
          if (timesheet.status !== 'Submitted' && timesheet.status !== 'Pending') {
            results.push({
              id,
              success: false,
              message: `Timesheet is ${timesheet.status.toLowerCase()}, cannot be ${action}d`
            });
            continue;
          }
          
          if (action === 'approve') {
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
          } else {
            // Update timesheet status
            timesheet.status = 'Rejected';
            timesheet.rejectedAt = Date.now();
            timesheet.rejectedBy = req.user.id;
            timesheet.rejectionReason = reason;
            timesheet.updatedAt = Date.now();
          }
          
          await timesheet.save();
          
          results.push({
            id,
            success: true,
            message: `Timesheet ${action}d successfully`
          });
        } catch (err) {
          console.error(`Error processing timesheet ${id}:`, err.message);
          results.push({
            id,
            success: false,
            message: 'Server error processing timesheet'
          });
        }
      }
      
      res.json({
        totalProcessed: timesheetIds.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        results
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/approvals/workflow
// @desc    Configure approval workflow
// @access  Private (Manager/Admin only)
router.post(
  '/workflow',
  [
    auth,
    (req, res, next) => {
      if (req.user.role !== 'manager' && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Not authorized to configure approval workflows' });
      }
      next();
    },
    [
      check('levels', 'Approval levels are required').isArray(),
      check('levels.*.role', 'Role is required for each level').isIn(['supervisor', 'manager', 'admin']),
      check('levels.*.order', 'Order is required for each level').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Note: This is a placeholder for future implementation
    // In a real system, this would save the workflow configuration to a database
    
    res.json({
      message: 'Approval workflow configured successfully',
      workflow: req.body
    });
  }
);

module.exports = router;
