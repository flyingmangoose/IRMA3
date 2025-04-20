const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import middleware and models
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Client = require('../models/Client');

// Middleware to check if user is manager or admin
const checkManagerRole = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized to manage projects' });
  }
  next();
};

// @route   GET api/projects
// @desc    Get all projects
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    // If user is not manager or admin, only return projects they're assigned to
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      filter = {
        'assignedUsers.userId': req.user.id,
        status: { $ne: 'Cancelled' }
      };
    }
    
    const projects = await Project.find(filter)
      .populate('clientId', 'name')
      .sort({ name: 1 });
      
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('clientId', 'name')
      .populate('assignedUsers.userId', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      const isAssigned = project.assignedUsers.some(
        user => user.userId._id.toString() === req.user.id
      );
      
      if (!isAssigned || project.status === 'Cancelled') {
        return res.status(404).json({ msg: 'Project not found' });
      }
    }
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/projects
// @desc    Create a project
// @access  Private (Manager/Admin only)
router.post(
  '/',
  [
    auth,
    checkManagerRole,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('clientId', 'Client is required').not().isEmpty(),
      check('startDate', 'Start date is required').not().isEmpty(),
      check('budget', 'Budget must be a number').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Verify client exists
      const client = await Client.findById(req.body.clientId);
      if (!client) {
        return res.status(400).json({ errors: [{ msg: 'Client not found' }] });
      }

      const {
        name,
        clientId,
        description,
        startDate,
        endDate,
        budget,
        status,
        assignedUsers,
        isTemplate
      } = req.body;

      // Create new project
      const newProject = new Project({
        name,
        clientId,
        description,
        startDate,
        endDate,
        budget,
        budgetRemaining: budget,
        status: status || 'Active',
        assignedUsers: assignedUsers || [],
        isTemplate: isTemplate || false,
        createdBy: req.user.id
      });

      const project = await newProject.save();
      res.json(project);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private (Manager/Admin only)
router.put(
  '/:id',
  [
    auth,
    checkManagerRole,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('clientId', 'Client is required').not().isEmpty(),
      check('startDate', 'Start date is required').not().isEmpty(),
      check('budget', 'Budget must be a number').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find project by ID
      let project = await Project.findById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ msg: 'Project not found' });
      }

      // Verify client exists
      const client = await Client.findById(req.body.clientId);
      if (!client) {
        return res.status(400).json({ errors: [{ msg: 'Client not found' }] });
      }

      const {
        name,
        clientId,
        description,
        startDate,
        endDate,
        budget,
        status,
        assignedUsers,
        isTemplate
      } = req.body;

      // Update project fields
      project.name = name;
      project.clientId = clientId;
      project.description = description;
      project.startDate = startDate;
      project.endDate = endDate || project.endDate;
      
      // If budget changed, update budgetRemaining accordingly
      if (budget !== project.budget) {
        const budgetDiff = budget - project.budget;
        project.budgetRemaining = project.budgetRemaining + budgetDiff;
        project.budget = budget;
      }
      
      project.status = status || project.status;
      project.assignedUsers = assignedUsers || project.assignedUsers;
      project.isTemplate = isTemplate !== undefined ? isTemplate : project.isTemplate;
      project.updatedAt = Date.now();

      await project.save();
      res.json(project);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Project not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private (Manager/Admin only)
router.delete('/:id', [auth, checkManagerRole], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Instead of deleting, mark as cancelled
    project.status = 'Cancelled';
    project.updatedAt = Date.now();
    await project.save();
    
    res.json({ msg: 'Project cancelled' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/projects/template/:id
// @desc    Create a project from template
// @access  Private (Manager/Admin only)
router.post('/template/:id', [auth, checkManagerRole], async (req, res) => {
  try {
    // Find template project
    const templateProject = await Project.findById(req.params.id);
    
    if (!templateProject || !templateProject.isTemplate) {
      return res.status(404).json({ msg: 'Project template not found' });
    }

    const { name, clientId, startDate, endDate, budget } = req.body;
    
    if (!name || !clientId || !startDate || !budget) {
      return res.status(400).json({ 
        errors: [{ msg: 'Name, client, start date, and budget are required' }] 
      });
    }

    // Create new project from template
    const newProject = new Project({
      name,
      clientId,
      description: templateProject.description,
      startDate,
      endDate: endDate || null,
      budget,
      budgetRemaining: budget,
      status: 'Active',
      assignedUsers: templateProject.assignedUsers,
      isTemplate: false,
      createdBy: req.user.id
    });

    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project template not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
