const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/problemController');

// Main Problem CRUD
router.route('/')
  .get(getProblems)
  .post(createProblem);

router.route('/:id')
  .get(getProblemById)
  .put(updateProblem)
  .delete(deleteProblem);

// Revision Tracking
router.route('/:id/revisit')
  .post(markAsRevisited);

router.route('/:id/revision-history')
  .get(getRevisionHistory);

// Approach Variants Management
router.route('/:id/approaches')
  .post(addApproachVariant);

router.route('/:id/approaches/:approachId')
  .put(updateApproachVariant)
  .delete(deleteApproachVariant);

router.route('/:id/approaches/:approachId/rename')
  .patch(renameApproachVariant);

module.exports = router;
