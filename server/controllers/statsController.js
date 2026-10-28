const Problem = require('../models/Problem');

// @desc    Get dashboard statistics calculated from database
// @route   GET /api/stats/dashboard
// @access  Public
const getDashboardStats = async (req, res, next) => {
  try {
    const totalProblems = await Problem.countDocuments();

    // If 0 problems, return empty stats structure
    if (totalProblems === 0) {
      return res.json({
        success: true,
        stats: {
          totalProblems: 0,
          totalRevisits: 0,
          dueForRevisionCount: 0,
          neverRevisitedCount: 0,
          byPlatform: [],
          byDifficulty: {
            Easy: 0,
            Medium: 0,
            Hard: 0,
            Unknown: 0
          },
          byTopic: [],
          recentlyAdded: [],
          recentlyRevisited: [],
          revisionDueProblems: []
        }
      });
    }

    const [
      byDifficultyAgg,
      byPlatformAgg,
      byTopicAgg,
      recentlyAdded,
      recentlyRevisited,
      neverRevisitedCount,
      totalRevisitsAgg
    ] = await Promise.all([
      // Group by difficulty
      Problem.aggregate([
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 }
          }
        }
      ]),

      // Group by platform
      Problem.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$platform', 'Other'] },
                {
                  $cond: [
                    { $gt: [{ $strLenCP: { $ifNull: ['$customPlatformName', ''] } }, 0] },
                    { $concat: ['Other: ', '$customPlatformName'] },
                    'Other'
                  ]
                },
                '$platform'
              ]
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Group by topic (unwind topics and customTags)
      Problem.aggregate([
        {
          $project: {
            allTags: {
              $setUnion: [
                { $ifNull: ['$topics', []] },
                { $ifNull: ['$customTags', []] }
              ]
            }
          }
        },
        { $unwind: '$allTags' },
        {
          $group: {
            _id: '$allTags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 12 }
      ]),

      // Recently added problems (last 6)
      Problem.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title problemNumber platform customPlatformName difficulty topics customTags firstSolvedAt lastRevisitedAt revisitCount createdAt')
        .lean(),

      // Recently revisited problems (last 6)
      Problem.find({ revisitCount: { $gt: 0 }, lastRevisitedAt: { $ne: null } })
        .sort({ lastRevisitedAt: -1 })
        .limit(6)
        .select('title problemNumber platform customPlatformName difficulty topics customTags lastRevisitedAt revisitCount')
        .lean(),

      // Never revisited count
      Problem.countDocuments({ revisitCount: 0 }),

      // Total revisits count
      Problem.aggregate([
        {
          $group: {
            _id: null,
            totalRevisits: { $sum: '$revisitCount' }
          }
        }
      ])
    ]);

    // Format difficulty
    const byDifficulty = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
      Unknown: 0
    };
    byDifficultyAgg.forEach((item) => {
      if (item._id && byDifficulty[item._id] !== undefined) {
        byDifficulty[item._id] = item.count;
      } else if (item._id) {
        byDifficulty[item._id] = item.count;
      }
    });

    // Format platform stats with percentage
    const byPlatform = byPlatformAgg.map((item) => ({
      platform: item._id,
      count: item.count,
      percentage: totalProblems > 0 ? Math.round((item.count / totalProblems) * 100) : 0
    }));

    // Format topic stats
    const byTopic = byTopicAgg.map((item) => ({
      topic: item._id,
      count: item.count
    }));

    // Calculate due for revision (7 days threshold by default)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const revisionDueProblems = await Problem.find({
      $or: [
        { revisitCount: 0, firstSolvedAt: { $lte: sevenDaysAgo } },
        { revisitCount: { $gt: 0 }, lastRevisitedAt: { $lte: sevenDaysAgo } }
      ]
    })
      .sort({ lastRevisitedAt: 1, firstSolvedAt: 1 })
      .limit(6)
      .select('title problemNumber platform customPlatformName difficulty topics customTags firstSolvedAt lastRevisitedAt revisitCount')
      .lean();

    const dueForRevisionCount = await Problem.countDocuments({
      $or: [
        { revisitCount: 0, firstSolvedAt: { $lte: sevenDaysAgo } },
        { revisitCount: { $gt: 0 }, lastRevisitedAt: { $lte: sevenDaysAgo } }
      ]
    });

    const totalRevisits = totalRevisitsAgg[0]?.totalRevisits || 0;

    res.json({
      success: true,
      stats: {
        totalProblems,
        totalRevisits,
        dueForRevisionCount,
        neverRevisitedCount,
        byPlatform,
        byDifficulty,
        byTopic,
        recentlyAdded,
        recentlyRevisited,
        revisionDueProblems
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
