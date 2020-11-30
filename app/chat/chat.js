const express = require('express');
const router = express.Router();
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { ChatMessage, Friends, ChatFiles } = require('../models');
const { sendMsg, sendData, sendMsgAndData } = require('../const/sendResponse');

router.get('/getAllChatMessages', async (req, res) => {
  const { chatId, limit } = req.query;
  const chatMessages = await ChatMessage.aggregate([
    { $match: { chatId } },
    { $unwind: '$msg' },
    { $sort: { 'msg.timestamp': -1 } },
    { $limit: parseInt(limit) },
  ]);
  if (chatMessages === null) {
    sendData(res, []);
  } else {
    let messages = [];
    const chatFilesData = await ChatFiles.findOne({ chatId });
    _.map(chatMessages, (msg, index) => {
      let message = chatMessages[chatMessages.length - index - 1];
      if (message.msg.type === 'image') {
        const attachmentData = chatFilesData.images.id(message.msg.attachmentId);
        if (typeof attachmentData === 'object') {
          const filePath = path.normalize(__dirname + `../../chat-attachments/${chatId}/images/${attachmentData.name}`)
          const file = fs.readFileSync(filePath);
          const base64Image = new Buffer.from(file).toString('base64');
          message.msg.src = `data:${attachmentData.mimeType};base64,${base64Image}`;
          messages.push(message.msg);
        }
      }
      if (message.msg.type === 'docs') {
        const attachmentData = chatFilesData.docs.id(message.msg.attachmentId);
        if (typeof attachmentData === 'object') {
          let messageObject = {};
          messageObject.id = attachmentData._id;
          messageObject.attachmentName = attachmentData.name;
          messageObject.type = 'docs';
          messageObject = Object.assign(message.msg, messageObject);
          messages.push(messageObject);
        }
      }
      if (message.msg.type === 'text') {
        messages.push(message.msg);
      }
    })
    sendData(res, messages);
  }
});

router.get('/updateMessageReadInChat', async (req, res) => {
  const chatMessages = await ChatMessage.findOne({ chatId: req.query.chatId });
  if (chatMessages === null) {
    sendMsg(res, 'No Chat exist with this user.');
  } else {
    chatMessages.msg && chatMessages.msg.map((x) => x.isRecieve = 1);
    await chatMessages.save();
    sendMsg(res, 'Read all Messages');
  }
});

router.get('/getAllUnReadMessage', async (req, res) => {
  const { userId } = req.query;
  await Friends.find({
    $or: [{ userId: req.query.userId }, { friendId: req.query.userId }],
  })
    .then(async (friendList) => {
      let totalUnReadMessage = 0;
      if (friendList && friendList.length > 0) {
        const myFriendIds = friendList.map(friend => {
          if (friend.userId === req.query.userId) {
            return friend.friendId;
          } else if (friend.friendId === req.query.userId) {
            return friend.userId;
          }
        });

        const chatIds = myFriendIds.map((friendId) => {
          const chatId = userId > friendId ? friendId + '&&' + userId : userId + '&&' + friendId;
          return chatId;
        });
        await ChatMessage.find({ chatId: chatIds }).then((chats) => {
          if (chats !== null) {
            chats.map(chat => {
              if (chat.msg.length > 0) {
                totalUnReadMessage += chat.msg.filter((x) => x.isRecieve === 0).length;
              }
            })
          }
        });
        sendData(res, { totalUnReadMessage });
      }
    })
});


router.post('/uploadChatAttachment', async (req, res) => {
  const { chatId, type } = req.body;
  const { file } = req.files;
  const fileType = file.mimetype.split('/')[0] === 'image' ? 'image' : 'docs';
  const directory = fileType === 'image' ? 'images' : 'docs';
  let uploadFolder = path.normalize(__dirname + `../../chat-attachments/${chatId}/${directory}/`);
  const filename = `${uuidv4()}_${file.name}`
  const filePath = uploadFolder + `${filename}`;

  if (!fs.existsSync(uploadFolder)) {
    fs.mkdir(uploadFolder, { recursive: true }, async (err) => {
      if (err === null) {
        file.mv(filePath, async (error) => {
          if (error) {
            return res.status(400).json({ error });
          } else {
            const { mimetype, size } = file;
            const attachedfile = { name: filename, type: mimetype, size };
            await ChatFiles.findOne({ chatId })
              .then(async (chatAttachments) => {
                let chatFilesInstance = ''
                if (chatAttachments === null) {
                  if (fileType === 'image') {
                    chatFilesInstance = new ChatFiles({ chatId, images: [attachedfile], docs: [] });
                    await chatFilesInstance.save();
                  }
                  if (fileType === 'docs') {
                    chatFilesInstance = new ChatFiles({ chatId, images: [], docs: [attachedfile] });
                    await chatFilesInstance.save();
                  }
                  const attachmentId = fileType === 'image' ? chatFilesInstance.images[chatFilesInstance.images.length - 1]._id :
                    chatFilesInstance.docs[chatFilesInstance.docs.length - 1]._id
                  sendData(res, { filename, attachmentId })
                } else {
                  if (fileType === 'image') {
                    chatAttachments.images.push(attachedfile)
                  }
                  if (fileType === 'docs') {
                    chatAttachments.docs.push(attachedfile)
                  }
                  await chatAttachments.save();
                  const attachmentId = fileType === 'image' ? chatAttachments.images[chatAttachments.images.length - 1]._id :
                    chatAttachments.docs[chatAttachments.docs.length - 1]._id
                  sendData(res, { filename, attachmentId })
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
        const { mimetype, size } = file;
        const attachedfile = { name: filename, type: mimetype, size };
        await ChatFiles.findOne({ chatId })
          .then(async (chatAttachments) => {
            if (chatAttachments === null) {
              let chatFilesInstance = ''
              if (fileType === 'image') {
                chatFilesInstance = new ChatFiles({ chatId, images: [attachedfile], docs: [] });
                await chatFilesInstance.save();
              }
              if (fileType === 'docs') {
                chatFilesInstance = new ChatFiles({ chatId, images: [], docs: [attachedfile] });
                await chatFilesInstance.save();
              }
              const attachmentId = fileType === 'image' ? chatFilesInstance.images[chatFilesInstance.images.length - 1]._id :
                chatFilesInstance.docs[chatFilesInstance.docs.length - 1]._id
              sendData(res, { filename, attachmentId })
            } else {
              if (fileType === 'image') {
                chatAttachments.images.push(attachedfile)
              }
              if (fileType === 'docs') {
                chatAttachments.docs.push(attachedfile)
              }
              await chatAttachments.save();
              const attachmentId = fileType === 'image' ? chatAttachments.images[chatAttachments.images.length - 1]._id :
                chatAttachments.docs[chatAttachments.docs.length - 1]._id
              sendData(res, { filename, attachmentId })
            }
          })
      }
    });
  }
});

router.get('/downloadChatDocument', async (req, res) => {
  const { chatId, attachmentId } = req.query;
  const chatMessages = await ChatFiles.findOne({ chatId });
  if (chatMessages === null) {
    sendMsg(res, 'No Chat exist with this user.');
  } else {
    const document = chatMessages.docs && chatMessages.docs.length > 0 && chatMessages.docs.id(attachmentId);
    const filePath = path.normalize(__dirname + `../../chat-attachments/${chatId}/docs/${document.name}`)
    const file = fs.readFileSync(filePath);
    const base64Image = new Buffer.from(file).toString('base64');
    const src = `data:${document.mimeType};base64,${base64Image}`;
    sendData(res, src);
  }
});

module.exports = router;


