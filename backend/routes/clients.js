const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import middleware and models
const auth = require('../middleware/auth');
const Client = require('../models/Client');

// Middleware to check if user is manager or admin
const checkManagerRole = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized to manage clients' });
  }
  next();
};

// @route   GET api/clients
// @desc    Get all clients
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // If user is not manager or admin, only return active clients
    const filter = req.user.role === 'manager' || req.user.role === 'admin' 
      ? {} 
      : { isActive: true };
    
    const clients = await Client.find(filter).sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/clients/:id
// @desc    Get client by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    
    // If user is not manager/admin and client is inactive, deny access
    if (!client.isActive && req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(404).json({ msg: 'Client not found' });
    }
    
    res.json(client);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Client not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/clients
// @desc    Create a client
// @access  Private (Manager/Admin only)
router.post(
  '/',
  [
    auth,
    checkManagerRole,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('contactPerson', 'Contact person is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail()
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
        contactPerson,
        email,
        phone,
        address,
        totalBudget,
        notes,
        isActive
      } = req.body;

      // Create new client
      const newClient = new Client({
        name,
        contactPerson,
        email,
        phone,
        address,
        totalBudget: totalBudget || 0,
        notes,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.id
      });

      const client = await newClient.save();
      res.json(client);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/clients/:id
// @desc    Update a client
// @access  Private (Manager/Admin only)
router.put(
  '/:id',
  [
    auth,
    checkManagerRole,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('contactPerson', 'Contact person is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail()
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
        contactPerson,
        email,
        phone,
        address,
        totalBudget,
        notes,
        isActive
      } = req.body;

      // Find client by ID
      let client = await Client.findById(req.params.id);
      
      if (!client) {
        return res.status(404).json({ msg: 'Client not found' });
      }

      // Update client fields
      client.name = name;
      client.contactPerson = contactPerson;
      client.email = email;
      client.phone = phone || client.phone;
      client.address = address || client.address;
      client.totalBudget = totalBudget !== undefined ? totalBudget : client.totalBudget;
      client.notes = notes !== undefined ? notes : client.notes;
      client.isActive = isActive !== undefined ? isActive : client.isActive;
      client.updatedAt = Date.now();

      await client.save();
      res.json(client);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Client not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/clients/:id
// @desc    Delete a client
// @access  Private (Manager/Admin only)
router.delete('/:id', [auth, checkManagerRole], async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }

    // Instead of deleting, mark as inactive
    client.isActive = false;
    client.updatedAt = Date.now();
    await client.save();
    
    res.json({ msg: 'Client deactivated' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Client not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
