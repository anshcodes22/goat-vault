const crypto = require('crypto');
const Problem = require('../models/Problem');
const { Tag } = require('../models/Tag');

// Helper to check for duplicate problem with same platform & number
const checkDuplicate = async (platform, customPlatformName, problemNumber, excludeId = null) => {
  const query = {
    problemNumber: { $regex: new RegExp(`^${problemNumber.trim()}$`, 'i') }
  };

  if (platform === 'Other') {
    query.platform = 'Other';
    query.customPlatformName = {
      $regex: new RegExp(`^${(customPlatformName || '').trim()}$`, 'i')
    };
  } else {
    query.platform = platform;
  }

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return await Problem.findOne(query);
};

// Helper to sync custom tags to Tag model
const syncCustomTags = async (customTags = []) => {
  if (!Array.isArray(customTags)) return;
  for (const tag of customTags) {
    if (tag && tag.trim()) {
      const trimmed = tag.trim();
      await Tag.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
        { name: trimmed, category: 'custom' },
        { upsert: true }
      ).catch(() => {});
    }
  }
};

// Helper to check if something is typed for an approach variant
const isApproachFilled = (app) => Boolean(
  (app && app.code && app.code.trim().length > 0) ||
  (app && app.explanation && app.explanation.trim().length > 0) ||
  (app && app.timeComplexity && app.timeComplexity.trim().length > 0) ||
  (app && app.spaceComplexity && app.spaceComplexity.trim().length > 0) ||
  (app && app.notes && app.notes.trim().length > 0)
);

// @desc    Get all problems with search, filtering, sorting, pagination
// @route   GET /api/problems
// @access  Public
const getProblems = async (req, res, next) => {
  try {
    const {
      search,
      platform,
      difficulty,
      topic,
      language,
      hasConfusion,
      variant,
      neverRevisited,
      dueRevisionDays,
      firstSolvedStart,
      firstSolvedEnd,
      lastRevisitedStart,
      lastRevisitedEnd,
      sortBy = 'recent',
      page = 1,
      limit = 12
    } = req.query;

    const filter = {};

    // Text / keyword search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { problemNumber: regex },
        { topics: regex },
        { customTags: regex },
        { customPlatformName: regex }
      ];
    }

    // Platform filter
    if (platform && platform !== 'all') {
      if (platform.startsWith('Other:')) {
        filter.platform = 'Other';
        const customName = platform.replace('Other:', '').trim();
        if (customName) {
          filter.customPlatformName = new RegExp(`^${customName}$`, 'i');
        }
      } else {
        filter.platform = platform;
      }
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    // Topic / Tag filter
    if (topic && topic !== 'all') {
      filter.$or = filter.$or || [];
      const topicFilter = {
        $or: [
          { topics: topic },
          { customTags: topic }
        ]
      };
      // If we already had a top-level $or from search, combine with $and
      if (filter.$or.length > 0) {
        const searchOr = filter.$or;
        delete filter.$or;
        filter.$and = [{ $or: searchOr }, topicFilter];
      } else {
        delete filter.$or;
        filter.$or = [
          { topics: topic },
          { customTags: topic }
        ];
      }
    }

    // Language filter
    if (language && language !== 'all') {
      filter.language = language;
    }

    // Problems with confusion notes
    if (hasConfusion === 'true') {
      filter.confusionNotes = { $exists: true, $nin: ['', null] };
    }

    // Problems with specific approach variant name
    if (variant && variant.trim()) {
      filter['approaches.name'] = new RegExp(`^${variant.trim()}$`, 'i');
    }

    // Never revisited filter
    if (neverRevisited === 'true') {
      filter.revisitCount = 0;
    }

    // Due for revision filter
    if (dueRevisionDays && !isNaN(Number(dueRevisionDays))) {
      const days = Number(dueRevisionDays);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // A problem is due if either:
      // 1) It has never been revisited and firstSolvedAt <= cutoffDate
      // 2) It has been revisited and lastRevisitedAt <= cutoffDate
      const dueCondition = {
        $or: [
          { revisitCount: 0, firstSolvedAt: { $lte: cutoffDate } },
          { revisitCount: { $gt: 0 }, lastRevisitedAt: { $lte: cutoffDate } }
        ]
      };

      if (filter.$and) {
        filter.$and.push(dueCondition);
      } else {
        filter.$and = [dueCondition];
      }
    }

    // Date range filters
    if (firstSolvedStart || firstSolvedEnd) {
      filter.firstSolvedAt = filter.firstSolvedAt || {};
      if (firstSolvedStart) filter.firstSolvedAt.$gte = new Date(firstSolvedStart);
      if (firstSolvedEnd) filter.firstSolvedAt.$lte = new Date(firstSolvedEnd);
    }

    if (lastRevisitedStart || lastRevisitedEnd) {
      filter.lastRevisitedAt = filter.lastRevisitedAt || {};
      if (lastRevisitedStart) filter.lastRevisitedAt.$gte = new Date(lastRevisitedStart);
      if (lastRevisitedEnd) filter.lastRevisitedAt.$lte = new Date(lastRevisitedEnd);
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    switch (sortBy) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'alpha':
        sortOptions = { title: 1 };
        break;
      case 'firstSolved':
        sortOptions = { firstSolvedAt: -1 };
        break;
      case 'firstSolvedOldest':
        sortOptions = { firstSolvedAt: 1 };
        break;
      case 'recentRevisit':
        sortOptions = { lastRevisitedAt: -1, firstSolvedAt: -1 };
        break;
      case 'leastRevisit':
        // Show problems with null lastRevisitedAt first, then oldest revisited
        sortOptions = { lastRevisitedAt: 1, firstSolvedAt: 1 };
        break;
      case 'revisitCount':
        sortOptions = { revisitCount: -1 };
        break;
      case 'recent':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .collation({ locale: 'en', strength: 2 })
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Problem.countDocuments(filter)
    ]);

    // Also get distinct platforms and languages for dynamic filter lists
    const [allPlatforms, allLanguages] = await Promise.all([
      Problem.distinct('platform'),
      Problem.distinct('language')
    ]);

    res.json({
      success: true,
      problems,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      availableFilters: {
        platforms: allPlatforms,
        languages: allLanguages
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single problem by ID
// @route   GET /api/problems/:id
// @access  Public
const getProblemById = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    res.json({ success: true, problem });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new problem
// @route   POST /api/problems
// @access  Public
const createProblem = async (req, res, next) => {
  try {
    const {
      title,
      problemNumber,
      platform,
      customPlatformName,
      problemUrl,
      difficulty,
      topics,
      customTags,
      language,
      confusionNotes,
      firstSolvedAt,
      approaches
    } = req.body;

    // Basic validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Problem title is required' });
    }
    if (!problemNumber || !problemNumber.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Problem identifier / number is required' });
    }
    if (!platform) {
      return res.status(400).json({ success: false, message: 'Platform is required' });
    }
    if (platform === 'Other' && (!customPlatformName || !customPlatformName.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Custom platform name is required when platform is Other'
      });
    }

    // Check duplicate
    const existing = await checkDuplicate(
      platform,
      customPlatformName,
      problemNumber.toString().trim()
    );

    if (existing) {
      const platformLabel = platform === 'Other' ? customPlatformName : platform;
      return res.status(409).json({
        success: false,
        message: `A problem with identifier "${problemNumber}" already exists on ${platformLabel} ("${existing.title}").`,
        existingId: existing._id
      });
    }

    // Process approaches: only keep approaches for which something was typed
    let processedApproaches = [];
    if (Array.isArray(approaches) && approaches.length > 0) {
      const filled = approaches.filter(isApproachFilled);
      const toKeep = filled.length > 0 ? filled : [approaches[0]];
      processedApproaches = toKeep.map((app) => ({
        ...app,
        id: app.id || crypto.randomUUID(),
        name: app.name ? app.name.trim() : 'Approach'
      }));
    } else {
      processedApproaches = [
        {
          id: crypto.randomUUID(),
          name: 'Optimal',
          explanation: '',
          code: '',
          language: language || 'C++',
          timeComplexity: '',
          spaceComplexity: '',
          notes: ''
        }
      ];
    }

    const problemData = {
      title: title.trim(),
      problemNumber: problemNumber.toString().trim(),
      platform,
      customPlatformName: platform === 'Other' ? (customPlatformName || '').trim() : '',
      problemUrl: (problemUrl || '').trim(),
      difficulty: difficulty || 'Medium',
      topics: Array.isArray(topics) ? Array.from(new Set(topics.filter(Boolean))) : [],
      customTags: Array.isArray(customTags)
        ? Array.from(new Set(customTags.filter(Boolean).map((t) => t.trim())))
        : [],
      language: language || 'C++',
      confusionNotes: confusionNotes || '',
      firstSolvedAt: firstSolvedAt ? new Date(firstSolvedAt) : new Date(),
      approaches: processedApproaches,
      revisionHistory: []
    };

    const newProblem = await Problem.create(problemData);

    // Sync any custom tags
    if (problemData.customTags.length > 0) {
      syncCustomTags(problemData.customTags);
    }

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      problem: newProblem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update problem details
// @route   PUT /api/problems/:id
// @access  Public
const updateProblem = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const {
      title,
      problemNumber,
      platform,
      customPlatformName,
      problemUrl,
      difficulty,
      topics,
      customTags,
      language,
      confusionNotes,
      firstSolvedAt, // If provided explicitly, allow user to correct historical date
      approaches
    } = req.body;

    // Check duplicate if platform or problemNumber is being updated
    if (problemNumber || platform) {
      const checkPlat = platform || problem.platform;
      const checkCustom = platform === 'Other' ? (customPlatformName || problem.customPlatformName) : '';
      const checkNum = (problemNumber || problem.problemNumber).toString().trim();

      const existing = await checkDuplicate(checkPlat, checkCustom, checkNum, problem._id);
      if (existing) {
        const platformLabel = checkPlat === 'Other' ? checkCustom : checkPlat;
        return res.status(409).json({
          success: false,
          message: `A problem with identifier "${checkNum}" already exists on ${platformLabel} ("${existing.title}").`,
          existingId: existing._id
        });
      }
    }

    if (title !== undefined) problem.title = title.trim();
    if (problemNumber !== undefined) problem.problemNumber = problemNumber.toString().trim();
    if (platform !== undefined) problem.platform = platform;
    if (customPlatformName !== undefined) {
      problem.customPlatformName = (platform === 'Other' || (!platform && problem.platform === 'Other'))
        ? (customPlatformName || '').trim()
        : '';
    }
    if (problemUrl !== undefined) problem.problemUrl = (problemUrl || '').trim();
    if (difficulty !== undefined) problem.difficulty = difficulty;
    if (topics !== undefined) {
      problem.topics = Array.from(new Set(topics.filter(Boolean)));
    }
    if (customTags !== undefined) {
      problem.customTags = Array.from(new Set(customTags.filter(Boolean).map((t) => t.trim())));
      syncCustomTags(problem.customTags);
    }
    if (language !== undefined) problem.language = language;
    if (confusionNotes !== undefined) problem.confusionNotes = confusionNotes;

    // Preserve firstSolvedAt unless user specifically changed historical solve date
    if (firstSolvedAt) {
      problem.firstSolvedAt = new Date(firstSolvedAt);
    }

    // If approaches provided, preserve only filled approaches (or at least 1)
    if (Array.isArray(approaches) && approaches.length > 0) {
      const filled = approaches.filter(isApproachFilled);
      const toKeep = filled.length > 0 ? filled : [approaches[0]];
      problem.approaches = toKeep.map((app) => ({
        ...app,
        id: app.id || crypto.randomUUID(),
        name: app.name ? app.name.trim() : 'Approach'
      }));
    }

    const updated = await problem.save();

    res.json({
      success: true,
      message: 'Problem updated successfully',
      problem: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a problem
// @route   DELETE /api/problems/:id
// @access  Public
const deleteProblem = async (req, res, next) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark problem as revisited
// @route   POST /api/problems/:id/revisit
// @access  Public
const markAsRevisited = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const { notes = '', variantReviewed = '' } = req.body;
    const now = new Date();

    const revisionEvent = {
      id: crypto.randomUUID(),
      timestamp: now,
      notes: notes.trim(),
      variantReviewed: variantReviewed.trim()
    };

    problem.lastRevisitedAt = now;
    problem.revisitCount = (problem.revisitCount || 0) + 1;
    // Store in revisionHistory (keep chronological)
    problem.revisionHistory.push(revisionEvent);

    await problem.save();

    res.json({
      success: true,
      message: 'Revision recorded successfully',
      problem,
      revisionEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revision history for a problem
// @route   GET /api/problems/:id/revision-history
// @access  Public
const getRevisionHistory = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id).select('title problemNumber platform revisionHistory revisitCount lastRevisitedAt firstSolvedAt');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    res.json({
      success: true,
      revisionHistory: problem.revisionHistory,
      revisitCount: problem.revisitCount,
      lastRevisitedAt: problem.lastRevisitedAt,
      firstSolvedAt: problem.firstSolvedAt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new solution variant
// @route   POST /api/problems/:id/approaches
// @access  Public
const addApproachVariant = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const { name, explanation, code, language, timeComplexity, spaceComplexity, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Approach name is required' });
    }

    const trimmedName = name.trim();

    // Check duplicate name within the same problem
    const nameExists = problem.approaches.some(
      (app) => app.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      return res.status(400).json({
        success: false,
        message: `An approach named "${trimmedName}" already exists for this problem.`
      });
    }

    const newApproach = {
      id: crypto.randomUUID(),
      name: trimmedName,
      explanation: explanation || '',
      code: code || '',
      language: language || problem.language || 'C++',
      timeComplexity: timeComplexity || '',
      spaceComplexity: spaceComplexity || '',
      notes: notes || ''
    };

    problem.approaches.push(newApproach);
    await problem.save();

    res.status(201).json({
      success: true,
      message: 'Approach added successfully',
      approach: newApproach,
      approaches: problem.approaches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a specific solution variant (autosave / debounced save / explicit save)
// @route   PUT /api/problems/:id/approaches/:approachId
// @access  Public
const updateApproachVariant = async (req, res, next) => {
  try {
    const { id, approachId } = req.params;
    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const approachIndex = problem.approaches.findIndex((app) => app.id === approachId);
    if (approachIndex === -1) {
      return res.status(404).json({ success: false, message: 'Approach variant not found' });
    }

    const { name, explanation, code, language, timeComplexity, spaceComplexity, notes } = req.body;

    // If name is being changed, check for conflict
    if (name && name.trim() && name.trim().toLowerCase() !== problem.approaches[approachIndex].name.toLowerCase()) {
      const nameExists = problem.approaches.some(
        (app, idx) => idx !== approachIndex && app.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: `An approach named "${name.trim()}" already exists for this problem.`
        });
      }
      problem.approaches[approachIndex].name = name.trim();
    }

    if (explanation !== undefined) problem.approaches[approachIndex].explanation = explanation;
    if (code !== undefined) problem.approaches[approachIndex].code = code;
    if (language !== undefined) problem.approaches[approachIndex].language = language;
    if (timeComplexity !== undefined) problem.approaches[approachIndex].timeComplexity = timeComplexity;
    if (spaceComplexity !== undefined) problem.approaches[approachIndex].spaceComplexity = spaceComplexity;
    if (notes !== undefined) problem.approaches[approachIndex].notes = notes;

    await problem.save();

    res.json({
      success: true,
      message: 'Approach updated successfully',
      approach: problem.approaches[approachIndex],
      approaches: problem.approaches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rename a solution variant
// @route   PATCH /api/problems/:id/approaches/:approachId/rename
// @access  Public
const renameApproachVariant = async (req, res, next) => {
  try {
    const { id, approachId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'New approach name is required' });
    }

    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const approachIndex = problem.approaches.findIndex((app) => app.id === approachId);
    if (approachIndex === -1) {
      return res.status(404).json({ success: false, message: 'Approach variant not found' });
    }

    const trimmed = name.trim();
    const nameExists = problem.approaches.some(
      (app, idx) => idx !== approachIndex && app.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (nameExists) {
      return res.status(400).json({
        success: false,
        message: `An approach named "${trimmed}" already exists.`
      });
    }

    problem.approaches[approachIndex].name = trimmed;
    await problem.save();

    res.json({
      success: true,
      message: 'Approach renamed successfully',
      approach: problem.approaches[approachIndex],
      approaches: problem.approaches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a solution variant
// @route   DELETE /api/problems/:id/approaches/:approachId
// @access  Public
const deleteApproachVariant = async (req, res, next) => {
  try {
    const { id, approachId } = req.params;
    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    if (problem.approaches.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only remaining approach variant. A problem must have at least one approach.'
      });
    }

    const approachIndex = problem.approaches.findIndex((app) => app.id === approachId);
    if (approachIndex === -1) {
      return res.status(404).json({ success: false, message: 'Approach variant not found' });
    }

    const deletedName = problem.approaches[approachIndex].name;
    problem.approaches.splice(approachIndex, 1);
    await problem.save();

    res.json({
      success: true,
      message: `Approach "${deletedName}" deleted successfully`,
      approaches: problem.approaches
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  markAsRevisited,
  getRevisionHistory,
  addApproachVariant,
  updateApproachVariant,
  renameApproachVariant,
  deleteApproachVariant
};
