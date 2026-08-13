const express = require('express');
const router = express.Router();
const {
    getOutfitRecommendation,
    streamOutfitRecommendation
} = require('../controllers/aiStylistController');

router.post('/recommend-outfit', getOutfitRecommendation);
router.post('/recommend-outfit-stream', streamOutfitRecommendation);

module.exports = router;