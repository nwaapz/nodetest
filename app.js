console.log("helooo1234");
var mysql = require('mysql');

var dbconnection = mysql.createPool({
  connectionLimit:99,
  host     : "db1.cwomfylpyxwn.eu-north-1.rds.amazonaws.com",
  user     : process.env.RDS_USERNAME,
  password : process.env.RDS_PASSWORD,
  port     : process.env.RDS_PORT,
  database: 'iwcobg'

});


dbconnection.getConnection((err,connection)=> {
  if(err)
     throw err;
  console.log('Database connected successfully');
  connection.release();
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