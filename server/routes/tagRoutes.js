const express = require('express');
const router = express.Router();
const { getTags, createTag } = require('../controllers/tagController');

router.route('/')
  .get(getTags)
  .post(createTag);

module.exports = router;
