const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const { CommunityGroupMessage, CommunityGroupAttachment, Friends } = require('../models');
const { sendMsg, sendData, sendMsgAndData } = require('../const/sendResponse');

router.get('/getAllCommunityGroupMessages', async (req, res) => {
  const { communityId, limit } = req.query;
  const communityMessages = await CommunityGroupMessage.aggregate([
    { $match: { communityId } },
    { $unwind: '$msg' },
    { $sort: { 'msg.timestamp': -1 } },
    { $limit: parseInt(limit) },
  ]);
  if (communityMessages === null) {
    sendData(res, []);
  } else {
    let messages = [];
    const communityGroupAttachmentData = await CommunityGroupAttachment.findOne({ communityId });
    const communityGroupMessages = JSON.parse(JSON.stringify(communityMessages));
    _.map(communityGroupMessages, (msg, index) => {
       let message = communityGroupMessages[communityGroupMessages.length - index - 1];
        if (message.msg.type === 'image') {
          const attachmentData = communityGroupAttachmentData.images.id(message.msg.attachmentId);
          if (typeof attachmentData === 'object') {
            const filePath = path.normalize(__dirname + `../../communityChat-attachments/${communityId}/images/${attachmentData.name}`)
            const file = fs.readFileSync(filePath);
            const base64Image = new Buffer.from(file).toString('base64');
            let messageObject = Object.assign({}, message.msg);
            messageObject.id = attachmentData._id;
            messageObject.attachmentName = attachmentData.name;
            messageObject.src = `data:${attachmentData.type};base64,${base64Image}`;
            messages.push(messageObject);
          }
        }
        if (message.msg.type === 'docs') {
          const attachmentData = communityGroupAttachmentData.docs.id(message.msg.attachmentId);
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

router.post('/uploadGroupChatAttachment', async (req, res) => {
  const { communityId, type } = req.body;
  const { file } = req.files;
  const fileType = file.mimetype.split('/')[0] === 'image' ? 'image' : 'docs';
  const directory = fileType === 'image' ? 'images' : 'docs';
  let uploadFolder = path.normalize(__dirname + `../../communityChat-attachments/${communityId}/${directory}/`);
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
            await CommunityGroupAttachment.findOne({ communityId })
              .then(async (chatAttachments) => {
                let chatFilesInstance = ''
                if (chatAttachments === null) {
                  if (fileType === 'image') {
                    chatFilesInstance = new CommunityGroupAttachment({ communityId, images: [attachedfile], docs: [] });
                    await chatFilesInstance.save();
                  }
                  if (fileType === 'docs') {
                    chatFilesInstance = new CommunityGroupAttachment({ communityId, images: [], docs: [attachedfile] });
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
        await CommunityGroupAttachment.findOne({ communityId })
          .then(async (chatAttachments) => {
            if (chatAttachments === null) {
              let chatFilesInstance = ''
              if (fileType === 'image') {
                chatFilesInstance = new CommunityGroupAttachment({ communityId, images: [attachedfile], docs: [] });
                await chatFilesInstance.save();
              }
              if (fileType === 'docs') {
                chatFilesInstance = new CommunityGroupAttachment({ communityId, images: [], docs: [attachedfile] });
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




module.exports = router;


