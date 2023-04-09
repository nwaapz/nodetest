const express=require("express")
const app=express();

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 80 },()=>{
    console.log('server 4 started on 80')
})

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});