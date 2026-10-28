const mongoose = require('mongoose');
const crypto = require('crypto');

const ApproachSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => crypto.randomUUID(),
      required: true
    },
    name: {
      type: String,
      required: [true, 'Approach name is required'],
      trim: true
    },
    explanation: {
      type: String,
      default: ''
    },
    code: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: 'C++'
    },
    timeComplexity: {
      type: String,
      default: ''
    },
    spaceComplexity: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const RevisionEventSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => crypto.randomUUID(),
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    notes: {
      type: String,
      default: ''
    },
    variantReviewed: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const ProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true
    },
    problemNumber: {
      type: String,
      required: [true, 'Problem number / identifier is required'],
      trim: true
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: ['LeetCode', 'TakeUForward', 'AtCoder', 'CodeChef', 'Codeforces', 'CSES', 'Other'],
      trim: true
    },
    customPlatformName: {
      type: String,
      trim: true,
      default: ''
    },
    problemUrl: {
      type: String,
      trim: true,
      default: ''
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Unknown'],
      default: 'Medium'
    },
    topics: {
      type: [String],
      default: []
    },
    customTags: {
      type: [String],
      default: []
    },
    language: {
      type: String,
      default: 'C++'
    },
    confusionNotes: {
      type: String,
      default: ''
    },
    firstSolvedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    lastRevisitedAt: {
      type: Date,
      default: null
    },
    revisitCount: {
      type: Number,
      default: 0
    },
    approaches: {
      type: [ApproachSchema],
      default: () => [
        {
          id: crypto.randomUUID(),
          name: 'Optimal',
          explanation: '',
          code: '',
          language: 'C++',
          timeComplexity: '',
          spaceComplexity: '',
          notes: ''
        }
      ]
    },
    revisionHistory: {
      type: [RevisionEventSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ProblemSchema.index({ platform: 1, customPlatformName: 1, problemNumber: 1 });
ProblemSchema.index({ difficulty: 1 });
ProblemSchema.index({ topics: 1 });
ProblemSchema.index({ customTags: 1 });
ProblemSchema.index({ firstSolvedAt: -1 });
ProblemSchema.index({ lastRevisitedAt: -1 });
ProblemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Problem', ProblemSchema);
