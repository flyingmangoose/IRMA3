const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import middleware and models
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Timesheet = require('../models/Timesheet');

// Middleware to check if user is manager or admin
const checkManagerRole = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized to manage invoices' });
  }
  next();
};

// @route   GET api/invoices
// @desc    Get all invoices
// @access  Private (Manager/Admin only)
router.get('/', [auth, checkManagerRole], async (req, res) => {
  try {
    // Get filter parameters
    const { clientId, status, startDate, endDate } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (clientId) {
      filter.clientId = clientId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (startDate && endDate) {
      filter.issueDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const invoices = await Invoice.find(filter)
      .populate('clientId', 'name contactPerson')
      .populate('createdBy', 'firstName lastName')
      .sort({ issueDate: -1 });
      
    res.json(invoices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/invoices/:id
// @desc    Get invoice by ID
// @access  Private (Manager/Admin only)
router.get('/:id', [auth, checkManagerRole], async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('clientId', 'name contactPerson email address')
      .populate('items.projectId', 'name')
      .populate('timesheets', 'startDate endDate totalHours')
      .populate('createdBy', 'firstName lastName');
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/invoices
// @desc    Create an invoice
// @access  Private (Manager/Admin only)
router.post(
  '/',
  [
    auth,
    checkManagerRole,
    [
      check('clientId', 'Client is required').not().isEmpty(),
      check('issueDate', 'Issue date is required').not().isEmpty(),
      check('dueDate', 'Due date is required').not().isEmpty(),
      check('items', 'At least one item is required').isArray({ min: 1 })
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
        clientId,
        invoiceNumber,
        issueDate,
        dueDate,
        items,
        taxRate,
        discount,
        notes,
        terms,
        timesheets
      } = req.body;

      // Generate invoice number if not provided
      let finalInvoiceNumber = invoiceNumber;
      if (!finalInvoiceNumber) {
        // Get the latest invoice to generate a sequential number
        const latestInvoice = await Invoice.findOne().sort({ createdAt: -1 });
        const nextNumber = latestInvoice ? parseInt(latestInvoice.invoiceNumber.replace('INV-', '')) + 1 : 1001;
        finalInvoiceNumber = `INV-${nextNumber}`;
      }

      // Calculate subtotal
      const subtotal = items.reduce((total, item) => total + item.amount, 0);
      
      // Calculate tax amount
      const taxAmount = subtotal * (taxRate || 0) / 100;
      
      // Calculate total
      const total = subtotal + taxAmount - (discount || 0);

      // Create new invoice
      const newInvoice = new Invoice({
        clientId,
        invoiceNumber: finalInvoiceNumber,
        issueDate,
        dueDate,
        items,
        subtotal,
        taxRate: taxRate || 0,
        taxAmount,
        discount: discount || 0,
        total,
        notes,
        terms,
        status: 'Draft',
        timesheets: timesheets || [],
        createdBy: req.user.id
      });

      const invoice = await newInvoice.save();
      
      // If timesheets are provided, update them to link to this invoice
      if (timesheets && timesheets.length > 0) {
        await Timesheet.updateMany(
          { _id: { $in: timesheets } },
          { $set: { invoiceId: invoice._id } }
        );
      }
      
      res.json(invoice);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/invoices/:id
// @desc    Update an invoice
// @access  Private (Manager/Admin only)
router.put(
  '/:id',
  [
    auth,
    checkManagerRole,
    [
      check('clientId', 'Client is required').not().isEmpty(),
      check('issueDate', 'Issue date is required').not().isEmpty(),
      check('dueDate', 'Due date is required').not().isEmpty(),
      check('items', 'At least one item is required').isArray({ min: 1 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find invoice by ID
      let invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ msg: 'Invoice not found' });
      }

      // Check if invoice is already sent or paid
      if (invoice.status === 'Sent' || invoice.status === 'Paid') {
        return res.status(400).json({ 
          errors: [{ msg: `Cannot update a ${invoice.status.toLowerCase()} invoice` }] 
        });
      }

      // Verify client exists
      const client = await Client.findById(req.body.clientId);
      if (!client) {
        return res.status(400).json({ errors: [{ msg: 'Client not found' }] });
      }

      const {
        clientId,
        invoiceNumber,
        issueDate,
        dueDate,
        items,
        taxRate,
        discount,
        notes,
        terms,
        timesheets
      } = req.body;

      // Calculate subtotal
      const subtotal = items.reduce((total, item) => total + item.amount, 0);
      
      // Calculate tax amount
      const taxAmount = subtotal * (taxRate || 0) / 100;
      
      // Calculate total
      const total = subtotal + taxAmount - (discount || 0);

      // Update invoice fields
      invoice.clientId = clientId;
      invoice.invoiceNumber = invoiceNumber || invoice.invoiceNumber;
      invoice.issueDate = issueDate;
      invoice.dueDate = dueDate;
      invoice.items = items;
      invoice.subtotal = subtotal;
      invoice.taxRate = taxRate || 0;
      invoice.taxAmount = taxAmount;
      invoice.discount = discount || 0;
      invoice.total = total;
      invoice.notes = notes;
      invoice.terms = terms;
      invoice.updatedAt = Date.now();

      // Handle timesheets
      if (timesheets) {
        // Remove invoice reference from old timesheets
        await Timesheet.updateMany(
          { invoiceId: invoice._id },
          { $unset: { invoiceId: "" } }
        );
        
        // Add invoice reference to new timesheets
        await Timesheet.updateMany(
          { _id: { $in: timesheets } },
          { $set: { invoiceId: invoice._id } }
        );
        
        invoice.timesheets = timesheets;
      }

      await invoice.save();
      res.json(invoice);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/invoices/:id/send
// @desc    Mark invoice as sent
// @access  Private (Manager/Admin only)
router.post('/:id/send', [auth, checkManagerRole], async (req, res) => {
  try {
    // Find invoice by ID
    let invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    // Check if invoice is already sent or paid
    if (invoice.status === 'Sent' || invoice.status === 'Paid') {
      return res.status(400).json({ 
        errors: [{ msg: `Invoice is already ${invoice.status.toLowerCase()}` }] 
      });
    }

    // Update invoice status
    invoice.status = 'Sent';
    invoice.updatedAt = Date.now();

    await invoice.save();
    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/invoices/:id/pay
// @desc    Mark invoice as paid
// @access  Private (Manager/Admin only)
router.post(
  '/:id/pay',
  [
    auth,
    checkManagerRole,
    [
      check('paymentDate', 'Payment date is required').not().isEmpty(),
      check('paymentMethod', 'Payment method is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find invoice by ID
      let invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ msg: 'Invoice not found' });
      }

      // Check if invoice is already paid
      if (invoice.status === 'Paid') {
        return res.status(400).json({ 
          errors: [{ msg: 'Invoice is already paid' }] 
        });
      }

      const { paymentDate, paymentMethod } = req.body;

      // Update invoice status
      invoice.status = 'Paid';
      invoice.paymentDate = paymentDate;
      invoice.paymentMethod = paymentMethod;
      invoice.updatedAt = Date.now();

      await invoice.save();
      res.json(invoice);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/invoices/:id/cancel
// @desc    Mark invoice as cancelled
// @access  Private (Manager/Admin only)
router.post('/:id/cancel', [auth, checkManagerRole], async (req, res) => {
  try {
    // Find invoice by ID
    let invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    // Check if invoice is already paid
    if (invoice.status === 'Paid') {
      return res.status(400).json({ 
        errors: [{ msg: 'Cannot cancel a paid invoice' }] 
      });
    }

    // Update invoice status
    invoice.status = 'Cancelled';
    invoice.updatedAt = Date.now();

    // Remove invoice reference from timesheets
    await Timesheet.updateMany(
      { invoiceId: invoice._id },
      { $unset: { invoiceId: "" } }
    );

    await invoice.save();
    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/invoices/generate
// @desc    Generate invoice from timesheets
// @access  Private (Manager/Admin only)
router.post(
  '/generate',
  [
    auth,
    checkManagerRole,
    [
      check('clientId', 'Client is required').not().isEmpty(),
      check('timesheetIds', 'Timesheet IDs are required').isArray({ min: 1 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { clientId, timesheetIds, issueDate, dueDate, taxRate, discount, notes, terms } = req.body;

      // Verify client exists
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(400).json({ errors: [{ msg: 'Client not found' }] });
      }

      // Get timesheets
      const timesheets = await Timesheet.find({
        _id: { $in: timesheetIds },
        status: 'Approved'
      }).populate('userId', 'hourlyRate firstName lastName');

      if (timesheets.length === 0) {
        return res.status(400).json({ 
          errors: [{ msg: 'No approved timesheets found with the provided IDs' }] 
        });
      }

      // Check if timesheets are already invoiced
      const alreadyInvoiced = timesheets.filter(ts => ts.invoiceId);
      if (alreadyInvoiced.length > 0) {
        return res.status(400).json({ 
          errors: [{ msg: `${alreadyInvoiced.length} timesheets are already invoiced` }] 
        });
      }

      // Generate invoice items from timesheets
      const invoiceItems = [];
      const projectTotals = {};

      // Group timesheet entries by project
      timesheets.forEach(timesheet => {
        timesheet.entries.forEach(entry => {
          if (entry.billable) {
            const projectId = entry.projectId.toString();
            const hourlyRate = timesheet.userId.hourlyRate || 0;
            
            if (!projectTotals[projectId]) {
              projectTotals[projectId] = {
                projectId,
                hours: 0,
                rate: hourlyRate,
                amount: 0
              };
            }
            
            projectTotals[projectId].hours += entry.hours;
            projectTotals[projectId].amount += entry.hours * hourlyRate;
          }
        });
      });

      // Convert project totals to invoice items
      for (const projectId in projectTotals) {
        const project = await Project.findById(projectId);
        const projectName = project ? project.name : 'Unknown Project';
        
        invoiceItems.push({
          projectId,
          description: `Professional services - ${projectName}`,
          quantity: projectTotals[projectId].hours,
          rate: projectTotals[projectId].rate,
          amount: projectTotals[projectId].amount
        });
      }

      // Generate invoice number
      const latestInvoice = await Invoice.findOne().sort({ createdAt: -1 });
      const nextNumber = latestInvoice ? parseInt(latestInvoice.invoiceNumber.replace('INV-', '')) + 1 : 1001;
      const invoiceNumber = `INV-${nextNumber}`;

      // Calculate totals
      const subtotal = invoiceItems.reduce((total, item) => total + item.amount, 0);
      const taxAmount = subtotal * (taxRate || 0) / 100;
      const total = subtotal + taxAmount - (discount || 0);

      // Set dates if not provided
      const currentDate = new Date();
      const finalIssueDate = issueDate || currentDate.toISOString().substr(0, 10);
      
      // Default due date is 30 days from issue date if not provided
      let finalDueDate = dueDate;
      if (!finalDueDate) {
        const dueDateTime = new Date(finalIssueDate);
        dueDateTime.setDate(dueDateTime.getDate() + 30);
        finalDueDate = dueDateTime.toISOString().substr(0, 10);
      }

      // Create new invoice
      const newInvoice = new Invoice({
        clientId,
        invoiceNumber,
        issueDate: finalIssueDate,
        dueDate: finalDueDate,
        items: invoiceItems,
        subtotal,
        taxRate: taxRate || 0,
        taxAmount,
        discount: discount || 0,
        total,
        notes,
        terms,
        status: 'Draft',
        timesheets: timesheetIds,
        createdBy: req.user.id
      });

      const invoice = await newInvoice.save();
      
      // Update timesheets with invoice reference
      await Timesheet.updateMany(
        { _id: { $in: timesheetIds } },
        { $set: { invoiceId: invoice._id } }
      );
      
      res.json(invoice);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
