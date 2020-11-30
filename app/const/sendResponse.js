const sendMsg = (res, msg, status) => {
    const response = { msg, status }
    return res.send(response);
}

const sendData = (res, data, status) => {
    const response = { data, status }
    return res.send(response);
}

const sendMsgAndData = (res, msg, data, status) => {
    const response = { msg, data, status }
    return res.send(response);
}

const sendMsgAndDataWithToken = (res, msg, data, token, status, setting = {}) => {
    const response = { msg, data, token, status, setting }
    return res.send(response);
}
const sendStream = (res, data, stream) => {
    const response = { data, stream }
    return res.send(response);
}
module.exports = { sendMsg, sendData, sendMsgAndData, sendMsgAndDataWithToken, sendStream }