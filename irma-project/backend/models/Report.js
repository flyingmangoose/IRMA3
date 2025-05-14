const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['Time', 'Budget', 'Client', 'Project', 'Resource', 'Custom'],
    required: true
  },
  parameters: {
    startDate: Date,
    endDate: Date,
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client'
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project'
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    includeInactive: {
      type: Boolean,
      default: false
    },
    customFilters: Schema.Types.Mixed
  },
  format: {
    type: String,
    enum: ['Table', 'Chart', 'Combined'],
    default: 'Table'
  },
  chartType: {
    type: String,
    enum: ['Bar', 'Line', 'Pie', 'None'],
    default: 'None'
  },
  columns: [{
    field: String,
    title: String,
    visible: {
      type: Boolean,
      default: true
    },
    sortable: {
      type: Boolean,
      default: true
    },
    width: String
  }],
  sortBy: {
    field: String,
    direction: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'asc'
    }
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'None'],
      default: 'None'
    },
    dayOfWeek: Number,
    dayOfMonth: Number,
    recipients: [{
      email: String,
      name: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastRunAt: {
    type: Date
  }
});

module.exports = mongoose.model('Report', ReportSchema);
