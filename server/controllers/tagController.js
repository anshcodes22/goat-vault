const { Tag, PREDEFINED_TOPICS } = require('../models/Tag');
const Problem = require('../models/Problem');

// Seed predefined topics if not already seeded
const seedPredefinedTags = async () => {
  try {
    for (const name of PREDEFINED_TOPICS) {
      await Tag.findOneAndUpdate(
        { name },
        { name, category: 'predefined' },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } catch (err) {
    console.error('Error seeding predefined tags:', err.message);
  }
};

// @desc    Get all topics and custom tags
// @route   GET /api/tags
// @access  Public
const getTags = async (req, res, next) => {
  try {
    // Gather all tags from Tag model
    const tags = await Tag.find({}).sort({ name: 1 });

    // Also gather any custom tags currently stored on Problems to ensure 100% sync
    const problemCustomTags = await Problem.distinct('customTags');
    const existingTagNames = new Set(tags.map((t) => t.name.toLowerCase()));

    const combinedCustom = [...tags.filter((t) => t.category === 'custom').map((t) => t.name)];
    for (const tag of problemCustomTags) {
      if (tag && !existingTagNames.has(tag.toLowerCase())) {
        combinedCustom.push(tag);
        // Persist to Tag model
        Tag.create({ name: tag, category: 'custom' }).catch(() => {});
      }
    }

    res.json({
      success: true,
      predefined: PREDEFINED_TOPICS,
      customTags: Array.from(new Set(combinedCustom)).sort()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new custom tag
// @route   POST /api/tags
// @access  Public
const createTag = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tag name is required' });
    }

    const trimmed = name.trim();

    // Check if in predefined topics
    const isPredefined = PREDEFINED_TOPICS.some(
      (topic) => topic.toLowerCase() === trimmed.toLowerCase()
    );

    if (isPredefined) {
      return res.status(200).json({
        success: true,
        message: 'Tag is already part of predefined topics',
        tag: { name: trimmed, category: 'predefined' }
      });
    }

    let tag = await Tag.findOne({
      name: { $regex: new RegExp(`^${trimmed}$`, 'i') }
    });

    if (!tag) {
      tag = await Tag.create({ name: trimmed, category: 'custom' });
    }

    res.status(201).json({
      success: true,
      tag
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTags,
  createTag,
  seedPredefinedTags
};
