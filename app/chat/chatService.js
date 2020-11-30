const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { ChatMessage } = require('../models');


module.exports = function chat({ io, socket, data }) {
  const { username, fullname, room } = data;

  socket.on('typing-private-chat', ({ room, fullname }) => {
    const messageBody = {
      room,
      fullname,
      socketId: socket.id
    };
    socket.broadcast.to(room).emit('updated-typing-private-chat', messageBody);
  }
  );

  socket.on(
    'sendMsg',
    ({ chatId, senderId, senderName, messageText, mimeType, type, filename, attachmentId, timestamp }, callback) => {
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

      const chatMessage = { chatId, msg: [messageBody] };

      insertMessage(chatMessage);
      chatMessage.socketId = socket.id;
      if (type === 'image') {
        const filePath = path.normalize(__dirname + `../../chat-attachments/${chatId}/images/${filename}`)
        const file = fs.readFileSync(filePath);
        const base64Image = new Buffer.from(file).toString('base64');
        messageBody.src = `data:${mimeType};base64,${base64Image}`;
      }
      if (type === 'docs') {
        const filePath = path.normalize(__dirname + `../../chat-attachments/${chatId}/docs/${filename}`)
        const file = fs.readFileSync(filePath);
        const base64Image = new Buffer.from(file).toString('base64');
        messageBody.src = `data:${mimeType};base64,${base64Image}`;
      }
      if (type === 'image' || type === 'docs' || type == 'text') {
        socket.broadcast.to(room).emit('recieveMsg', messageBody);
      }
      callback();
    }
  );
}

const insertMessage = async (chatMessage) => {
  if (chatMessage.chatId) {
    const chat = await ChatMessage.findOne({ chatId: chatMessage.chatId })
    if (chat === null) {
      const chatInstance = new ChatMessage(chatMessage);
      await chatInstance.save();
    } else {
      chat.msg.push(chatMessage.msg[0]);
      await chat.save();
    }
  }
}
