const express = require('express');
const router = express.Router();
const { Community, Users } = require('../models');
const { sendMsg, sendData, sendMsgAndData } = require('../const/sendResponse');


router.get('/filterCommunity', async (req, res) => {
  await Community.find()
    .limit(30)
    .then(async (subscribedCommunity) => {
      if (subscribedCommunity && subscribedCommunity.length > 0) {
        const communityIds = subscribedCommunity.map(subscribeCommunity => subscribeCommunity.communityId);
        await Community.find()
          .where('communityId').in(communityIds)
          .then(async (communities) => {
            sendData(res, communities);
          }).catch((err) => {
            sendMsg(res, err, 'error');
          });
      }
    }).catch((err) => {
      sendMsg(res, 'no friends found', 'error');
    });
});

router.get('/filterFriends', async (req, res) => {
  await Users.find()
    .skip(req.params.skip)
    .limit(req.params.limit)
    .then(async (subscribedCommunity) => {
      if (subscribedCommunity && subscribedCommunity.length > 0) {
        const communityIds = subscribedCommunity.map(subscribeCommunity => subscribeCommunity.communityId);
        await Community.find()
          .where('communityId').in(communityIds)
          .then(async (communities) => {
            sendData(res, communities);
          }).catch((err) => {
            sendMsg(res, err, 'error');
          });
      } else {
        await Community.find()
          .limit(20)
          .then((communities) => {
            sendData(res, communities);
          }).catch((err) => {
            sendMsg(res, err, 'error');
          });
      }
    }).catch((err) => {
      sendMsg(res, 'no friends found', 'error');
    });
});

module.exports = router;


