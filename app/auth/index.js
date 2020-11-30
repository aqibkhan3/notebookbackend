const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Cryptr = require('cryptr');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const cryptr = new Cryptr('myTotalySecretKey');
const pug = require('pug');
const { joinInvitation } = require('../sendMail');
const { Users } = require('../models');
const { sendMsg, sendData, sendMsgAndData, sendMsgAndDataWithToken } = require('../const/sendResponse');

router.get('/signIn', async (req, res) => {

  const { email, password } = req.query;
  const userDetail = await Users.findOne({ email, password })

  if (userDetail && userDetail.profilePic) {

    await Users.findOne({ email, password })
      .then(async (user) => {
        if (user && user !== null) {
          user.isOnline = 1;
          await user.updateOne(user)
            .then((updated) => {
              const filePath = path.join(req.headers.origin + `/profiles/${user.id}/${user.profilePic}`)
              let data = { ...user._doc };
              data.src = filePath;
              const token = jwt.sign({ id: user.id, fullname: user.fullname, }, 'secret', { expiresIn: '8d' });
              sendMsgAndDataWithToken(res, 'user login successfully', data, token, 'success');
            })
        }
        else {
          sendMsg(res, "user doesn't exist", 'info');
        }
      }).catch((err) => {
        sendMsg(res, err, 'error');
      })
  } else {
    if (userDetail && userDetail !== null) {
      userDetail.isOnline = 1;
      await userDetail.updateOne(userDetail)
        .then((updated) => {
          const token = jwt.sign({ id: userDetail.id, fullname: userDetail.fullname, }, 'secret', { expiresIn: '8d' });
          sendMsgAndDataWithToken(res, 'user login successfully', userDetail, token, 'success');
        })
    }
    else {
      sendMsg(res, "user doesn't exist", 'info');
    }
  }
});

router.post('/signUp', async (req, res) => {
  const userInstance = new Users(req.body);
  await Users.findOne({ email: req.body.email })
    .then(async (user) => {
      if (user !== null) {
        sendMsg(res, 'User Already Exist', 'error')
      } else if (user === null) {
        await userInstance.save()
          .then((userSave) => {
            const token = jwt.sign({ id: userSave.id, fullname: userSave.fullname, }, 'secret', { expiresIn: '8d' });
            sendMsgAndDataWithToken(res, 'User Successfully Register', userSave, token, 'success');
          }).catch((err) =>
            sendMsg('errrrr', err, 'error'));
      }
    }).catch((err) => {
      sendMsg(res, err);
    })
});

router.post('/updateUser', async (req, res) => {
  const { email, id } = req.body;
  const userDetail = await Users.findOne({ email })

  if (req.files !== null) {
    const { file } = req.files;
    const fileType = file.mimetype.split('/')[0];
    const directory = fileType === 'image' && 'images';
    let uploadFolder = path.normalize(__dirname + `profiles/${userDetail.id}/${directory}/`);
    const filename = `${uuidv4()}_${file.name}`
    const filePath = uploadFolder + `${filename}`;

    if (!fs.existsSync(uploadFolder)) {
      fs.mkdir(uploadFolder, { recursive: true }, async (err) => {
        if (err === null) {
          file.mv(filePath, async (error) => {
            if (error) {
              return res.status(400).json({ error });
            } else {
              await Users.findOne({ email, id })
                .then(async (user) => {
                  if (user !== null) {
                    user.fullname = req.body.fullname;
                    user.password = req.body.password;
                    user.phoneNumber = req.body.phone;
                    user.city = req.body.city;
                    user.state = req.body.state;
                    user.country = req.body.country;
                    user.occupation = req.body.occupation;
                    user.age = req.body.age;
                    user.profilePic = filename;
                    await user.updateOne(user)
                      .then((updatedUser) => {
                        const token = jwt.sign({ id: user.id, fullname: user.fullname, }, 'secret', { expiresIn: '8d' });
                        sendMsgAndDataWithToken(res, 'User Successfully Register', user, token, 'success');
                      }).catch((err) =>
                        console.log('errrrr', err));
                  }
                }).catch((err) => {
                  sendMsg(res, err, 'error');
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
          await Users.findOne({ email, id })
            .then(async (user) => {
              if (user !== null) {
                user.fullname = req.body.fullname;
                user.password = req.body.password;
                user.phoneNumber = req.body.phone;
                user.city = req.body.city;
                user.state = req.body.state;
                user.country = req.body.country;
                user.occupation = req.body.occupation;
                user.age = req.body.age;
                user.profilePic = filename;
                await user.updateOne(user)
                  .then((updatedUser) => {
                    const token = jwt.sign({ id: user.id, fullname: user.fullname, }, 'secret', { expiresIn: '8d' });
                    sendMsgAndDataWithToken(res, 'User Successfully Register', user, token, 'success');
                  }).catch((err) =>
                    console.log('errrrr', err));
              }
            }).catch((err) => {
              sendMsg(res, err, 'error');
            })
        }
      });
    }
  } else {
    await Users.findOne({ email, id })
      .then(async (user) => {
        if (user !== null) {
          user.fullname = req.body.fullname;
          user.password = req.body.password;
          user.phoneNumber = req.body.phoneNumber;
          user.city = req.body.city;
          user.state = req.body.state;
          user.country = req.body.country;
          user.occupation = req.body.occupation;
          await user.updateOne(user)
            .then((updatedUser) => {
              const token = jwt.sign({ id: user.id, fullname: user.fullname, }, 'secret', { expiresIn: '8d' });
              sendMsgAndDataWithToken(res, 'User Successfully Register', user, token, 'success');
            }).catch((err) =>
              console.log('errrrr', err));
        }
      }).catch((err) => {
        sendMsg(res, err, 'error');
      })
  }


});


module.exports = router;


