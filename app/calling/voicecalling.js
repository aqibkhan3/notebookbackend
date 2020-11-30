const express = require('express');
const fs = require('fs');
const path = require('path');


module.exports = function voiceCalling({ io, socket, data }) {
    const { username, fullname, room } = data;
    let joinedPeers = [];

    socket.on('join', (data) => {
        // socket.set('user-data', data, function() {

        // });
    });

    socket.emit('connection-success', {
        success: socket.id,
        username,
        fullname,
    });

    const broadcast = () => {
        io.to(room).emit('joined-peers', { joinedPeers: joinedPeers })
    };

    broadcast();

    socket.on('disconnect', () => {
        console.log('disconnected');
        if (joinedPeers && joinedPeers.length > 0) {
            joinedPeers.forEach((joinedPeer, index) => {
                if (joinedPeer.socketID === socket.id) {
                    joinedPeers.splice(index, 1);
                }
            });
        }
        // socket.adapter.rooms.delete(socket.id)
        disconnectedPeer(socket.id);
    });

    const disconnectedPeer = (socketID) => {
        io.to(room).emit('peer-disconnected', { socketID })
    };

    socket.on('cancel-call', (data) => {
        if (joinedPeers && joinedPeers.length > 0) {
            joinedPeers.forEach((joinedPeer, index) => {
                if (joinedPeer.socketID === data.socketID.local) {
                    joinedPeers.splice(index, 1);
                }
            });
        }
        // socket.adapter.rooms.delete(data.localSocketId);
        cancelCall(data.localSocketId);
    });

    const cancelCall = (socketID) => {
        io.to(room).emit('cancel-call', { socketID })
    };

    socket.on('onlinePeers', (data) => {
        // socket.broadcast.to(room).emit('online-peer', data.localSocketId);
    });

    socket.on('offer', (data) => {
        if (socket.id === data.remoteSocketId) {
            io.to(room).emit('offer', {
                sdp: data.payload,
                socketID: data.localSocketId,
            });
        }
    });

    socket.on('answer', (data) => {
        if (socket.id === data.remoteSocketId) {
            io.to(room).emit('answer', {
                sdp: data.payload,
                socketID: data.localSocketId,
            });
        }
    });

    socket.on('candidate', (data) => {
        if (socket.id === data.remoteSocketId) {
            io.to(room).emit('candidate', {
                sdp: data.payload,
                socketID: data.localSocketId,
            });
        }
    });
}

