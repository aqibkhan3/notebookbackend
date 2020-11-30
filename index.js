const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const compression = require('compression');
const fileUpload = require('express-fileupload');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const fs = require('fs');

const PORT = process.env.PORT || 3000;

const http = require('http');

const io = require('socket.io')(http);

app.use(compression());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(cors());
app.use(fileUpload());

const dbConnection = require('./app/dbConnection');

const auth = require('./app/auth');
const friends = require('./app/friends');
const community = require('./app/community');
const explore = require('./app/explore');
const chat = require('./app/chat/chat');
const communityChat = require('./app/chat/groupChatCommunity');
const communityPost = require('./app/communityPosts');
const userPosts = require('./app/userPosts');

const chatService = require('./app/chat/chatService');
const chatInCommunity = require('./app/chat/communityService');
const videoCalling = require('./app/calling/videocalling');
const voiceCalling = require('./app/calling/voicecalling');


app.options('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Accept,Referer,Origin,X-Requested-With');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept,Content-Type');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

app.use(express.static(path.normalize(__dirname + '/profiles')));
app.use(express.static(path.normalize(__dirname + '/documents')));
app.use(express.static(path.normalize(__dirname + '/images')));
app.use(express.static(path.normalize(__dirname + '/app-images')));

app.get('/', (req, res, next) => {
  res.send('Backend is running');
});



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/auth', auth);
app.use('/friends', friends);
app.use('/community', community);
app.use('/explore', explore);
app.use('/chat', chat);
app.use('/communityChat', communityChat);
app.use('/communityPost', communityPost);
app.use('/userPosts', userPosts);

const server = http.createServer(app).listen(PORT, () => {
  // dbConnection();
  console.log(`server listening on port ${PORT}!`);
});

io.listen(server);

io.on('connection', (socket) => {
  const { room, fullname, username, chatType, userId } = socket.handshake.query;

  const data = {
    io: io,
    socket: socket,
    data: { username, fullname, room, userId }
  }

  if (chatType === 'casual-chat') {
    chatService(data);
  } else if (chatType === 'voice-calling') {
    voiceCalling(data);
  } else if (chatType === 'video-calling') {
    videoCalling(data);
  } else {
    chatInCommunity(data)
  }

});
