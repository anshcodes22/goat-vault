const mongoose = require('mongoose');

const PREDEFINED_TOPICS = [
  'Arrays',
  'Strings',
  'Hashing',
  'Binary Search',
  'Two Pointers',
  'Sliding Window',
  'Linked Lists',
  'Stacks',
  'Queues',
  'Trees',
  'Binary Search Trees',
  'Heaps',
  'Graphs',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Recursion',
  'Sorting',
  'Bit Manipulation',
  'Tries',
  'Disjoint Set Union',
  'Topological Sort',
  'Shortest Paths',
  'Segment Trees',
  'Fenwick Trees',
  'Math',
  'Number Theory',
  'Prefix Sums',
  'Monotonic Stack',
  'Other'
];

const TagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['predefined', 'custom'],
      default: 'custom'
    },
    count: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = {
  Tag: mongoose.model('Tag', TagSchema),
  PREDEFINED_TOPICS
};
