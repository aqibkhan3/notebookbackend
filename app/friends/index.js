const express = require('express');
const router = express.Router();
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { Friends, Users, ChatMessage } = require('../models');
const { sendMsg, sendData, sendMsgAndData } = require('../const/sendResponse');

const getThread = (firstValue, secondValue) => {
  if (firstValue < secondValue)
    return firstValue + '!' + secondValue;
  else
    return secondValue + '!' + firstValue;
}

router.post('/addFriend', async (req, res) => {
  const { friendId, userId } = req.body;
  const threadId = getThread(friendId, userId);
  const friendInstance = new Friends({ friendId, userId, threadId });
  await Friends.findOne({ threadId })
    .then(async (isFriendExist) => {
      if (isFriendExist === null) {
        await friendInstance.save();
        sendMsg(res, 'add in Friend List.')
      } else {
        sendMsg(res, 'already in friend list.')
      }
    }).catch((err) => {
      sendMsg(res, 'no friends found', 'error');
    });
});

router.get('/removeFriend', async (req, res) => {
  const { friendId, userId } = req.query;
  const threadId = getThread(friendId, userId);
  await Friends.findOne({ threadId })
    .then(async (isFriendExist) => {
      if (isFriendExist !== null) {
        await Friends.deleteOne({ threadId });
        sendMsg(res, 'Delete Friend From List.')
      } else {
        sendMsg(res, 'Friend From List.')
      }
    }).catch((err) => {
      sendMsg(res, 'no friends found', 'error');
    });
});

router.get('/findfriend', async (req, res) => {
  const { friendId, userId } = req.query;
  const threadId = getThread(friendId, userId);
  await Friends.findOne({ threadId })
    .then(async (isFriendExist) => {
      if (isFriendExist === null) {
        await Users.findOne({ id: friendId })
          .then(async (friend) => {
            if (friend && friend.profilePic) {
              const filePath =
                path.normalize(__dirname + `../../user-Profile/${friendId}/images/${friend.profilePic}`)
              const file = fs.readFileSync(filePath);
              const base64Image = new Buffer.from(file).toString('base64');
              let data = { ...friend._doc }
              data.src = `data:${friend.mimeType};base64,${base64Image}`;
              sendData(res, data)
            } else {
              sendData(res, friend)
            }
          })
      } else {
        if (isFriendExist) {
          await Users.findOne({ id: friendId })
            .then(async (friend) => {
              if (friend && friend.profilePic) {
                const filePath =
                  path.normalize(__dirname + `../../user-Profile/${friendId}/images/${friend.profilePic}`)
                const file = fs.readFileSync(filePath);
                const base64Image = new Buffer.from(file).toString('base64');
                let data = { ...friend._doc }
                data.src = `data:${friend.mimeType};base64,${base64Image}`;
                data.isFriend = true;
                sendData(res, data)
              } else {
                let data = { ...friend._doc }
                data.isFriend = true;
                sendData(res, data)
              }
            })
        }
      }
    }).catch((err) => {
      sendMsg(res, 'no friends found', 'error');
    });
});

router.get('/getAllFriends', async (req, res) => {
  const { userId } = req.query;
  await Friends.find({
    $or: [{ userId: req.query.userId }, { friendId: req.query.userId }],
  })
    .then(async (friendList) => {
      if (friendList && friendList.length > 0) {
        const myFriendIds = friendList.map(friend => {
          if (friend.userId === req.query.userId) {
            return friend.friendId;
          } else if (friend.friendId === req.query.userId) {
            return friend.userId;
          }
        });
        await Users.find({ fullname: { '$regex': req.query.value != undefined ? req.query.value : '' } })
          .limit(20)
          .where('id').in(myFriendIds)
          .then(async (filterUsers) => {
            let updatedUsers = filterUsers.filter(user => user.id !== req.params.userId);

            if (updatedUsers && updatedUsers.length > 0) {
              let mutualFriend = [];
              for (let index = 0; index < updatedUsers.length; index++) {
                let countCommonFriends = 0;
                const threadId = getThread(updatedUsers[index].id, userId);
                await Friends.findOne({ threadId })
                  .then(async (isMutual) => {
                    const yourFriend = await Friends.find({
                      $or: [{ userId: updatedUsers[index].id }, { friendId: updatedUsers[index].id }],
                    })
                    if (yourFriend.length > 0) {
                      for (let y = 0; y < yourFriend.length; y++) {
                        if (myFriendIds.includes(yourFriend[y].userId)) {
                          countCommonFriends++;
                        } else if (myFriendIds.includes(yourFriend[y].friendId)) {
                          countCommonFriends++;
                        }
                      }
                    }
                    updatedUsers[index].commonFriend = countCommonFriends;
                    if (isMutual !== null)
                      updatedUsers[index].isFriend = true;

                    if (updatedUsers[index] && updatedUsers[index].profilePic) {
                      const filePath =
                        path.normalize(__dirname + `../../user-profile/${updatedUsers[index].id}/images/${updatedUsers[index].profilePic}`)
                      const file = fs.readFileSync(filePath);
                      const base64Image = new Buffer.from(file).toString('base64');
                      let data = { ...updatedUsers[index]._doc }
                      data.src = `data:${updatedUsers[index].mimeType};base64,${base64Image}`;
                      mutualFriend.push(data);
                    } else {
                      mutualFriend.push(updatedUsers[index]);
                    }
                  })
              }
              sendData(res, mutualFriend);
            } else {
              sendData(res, []);
            }
          }).catch((err) => {
            sendMsg(res, 'no friends found', 'error');
          });
      } else {
        sendData(res, []);
      }
    })
});

router.get('/getAllGlobalFriends', async (req, res) => {
  const { userId } = req.query;
  const myFriendIds = await Friends.find({ $or: [{ userId: req.query.userId }, { friendId: req.query.userId }], })
  await Users.find({ fullname: { '$regex': req.query.value } })
    .limit(20)
    .then(async (filterUsers) => {
      if (filterUsers && filterUsers.length > 0) {
        let mutualFriend = [];
        let unMutualFriend = [];
        let yourFriendIds = [];
        let countCommonFriends = 0;
        let updatedFilterList = filterUsers && filterUsers.filter((user) => user.id !== req.query.userId);
        for (let index = 0; index < updatedFilterList.length; index++) {
          const threadId = getThread(updatedFilterList[index].id, userId);
          await Friends.findOne({ threadId })
            .then(async (isMutual) => {
              yourFriendIds = await Friends.find({ userId: updatedFilterList[index].id });
              for (let m = 0; m < myFriendIds.length; m++) {
                for (let y = 0; y < yourFriendIds.length; y++) {
                  if (myFriendIds[m].friendId === yourFriendIds[y].friendId) {
                    countCommonFriends++;
                  }
                }
              }

              if (isMutual === null) {
                updatedFilterList[index].isFriend = false;
                updatedFilterList[index].commonFriend = countCommonFriends;

                if (updatedFilterList[index] && updatedFilterList[index].profilePic) {
                  const filePath =
                    path.normalize(__dirname + `../../user-profile/${updatedFilterList[index].id}/images/${updatedFilterList[index].profilePic}`)
                  const file = fs.readFileSync(filePath);
                  const base64Image = new Buffer.from(file).toString('base64');
                  let data = { ...updatedFilterList[index]._doc }
                  data.src = `data:${updatedFilterList[index].mimeType};base64,${base64Image}`;
                  unMutualFriend.push(data);
                } else {
                  unMutualFriend.push(updatedFilterList[index]);
                }
              } else {
                updatedFilterList[index].commonFriend = countCommonFriends;
                updatedFilterList[index].isFriend = true;
                if (updatedFilterList[index] && updatedFilterList[index].profilePic) {
                  const filePath =
                    path.normalize(__dirname + `../../user-profile/${updatedFilterList[index].id}/images/${updatedFilterList[index].profilePic}`)
                  const file = fs.readFileSync(filePath);
                  const base64Image = new Buffer.from(file).toString('base64');
                  let data = { ...updatedFilterList[index]._doc }
                  data.src = `data:${updatedFilterList[index].mimeType};base64,${base64Image}`;
                  mutualFriend.push(data);
                } else {
                  mutualFriend.push(updatedFilterList[index])
                }
              }
            })
        }
        const filterData = [...mutualFriend, ...unMutualFriend];
        sendData(res, filterData);
      } else {
        sendData(res, []);
      }
    }).catch((err) => {
      sendMsg(res, 'no friends found', 'error');
    });
});

router.get('/getAllFriendsChatRecent', async (req, res) => {
  const { userId } = req.query;
  await Friends.find({
    $or: [{ userId: req.query.userId }, { friendId: req.query.userId }],
  })
    .then(async (friendList) => {
      if (friendList && friendList.length > 0) {
        const myFriendIds = friendList.map(friend => {
          if (friend.userId === req.query.userId) {
            return friend.friendId;
          } else if (friend.friendId === req.query.userId) {
            return friend.userId;
          }
        });
        await Users.find({ id: myFriendIds })
          .limit(20)
          .then(async (filterUsers) => {
            let updatedUsers = filterUsers.filter(user => user.id !== req.params.userId);
            let friendWithWhomWeChat = [];
            updatedUsers.filter((friendWithChat) => {
              myFriendIds.map((friendId) => {
                if (friendWithChat.id === friendId) {
                  const findFriend = filterUsers.find(user => user.id === friendId);
                  let base64Image = ''
                  if (findFriend.profilePic !== '') {
                    const filePath =
                      path.normalize(__dirname + `../../user-profile/${friendId}/images/${findFriend.profilePic}`)
                    const file = fs.readFileSync(filePath);
                    base64Image = new Buffer.from(file).toString('base64');
                  }
                  let data = { ...findFriend._doc }
                  data.src = `data:${findFriend.mimeType};base64,${base64Image}`;
                  friendWithWhomWeChat.push(data);
                }
              })
            })
            const chatIds = myFriendIds.map((friendId) => {
              const chatId = userId > friendId ? friendId + '&&' + userId : userId + '&&' + friendId;
              return chatId;
            });
            let friendsWeChat = [];
            await ChatMessage.find({ chatId: chatIds }).then((chats) => {
              if (chats !== null) {
                friendWithWhomWeChat && friendWithWhomWeChat.length > 0 &&
                  friendWithWhomWeChat.map((friendData) => {
                    chats.map(chat => {
                      const ids = chat.chatId.split('&&');
                      if (ids[0] === userId) {
                        friendId = ids[1];
                      } else {
                        friendId = ids[0];
                      }
                      if (friendId === friendData.id) {
                        if (chat.msg.length > 0) {
                          friendData.unReadMessagesLength = chat.msg.filter((x) => x.isRecieve === 0).length;
                          friendsWeChat.push(friendData);
                        }
                      }
                    })
                  })
              }
            });
            sendData(res, friendsWeChat);
          }).catch((err) => {
            sendMsg(res, 'no friends found', 'error');
          });
      } else {
        sendData(res, []);
      }
    })
});

module.exports = router;


