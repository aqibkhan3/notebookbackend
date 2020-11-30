const express = require('express');
const router = express.Router();

const { Users, Community, UserSubscribeCommunity, Friends } = require('../models');
const { sendMsg, sendData, sendMsgAndData } = require('../const/sendResponse');

router.get('/getCommunity', async (req, res) => {
  const { communityId } = req.query;
  await Community.findOne({ communityId })
    .then(async (communities) => {
      sendData(res, communities);
    }).catch((err) => {
      sendMsg(res, err, 'error');
    });
});

module.exports = router;


