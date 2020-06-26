
// var app = require('express')();
// var express = require('express');
// var server = require('http').createServer(app);
// // const WebSocket = require('ws');
// const SK_PORT = 40510;
// const socketServer = {}
// if (!socketServer) {
//     socketServer = new WebSocket.Server({
//         port: SK_PORT
//     })

//     socketServer.on('connection', function (clientWs) {
//         clientWs.on('client-send-userID', (data) => {
//             console.log('SERVER NHAN DUOJC DATA : ', data)
//         })
//     })
//     console.log(`websocket server runing at port ${SK_PORT}`)
// }
// const broadcastAll = (msg) => {
//     for (const c of socketServer.clients) {

//         console.log(c.readyState);
//         if (c.readyState === WebSocket.OPEN) {
//             c.msg(msg)
//         }

//     }
// }
// module.exports = {
//     socketServer,
//     broadcastAll,

// }
