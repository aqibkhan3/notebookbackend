const express = require('express');
const router = express.Router();
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const util = require('util');
const { v4: uuidv4 } = require('uuid');

const { CommunityPosts, Community, Friends, UserSubscribeCommunity } = require('../models');
const { sendMsg, sendData, sendMsgAndData, sendStream } = require('../const/sendResponse');

router.post('/addCommunityPost', async (req, res) => {
  const { communityId, description, type, title } = req.body;

  if (req.files !== null) {
    let files = [];
    const file = Object.entries(req.files);
    file.forEach(([key, value]) => {
      files.push(value);
    })
    _.map(files, (file) => {
      const fileType = file.mimetype.split('/')[0] === 'image' ? 'image' : 'docs';
      const directory = fileType === 'image' ? 'images' : 'docs';
      let uploadFolder = path.normalize(__dirname + `../../community-posts/${communityId}/${directory}/`);
      const filename = `${uuidv4()}_${file.name}`;
      const filePath = uploadFolder + `${filename}`;

      if (!fs.existsSync(uploadFolder)) {
        fs.mkdir(uploadFolder, { recursive: true }, async (err) => {
          if (err === null) {
            file.mv(filePath, async (error) => {
              if (error) {
                return res.status(400).json({ error });
              } else {
                const { mimetype, size } = file;
                const attachedfile = { title, name: filename, type: mimetype, size, description, createdDate: new Date() };
                await CommunityPosts.findOne({ communityId })
                  .then(async (communityPosts) => {
                    let chatFilesInstance = ''
                    if (communityPosts === null) {
                      if (fileType === 'image') {
                        chatFilesInstance = new CommunityPosts({ communityId, images: [attachedfile], docs: [], article: [] });
                        await chatFilesInstance.save();
                      }
                      if (fileType === 'docs') {
                        chatFilesInstance = new CommunityPosts({ communityId, images: [], docs: [attachedfile], article: [] });
                        await chatFilesInstance.save();
                      }
                    } else {
                      if (fileType === 'image') {
                        chatAttachments.images.push(attachedfile)
                      }
                      if (fileType === 'docs') {
                        chatAttachments.docs.push(attachedfile)
                      }
                      await chatAttachments.save();
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
            const attachedfile = { name: filename, title, type: mimetype, size, description, createdDate: new Date() };
            await CommunityPosts.findOne({ communityId })
              .then(async (communityPosts) => {
                if (communityPosts === null) {
                  let communityPostsInstance = ''
                  if (fileType === 'image') {
                    communityPostsInstance = new CommunityPosts({ communityId, images: [attachedfile], docs: [], article: [], });
                    await communityPostsInstance.save();
                  }
                  if (fileType === 'docs') {
                    communityPostsInstance = new CommunityPosts({ communityId, images: [], docs: [attachedfile], article: [], });
                    await communityPostsInstance.save();
                  }
                } else {
                  if (fileType === 'image') {
                    communityPosts.images.push(attachedfile)
                  }
                  if (fileType === 'docs') {
                    communityPosts.docs.push(attachedfile)
                  }
                  await communityPosts.save();
                }
              })
          }
        });
      }
    })
    sendMsg(res, 'post added')
  } else {
    await CommunityPosts.findOne({ communityId })
      .then(async (communityPosts) => {
        const attachedfile = { type, title, description, createdDate: new Date() };
        if (communityPosts === null) {
          const chatFilesInstance = new CommunityPosts({ communityId, images: [], docs: [], article: [attachedfile] });
          await chatFilesInstance.save();
        } else {
          communityPosts.article.push(attachedfile)
          await communityPosts.save();
        }
        sendMsg(res, 'post added')
      })
  }
});

router.get('/getCommunityAllPost', async (req, res) => {
  const { communityId, imagesLimit, docsLimit, articlesLimit } = req.query;
  await CommunityPosts.findOne({ communityId })
    .then(async (communityPosts) => {
      let data = {};
      let images = [];
      let docs = [];
      let articles = [];
      _.map(communityPosts.images, (post, index) => {
        const image = communityPosts.images[communityPosts.images.length - index - 1];
        if (images.length < imagesLimit) {
          const filePath = path.normalize(__dirname + `../../community-posts/${communityId}/images/${image.name}`)
          const file = fs.readFileSync(filePath);
          const base64Image = new Buffer.from(file).toString('base64');
          let messageObject = Object.assign({}, image);
          messageObject.src = `data:${image.type};base64,${base64Image}`;
          images.push(messageObject);
        }
      })
      _.map(communityPosts.docs, (post, index) => {
        const doc = communityPosts.docs[communityPosts.docs.length - index - 1];
        if (docs.length < docsLimit) {
        let messageObject = Object.assign({}, doc);
        docs.push(messageObject);
        }
      })
      _.map(communityPosts.articles, (post, index) => {
        const article = communityPosts.articles[communityPosts.articles.length - index - 1];
        if (articles.length < articlesLimit) {
        articles.push(article);
        }
      })
      data.images = images;
      data.docs = docs;
      data.articles = articles;

      data.imagesLength = communityPosts.images.length;
      data.docsLength = communityPosts.docs.length;
      data.articlesLength = communityPosts.articles.length;

      sendData(res, data);
    }).catch((err) => {
      sendMsg(res, err, 'error');
    });
});

router.get('/likeDislikePost', async (req, res) => {

});

router.get('/commentOnPostOrEdit', async (req, res) => {

});

router.get('/deleteComment', async (req, res) => {

});

router.get('/sharePost', async (req, res) => {

});


module.exports = router;