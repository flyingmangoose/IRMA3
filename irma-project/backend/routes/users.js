const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const config = require('config');

// Import middleware and models
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/users
// @desc    Register a user
// @access  Private (admin only)
router.post(
  '/',
  [
    auth,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('role', 'Role is required').isIn(['employee', 'supervisor', 'manager', 'admin'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to create users' });
    }

    const { firstName, lastName, email, password, role, department, hourlyRate, phone } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        firstName,
        lastName,
        email,
        password,
        role,
        department,
        hourlyRate,
        phone,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            browser: true
          }
        }
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return user data (without password)
      const userData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        hourlyRate: user.hourlyRate,
        phone: user.phone,
        twoFactorEnabled: user.twoFactorEnabled
      };

      res.json(userData);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/users
// @desc    Get all users
// @access  Private (admin and manager only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ msg: 'Not authorized to view all users' });
    }

    const users = await User.find().select('-password -twoFactorSecret');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private (admin, manager, or self)
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -twoFactorSecret');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if user is admin, manager, or self
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Not authorized to view this user' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private (admin or self)
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if user is admin or self
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Not authorized to update this user' });
    }

    const { firstName, lastName, email, role, department, hourlyRate, phone, preferences } = req.body;

    // Only admin can update role, department, and hourlyRate
    if (req.user.role !== 'admin' && (role || department || hourlyRate)) {
      return res.status(403).json({ msg: 'Not authorized to update role, department, or hourly rate' });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role && req.user.role === 'admin') user.role = role;
    if (department && req.user.role === 'admin') user.department = department;
    if (hourlyRate && req.user.role === 'admin') user.hourlyRate = hourlyRate;
    if (phone) user.phone = phone;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    // Return updated user (without password)
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      hourlyRate: user.hourlyRate,
      phone: user.phone,
      twoFactorEnabled: user.twoFactorEnabled,
      preferences: user.preferences
    };

    res.json(userData);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete users' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await user.remove();

    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/:id/password
// @desc    Update user password
// @access  Private (admin or self)
router.put(
  '/:id/password',
  [
    auth,
    [
      check('currentPassword', 'Current password is required').exists(),
      check('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Check if user is admin or self
      if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ msg: 'Not authorized to update this user password' });
      }

      const { currentPassword, newPassword } = req.body;

      // Verify current password (skip for admin)
      if (req.user.id === req.params.id) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ errors: [{ msg: 'Current password is incorrect' }] });
        }
      }

      // Encrypt new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      await user.save();

      res.json({ msg: 'Password updated successfully' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/users/:id/2fa/enable
// @desc    Enable two-factor authentication
// @access  Private (self only)
router.put('/:id/2fa/enable', auth, async (req, res) => {
  try {
    // Check if user is self
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Not authorized to update 2FA for this user' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate 2FA secret
    const speakeasy = require('speakeasy');
    const QRCode = require('qrcode');

    const secret = speakeasy.generateSecret({
      name: `IRMA:${user.email}`
    });

    // Save secret to user
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = false; // Not fully enabled until verified
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/:id/2fa/verify
// @desc    Verify and enable two-factor authentication
// @access  Private (self only)
router.post(
  '/:id/2fa/verify',
  [
    auth,
    [
      check('token', 'Token is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user is self
      if (req.user.id !== req.params.id) {
        return res.status(403).json({ msg: 'Not authorized to verify 2FA for this user' });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const { token } = req.body;

      // Verify token
      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token
      });

      if (!verified) {
        return res.status(400).json({ errors: [{ msg: 'Invalid token' }] });
      }

      // Enable 2FA
      user.twoFactorEnabled = true;
      await user.save();

      res.json({ msg: 'Two-factor authentication enabled successfully' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/users/:id/2fa/disable
// @desc    Disable two-factor authentication
// @access  Private (self or admin)
router.put('/:id/2fa/disable', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if user is self or admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to disable 2FA for this user' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    res.json({ msg: 'Two-factor authentication disabled successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/roles
// @desc    Get available user roles
// @access  Private (admin only)
router.get('/roles', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to view roles' });
    }

    const roles = [
      {
        name: 'employee',
        permissions: [
          'view_own_profile',
          'edit_own_profile',
          'view_own_timesheets',
          'create_own_timesheets',
          'edit_own_timesheets',
          'view_assigned_projects',
          'view_own_reports'
        ]
      },
      {
        name: 'supervisor',
        permissions: [
          'view_own_profile',
          'edit_own_profile',
          'view_own_timesheets',
          'create_own_timesheets',
          'edit_own_timesheets',
          'view_assigned_projects',
          'view_own_reports',
          'view_team_timesheets',
          'approve_team_timesheets'
        ]
      },
      {
        name: 'manager',
        permissions: [
          'view_own_profile',
          'edit_own_profile',
          'view_own_timesheets',
          'create_own_timesheets',
          'edit_own_timesheets',
          'view_assigned_projects',
          'view_own_reports',
          'view_team_timesheets',
          'approve_team_timesheets',
          'view_all_projects',
          'create_projects',
          'edit_projects',
          'view_all_clients',
          'create_clients',
          'edit_clients',
          'view_all_reports',
          'create_reports',
          'view_invoices',
          'create_invoices'
        ]
      },
      {
        name: 'admin',
        permissions: [
          'view_own_profile',
          'edit_own_profile',
          'view_own_timesheets',
          'create_own_timesheets',
          'edit_own_timesheets',
          'view_assigned_projects',
          'view_own_reports',
          'view_team_timesheets',
          'approve_team_timesheets',
          'view_all_projects',
          'create_projects',
          'edit_projects',
          'delete_projects',
          'view_all_clients',
          'create_clients',
          'edit_clients',
          'delete_clients',
          'view_all_reports',
          'create_reports',
          'edit_reports',
          'delete_reports',
          'view_invoices',
          'create_invoices',
          'edit_invoices',
          'delete_invoices',
          'view_all_users',
          'create_users',
          'edit_users',
          'delete_users',
          'manage_system_settings'
        ]
      }
    ];

    res.json(roles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
