const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TimesheetSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  entries: [{
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 24
    },
    description: {
      type: String,
      trim: true
    },
    billable: {
      type: Boolean,
      default: true
    }
  }],
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Pending', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  submittedAt: {
    type: Date
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  totalHours: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate total hours
TimesheetSchema.pre('save', function(next) {
  if (this.entries && this.entries.length > 0) {
    this.totalHours = this.entries.reduce((total, entry) => total + entry.hours, 0);
  }
  next();
});

module.exports = mongoose.model('Timesheet', TimesheetSchema);
