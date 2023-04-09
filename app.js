const express=require("express")
const app=express();

const port=process.env.PORT || 3000;

import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: port });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});