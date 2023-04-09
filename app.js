
const port=process.env.PORT || 3030;

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: port },()=>{
    console.log('server 4 started on '+port)
})

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});