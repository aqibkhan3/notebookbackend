const nodemailer = require('nodemailer');

const { sendMsg } = require('../const/sendResponse');

async function joinInvitation(res, sender, reciever, meetingInfo, template) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mailnotebooks@gmail.com',
      pass: 'creating@123'
    }
  });

  const mailOptions = {
    from: 'mailnotebooks@gmail.com',
    to: reciever.emailId,
    subject: meetingInfo.description,
    html: template
  };

  const emailResponse = await transporter.sendMail(mailOptions).catch((err) => { return { msg: 'email failed' } })
  return emailResponse;
}

module.exports = {
  joinInvitation
}