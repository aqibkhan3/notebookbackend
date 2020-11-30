const express = require('express');
const router = express.Router();
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { Users, Community, UserSubscribeCommunity, Friends } = require('../models');
const { sendMsg, sendData, sendMsgAndData } = require('../const/sendResponse');

router.post('/addCommunity', async (req, res) => {
  const { communityId } = req.body;

  if (req && req.files !== null) {
    let communityInstance = new Community(req.body);
    const { file } = req.files;
    const fileType = file.mimetype.split('/')[0];
    const directory = fileType === 'image' && 'images';
    let uploadFolder = path.normalize(__dirname + `../../community-Profile/${communityInstance.communityId}/${directory}/`);
    const filename = `${uuidv4()}_${file.name}`
    const filePath = uploadFolder + `${filename}`;

    if (!fs.existsSync(uploadFolder)) {
      fs.mkdir(uploadFolder, { recursive: true }, async (err) => {
        if (err === null) {
          file.mv(filePath, async (error) => {
            if (error) {
              return res.status(400).json({ error });
            } else {
              await Community.findOne({ communityId: communityInstance.communityId })
                .then(async (isCommunityExist) => {
                  if (isCommunityExist === null) {
                    communityInstance.communityPic = filename;
                    communityInstance.mimeType = file.mimetype;
                    await communityInstance.save();
                    await UserSubscribeCommunity.findOne({ communityId: communityInstance.communityId })
                      .then(async (isSubscribeCommunityExist) => {
                        if (isSubscribeCommunityExist === null) {
                          const userSubscribeCommunityInstance = new UserSubscribeCommunity({
                            userId: req.body.userId, communityId: communityInstance.communityId
                          });
                          await userSubscribeCommunityInstance.save();
                          sendMsg(res, 'community add Successfully')
                        }
                      }).catch((err) => {
                        sendMsg(res, 'err while adding community')
                      })
                  }
                }).catch((err) => {
                  sendMsg(res, 'err while adding community')
                })
            }
          });
        }
      })
    } else {
      file.mv(filePath, async (error) => {
        if (error) {
          return res.status(400).json({ error });
        } else {
          await Community.findOne({ communityId: communityInstance.communityId })
            .then(async (isCommunityExist) => {
              if (isCommunityExist === null) {
                communityInstance.communityPic = filename;
                communityInstance.mimeType = file.mimetype;
                await communityInstance.save();
                await UserSubscribeCommunity.findOne({ communityId: communityInstance.communityId })
                  .then(async (isSubscribeCommunityExist) => {
                    if (isSubscribeCommunityExist === null) {
                      const userSubscribeCommunityInstance = new UserSubscribeCommunity({
                        userId: req.body.userId, communityId: communityInstance.communityId
                      });
                      await userSubscribeCommunityInstance.save();
                      sendMsg(res, 'community add Successfully')
                    }
                  }).catch((err) => {
                    sendMsg(res, 'err while adding community')
                  })
              }
            }).catch((err) => {
              sendMsg(res, 'err while adding community')
            })
        }
      });
    }
  } else {
    const communityInstance = new Community(req.body);
    await Community.findOne({ communityId: communityInstance.communityId })
      .then(async (isCommunityExist) => {
        if (isCommunityExist === null) {
          await communityInstance.save();
          await UserSubscribeCommunity.findOne({ communityId: communityInstance.communityId })
            .then(async (isSubscribeCommunityExist) => {
              if (isSubscribeCommunityExist === null) {
                const userSubscribeCommunityInstance = new UserSubscribeCommunity({
                  userId: req.body.userId, communityId: communityInstance.communityId
                });
                await userSubscribeCommunityInstance.save();
                sendMsg(res, 'community add Successfully')
              }
            }).catch((err) => {
              sendMsg(res, 'err while adding community')
            })
        }
      }).catch((err) => {
        sendMsg(res, 'err while adding community')
      })
  }
});

router.post('/updateCommunity', async (req, res) => {
  const { communityId } = req.body;
  const { file } = req.files;
  const fileType = file.mimetype.split('/')[0];
  const directory = fileType === 'image' && 'images';
  let uploadFolder = path.normalize(__dirname + `../../community-Profile/${communityId}/${directory}/`);
  const filename = `${uuidv4()}_${file.name}`
  const filePath = uploadFolder + `${filename}`;

  if (!fs.existsSync(uploadFolder)) {
    fs.mkdir(uploadFolder, { recursive: true }, async (err) => {
      if (err === null) {
        file.mv(filePath, async (error) => {
          if (error) {
            return res.status(400).json({ error });
          } else {
            await Community.findOne({ communityId })
              .then(async (community) => {
                if (community !== null) {
                  community.communityPic = filename;
                  community.mimeType = file.mimetype;
                  await community.updateOne(community)
                  sendMsg(res, 'community updated Successfully')
                }
              })
          }
        });
      }
    })
  } else {
    file.mv(filePath, async (error) => {
      if (error) {
        return res.status(400).json({ error });
      } else {
        await Community.findOne({ communityId })
          .then(async (community) => {
            community.communityPic = filename;
            community.mimeType = file.mimetype;
            await community.updateOne(community)
            sendMsg(res, 'community updated Successfully')
          })
      }
    });
  }
});


router.get('/getCommunity', async (req, res) => {
  const { communityId, userId } = req.query;
  await Community.findOne({ communityId })
    .then(async (community) => {
      await UserSubscribeCommunity.findOne({ communityId, userId })
        .then(async (isSubscribe) => {
          if (isSubscribe !== null) {
            if (community && community.communityPic) {
              const filePath =
                path.normalize(__dirname + `../../community-Profile/${communityId}/images/${community.communityPic}`)
              const file = fs.readFileSync(filePath);
              const base64Image = new Buffer.from(file).toString('base64');
              let data = { ...community._doc }
              data.src = `data:${community.mimeType};base64,${base64Image}`;
              data.isSubscribed = true
              sendData(res, data);
            } else {
              let data = { ...community._doc }
              data.isSubscribed = true
              sendData(res, data);
            }
          } else {
            if (community && community.communityPic) {
              const filePath =
                path.normalize(__dirname + `../../community-Profile/${communityId}/images/${community.communityPic}`)
              const file = fs.readFileSync(filePath);
              const base64Image = new Buffer.from(file).toString('base64');
              let data = { ...community._doc }
              data.src = `data:${community.mimeType};base64,${base64Image}`;
              sendData(res, data);
            } else {
              sendData(res, community);
            }
          }
        })
    }).catch((err) => {
      sendMsg(res, err, 'error');
    });
});

router.get('/getAllCommunity', async (req, res) => {
  await UserSubscribeCommunity.find({ userId: req.query.userId })
    .then(async (subscribedCommunity) => {
      if (subscribedCommunity && subscribedCommunity.length > 0) {
        const communityIds = subscribedCommunity.map(subscribeCommunity => subscribeCommunity.communityId);
        await Community.find({ communityName: { '$regex': req.query.value } })
          .where('communityId').in(communityIds)
          .then(async (communities) => {
            const subscribedCommunity = communities.map(community => { community.isSubscribed = true; return community });
            let subscribedCommunityWithProfiles = [];
            _.map(subscribedCommunity, (community) => {
              if (community && community.communityPic) {
                const filePath =
                  path.normalize(__dirname + `../../community-Profile/${community.communityId}/images/${community.communityPic}`)
                const file = fs.readFileSync(filePath);
                const base64Image = new Buffer.from(file).toString('base64');
                let data = { ...community._doc }
                data.src = `data:${community.mimeType};base64,${base64Image}`;
                subscribedCommunityWithProfiles.push(data);
              } else {
                subscribedCommunityWithProfiles.push(community);
              }
            })
            sendData(res, subscribedCommunityWithProfiles);
          }).catch((err) => {
            sendMsg(res, err, 'error');
          });
      } else {
        sendData(res, []);
      }
    }).catch((err) => {
      sendMsg(res, 'no friends found', 'error');
    });
});

router.get('/getAllGlobalCommunity', async (req, res) => {
  const friends = await Friends.find({ $or: [{ userId: req.query.userId }, { friendId: req.query.userId }], });
  let friendIds = friends && friends.map((friend) => friend.friendId);
  await Community.find({ communityName: { '$regex': req.query.value } })
    .limit(20)
    .then(async (communities) => {
      if (communities && communities.length > 0) {
        let globalCommunity = [];
        for (let index = 0; index < communities.length; index++) {
          const commonFriendSubscribeCommunity = await UserSubscribeCommunity
            .find({ communityId: communities[index].communityId })
            .where('userId').in(friendIds);
          communities[index].commonFriend = commonFriendSubscribeCommunity &&
            commonFriendSubscribeCommunity.length;
          const isIamSubscribedThisCommunity = await UserSubscribeCommunity
            .find({ userId: req.query.userId, communityId: communities[index].communityId });
          if (isIamSubscribedThisCommunity.length > 0) {
            communities[index].isSubscribed = true;
          }


          if (communities[index] && communities[index].communityPic) {
            const filePath =
              path.normalize(__dirname + `../../community-Profile/${communities[index].communityId}/images/${communities[index].communityPic}`)
            const file = fs.readFileSync(filePath);
            const base64Image = new Buffer.from(file).toString('base64');
            let data = { ...communities[index]._doc }
            data.src = `data:${communities[index].mimeType};base64,${base64Image}`;
            globalCommunity.push(data);
          } else {
            globalCommunity.push(communities[index]);
          }

        }
        sendData(res, globalCommunity);
      } else {
        sendData(res, []);
      }
    }).catch((err) => {
      sendMsg(res, 'no friends found', 'error');
    });
});

router.get('/unSubscribeCommunity', async (req, res) => {
  await UserSubscribeCommunity.findOne({ communityId: req.query.communityId, userId: req.query.userId })
    .then(async (communities) => {
      if (communities !== null) {
        await UserSubscribeCommunity.deleteOne({ communityId: req.query.communityId, userId: req.query.userId })
          .then(async (deleteCommunity) => {
            await Community.findOne({ communityId: req.query.communityId })
              .then(async (updateCommunity) => {
                updateCommunity.subscribers = updateCommunity.subscribers - 1
                await updateCommunity.updateOne(updateCommunity);
                sendMsg(res, 'community delete from user list');
              })
          })
      }
    }).catch((err) => {
      sendMsg(res, 'no friends found', 'error');
    });
});

router.get('/subscribeCommunity', async (req, res) => {
  const userSubscribeCommunityInstance = new UserSubscribeCommunity(req.query);
  await UserSubscribeCommunity.findOne({ communityId: req.query.communityId, userId: req.query.userId })
    .then(async (communities) => {
      if (communities === null) {
        await userSubscribeCommunityInstance.save();
        await Community.findOne({ communityId: req.query.communityId })
          .then(async (updateCommunity) => {
            updateCommunity.subscribers = updateCommunity.subscribers + 1
            await updateCommunity.updateOne(updateCommunity);
            sendMsg(res, 'community subscribe');
          })
      }
    }).catch((err) => {
      sendMsg(res, 'no friends found', 'error');
    });
});

module.exports = router;


