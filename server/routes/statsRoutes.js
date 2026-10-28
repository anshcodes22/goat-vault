const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/statsController');

router.route('/dashboard')
  .get(getDashboardStats);

module.exports = router;
