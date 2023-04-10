
var mysql = require('mysql');

var dbconnection = mysql.createPool({
  host     : process.env.RDS_HOSTNAME,
  user     : process.env.RDS_USERNAME,
  password : process.env.RDS_PASSWORD,
  port     : process.env.RDS_PORT
});


dbconnection.connect(function(err) {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }

  console.log('Connected to database.');
});



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