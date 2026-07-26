const express = require('express');
const router = express.Router();
const { getOutfitRecommendation } = require('../controllers/aiStylistController');

router.post('/recommend-outfit', getOutfitRecommendation);

module.exports = router;