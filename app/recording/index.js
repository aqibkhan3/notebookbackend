const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const util = require('util');

const { Recordings } = require('../models');
const { sendMsg, sendData, sendMsgAndData, sendStream } = require('../const/sendResponse');

router.post('/', async (req, res) => {
  let formObject = { userId: '', videoName: '', blobFileName: '' };
  const form = new formidable.IncomingForm();
  const dir = !!process.platform.match(/^win/) ? '\\uploads\\' : '/uploads/';
  form.uploadDir = __dirname + dir;
  form.keepExtensions = true;
  form.maxFieldsSize = 10 * 1024 * 1024 * 1024 * 1024;

  form.parse(req, async (err, fields, files) => {
    const file = util.inspect(files);
    formObject.blobFileName = file && file.split('path:')[1].split('\',')[0].split(dir)[1].toString().replace(/\\/g, '').replace(/\//g, '');
    formObject.userId = fields.userId;
    formObject.videoName = fields.videoName;

    if (formObject && formObject.videoName !== '' && formObject.blobFileName !== '') {
      const recordingInstance = new Recordings(formObject);
      await Recordings.findOne({ userId: formObject.userId, videoName: formObject.videoName })
        .then(async (recordItem) => {
          if (recordItem && recordItem.length > 0) {
            sendMsg(res, 'Recording exist with same name');
          } else {
            await recordingInstance.save(formObject)
              .then(async (recordSaveItem) => {
                sendData(res, recordSaveItem, 'success');
              }).catch((err) => {
                sendMsg(res, 'Error while saving Recording', err);
              });
          }
        }).catch((err) => {
          console.log(err);
        });
    }
  });
});

router.get('/getAllRecording', async (req, res) => {
  await Recordings.find({ userId: req.query.userId })
    .then(async (recordingItems) => {
      if (recordingItems && recordingItems.length > 0) {
        sendData(res, recordingItems);
      } else {
        sendMsg(res, 'No Recording Found');
      }
    }).catch((err) => {
      console.log(err);
    });
});

router.get('/download', async (req, res) => {
  await Recordings.find({ userId: req.query.userId, videoName: req.query.videoName })
    .then(async (recordingItems) => {
      if (recordingItems && recordingItems.length > 0) {
        const readStream = fs.readFileSync(recordingItems[0].videoPath);
        console.log('readStream', readStream);
        sendStream(res, recordingItems, readStream);
      } else {
        sendMsg(res, 'No video Found with this name');
      }
    }).catch((err) => {
      console.log(err);
    });
});

router.get('/play', async (req, res) => {
  await Recordings.find({ userId: req.query.userId, videoName: req.query.videoName })
    .then(async (recordingItems) => {
      if (recordingItems && recordingItems.length > 0) {
        const readStream = fs.readFileSync(path.join(__dirname, './uploads/') + recordingItems[0].blobFileName);
        sendData(res, readStream);
      } else {
        sendMsg(res, 'No video Found with this name');
      }
    }).catch((err) => {
      console.log(err);
    });
});

module.exports = router;