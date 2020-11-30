const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { CommunityGroupMessage } = require('../models');


module.exports = function communityService({ io, socket, data }) {
  const { room } = data;

  socket.on('typing-community-group-chat', ({ room, fullname }) => {
    const messageBody = {
      room,
      fullname,
      socketId: socket.id
    };
    socket.broadcast.to(room).emit('updated-typing-private-chat', messageBody);
  }
  );

  socket.on(
    'sendMessageInCommunityGroup',
    ({ communityId, senderId, senderName, messageText, mimeType, type, attachmentId, filename, timestamp }, callback) => {
      const messageBody = {
        senderId,
        senderName,
        messageText,
        timestamp,
        attachmentId,
        type,
        mimeType,
        filename
      };

      const chatMessage = { communityId, msg: [messageBody] };
      insertMessage(chatMessage);

      chatMessage.socketId = socket.id;
      if (type === 'image') {
        const filePath = path.normalize(__dirname + `../../communityChat-attachments/${communityId}/images/${filename}`)
        const file = fs.readFileSync(filePath);
        const base64Image = new Buffer.from(file).toString('base64');
        messageBody.src = `data:${mimeType};base64,${base64Image}`;
      }
      if (type === 'docs') {
        const filePath = path.normalize(__dirname + `../../communityChat-attachments/${communityId}/docs/${filename}`)
        const file = fs.readFileSync(filePath);
        const base64Image = new Buffer.from(file).toString('base64');
        messageBody.src = `data:${mimeType};base64,${base64Image}`;
      }
      if (type === 'image' || type === 'docs' || type === 'text') {
        socket.broadcast.to(room).emit('recieveGroupMsg', messageBody);
      }
      callback();
    }
  );
}

const insertMessage = async (chatMessage) => {
  if (chatMessage.communityId) {
    const chat = await CommunityGroupMessage.findOne({ communityId: chatMessage.communityId })
    if (chat === null) {
      const chatInstance = new CommunityGroupMessage(chatMessage);
      await chatInstance.save();
    } else {
      chat.msg.push(chatMessage.msg[0]);
      await chat.save();
    }
  }
}
