
const port=process.env.PORT || 3030;

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: port },()=>{
   console.log('server 4 started on '+port)
})



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

const https=require('https');
const axios = require('axios');
const FormData=require('form-data');
let boards=new Array();

let lobby=[];


const { v4: uuidv4, stringify } = require('uuid');
const {json} = require("express");





wss.on('connection', function connection(ws) {


   ws.alive=true;
   ws.on('error', console.error);
   ws.on('pong', heartbeat);

   ws.on('message', (data) => {

      let tagMessage={
         tag:""
      }

     /* const base64data = Buffer.from(data, 'binary').toString('base64');
      console.log(base64data);
      let incoming;
      if(!base64data.includes("binary"))
      {
       incoming=
      }else {

      }*/
      const message=JSON.parse(data.toString()) ;
     // console.log(message.tag)
      if(message.tag==="checkForLastGame")
      {
        let Board= checkForOngoingGame(message.id);
        console.log(message.username+" is checking for unfinished games");
        if(Board===null)
        {
         console.log("noLastGame")
         tagMessage.tag="noLastGame";
         ws.send(JSON.stringify(tagMessage))
        }else{
         console.log("LastGame alive")
         tagMessage.tag="LastGame";
         tagMessage.brd=Board.array;
         
         reconnect(message.id,ws,message.username)
        }
        
      }else if(message.tag==="callopp")
      {
         if(ws.opp)
         {
            let message=new Object();
            message.tag="askingIfOnline";
            ws.opp.send(JSON.stringify(message));
         }
      }
      else if(message.tag==="EnterGame")
      {
         if(ws.opp)
         {
            DeclareEnteringGame(ws.opp);
         }

      }
      else if(message.tag==="reqGame")
      {         
         ws.opp=null;
         ws.level=message.level;
         ws.room=message.room;
         ws.username=message.userName;     
         ws.roomId=message.roomId; 
         ws.token=message.UserToken;
         console.log(message);
         console.log(ws.token);   
         GetUserIdBasedOnUserName(dbconnection,ws.username).then(function(rows){
            let userid=JSON.parse(JSON.stringify(rows));
            console.log(userid[0].id);
         })
       
         console.log(message.userName+" asks for game")
         if(!lobby.includes(ws))
         {
            lobby.push(ws);            
         }

         console.log("number of users in lobby"+lobby.length)

         //order client to enter lobby UI
         tagMessage.tag=("enterLobby")


         ws.send(JSON.stringify(tagMessage));
        

         if(lobby.length>1)
         {
            MatchMaker(ws);
         }
      }
      else if(message.tag==="ignoreNewGame")
      {        
         console.log("user rejecting game suggestion")
         if(ws.opp!=null)
         {
            tagMessage.tag="oppreject";
            ws.opp.send(JSON.stringify(tagMessage));
            ws.opp.opp=null;
         }
         let index=lobby.indexOf(ws);
         lobby.splice(index,1);
         tagMessage.tag="backtohall";
         ws.send(JSON.stringify(tagMessage))

      }
      else if(message.tag==="dice")
      {
        dice(ws);
        
      }
      else if(message.tag==="moveToSel")
      {
       //  let Board=boards.find(x=>x.Boardid===ws.matchid);
         
         tagMessage.OriginI=message.OriginI;
         tagMessage.OriginJ=message.OriginJ;
         tagMessage.targetI=message.targetI;
         tagMessage.targetJ=message.targetJ;   
         //console.log(Board.state)
         
         tagMessage.step=message.step;
         tagMessage.tag="moveToSel";
         if(ws.opp)
         {
            ws.opp.send(JSON.stringify(tagMessage));
         }

         
        
      }
      else if(message.tag==="move")
      {         
        // let Board=boards.find(x=>x.Boardid===ws.matchid);     
         tagMessage.OriginI=message.OriginI;  
         console.log(tagMessage.OriginI);       
         tagMessage.tag="move";
         if(ws.opp)
         {
            ws.opp.send(JSON.stringify(tagMessage));
         }else{


         }

      }
      else if(message.tag==="undo")
      {
         tagMessage.tag="undo";
         if(ws.opp)
         {
            ws.opp.send(JSON.stringify(tagMessage));
         }

      }
      else if(message.tag==="bringBackToGame")
      {
         tagMessage.tag="bringBackToGame";
         if(ws.opp)
         {
            ws.opp.send(JSON.stringify(tagMessage));
         }

      }
      else if(message.tag==="turnFinish")
      {
         let Board=boards.find(x=>x.Boardid===ws.matchid);
         if(!Board)
         {
            return;
         }

         if(!Board.timer)
         {
            return;
         }

         if(Board.timer)
         {
            console.log("cancelling last turn timer")
            clearTimeout(Board.timer)
         }
         changeTurn(Board,ws);

         let SelfeFinishConfirm=new Object();
         SelfeFinishConfirm.tag="finishConfirm";
         ws.send(JSON.stringify(SelfeFinishConfirm));
         tagMessage.tag="turnFinish";
         Board.phase="dice";
         Board.lasttimer=Date.now();
         if(ws.opp)
         {
            ws.opp.send(JSON.stringify(tagMessage));
         }

         
         


         Board.array=message.brd;
         Board.userarray=ws.username;
         if(Board.userAdetails.username===ws.username)
         {
            Board.userBdetails.hitted=message.hitted;
            Board.userAdetails.stage=message.stage;
            console.log("hitted count="+Board.userBdetails.hitted);
         }else{
            Board.userAdetails.hitted=message.hitted;
            Board.userBdetails.stage=message.stage;
            console.log("hitted count else="+Board.userAdetails.hitted);
         }


         
      }
      else if(message.tag==="bringBackToGameSel")
      {
         tagMessage.tag="bringBackToGameSel";
         tagMessage.targetI=message.targetI;
         if(ws.opp)
         {
            ws.opp.send(JSON.stringify(tagMessage));
         }

      }
      else if(message.tag==="winstage")
      {
         console.log("recieved win stage move")
         tagMessage.targetI=23-message.targetI;
         tagMessage.targetJ=message.targetJ;
         
         tagMessage.tag="winstagedrag";
         if(ws.opp)
         {
            ws.opp.send(JSON.stringify(tagMessage));
         }

      }
      else if(message.tag==="checkwin")
      {
         let GameBoard=boards.find(x=>x.Boardid===ws.matchid);
         console.log(message.step+"couter to win stage from:"+ws.username);
         if(message.step>14)
         {
            let tagMessage={
               tag:"gameFinished",
               won:true
            }
            tagMessage.point=ws.room;

            ws.send(JSON.stringify(tagMessage))
            tagMessage.won=false;
            if(ws.opp)
            {
               ws.opp.send(JSON.stringify(tagMessage))
            }

            console.log(GameBoard.state.username+" won turn in turn"+GameBoard.turn)
            finishBoard(GameBoard,ws.username,ws);
         }
      }
      else if(message.tag==="reqFriendship")
      {
         let Board=boards.find(x=>x.Boardid===ws.matchid);
         let oppUserName;
         if(Board.userA===ws.username)
         {
            oppUserName=Board.userB;
         }else{
            oppUserName=Board.userA;
         }
         console.log(ws.username+" req friendship to"+oppUserName)
         GetUserIdBasedOnUserName(dbconnection,ws.username).then(function(rows){
            let userid=JSON.parse(JSON.stringify(rows));
            userid=userid[0].id;
            GetUserIdBasedOnUserName(dbconnection,oppUserName).then(function(rows){
               let OppId=JSON.parse(JSON.stringify(rows));
               console.log(rows);
               OppId=OppId[0].id;
              CheckIfFriendRequestSent(userid,OppId,dbconnection).then(function(c){
               
               if(c===0)
               {
                  //new friend request
                  let insertSql="INSERT INTO friendslist (requesterId,requestedId,accepted) VALUES ('"+userid+"','"+OppId+"',0)"
                  console.log(insertSql);
                  dbconnection.query(insertSql,(err,rows)=>{
                     if (err) throw err;
                     tagMessage.tag="friendreqsentsuccess";
                     ws.send(JSON.stringify(tagMessage));
                     tagMessage.tag="newFriendReq";
                     if(ws.opp)
                     {
                        ws.opp.send(JSON.stringify(tagMessage))
                     }
                  
                  });
                  
               }
              })
            })
         })


         
         
      }
      else if(message.tag==="AccpetFriendRequest")
      {
         console.log("accepting friend request");
         let Board=boards.find(x=>x.Boardid===ws.matchid);
         let oppUserName;
         if(Board.userA===ws.username)
         {
            oppUserName=Board.userB;
         }else{
            oppUserName=Board.userA;
         }
         console.log(ws.username+" wants to accept "+oppUserName)
         GetUserIdBasedOnUserName(dbconnection,ws.username).then(function(rows){
            let userid=JSON.parse(JSON.stringify(rows));
            userid=userid[0].id;
            GetUserIdBasedOnUserName(dbconnection,oppUserName).then(function(rows){
               let OppId=JSON.parse(JSON.stringify(rows));
               console.log(rows);
               OppId=OppId[0].id;
               let updateSql="UPDATE friendslist SET accepted = '1' WHERE requesterId ='"+OppId+"' AND requestedId='"+userid+"';"

               console.log(updateSql);

               dbconnection.query(updateSql,(err,rows)=>{
                  if (err) throw err;
                  tagMessage.tag="acceptsuccess";
                  ws.send(JSON.stringify(tagMessage));
                  
               
               });
            })
         })
      }
      else if(message.tag==="askForFriendsList")
      {
         ws.username=message.username;
         console.log(ws.username +"is asking for friends list");
         if(ws.username===null || ws.username===undefined )
         {
            return
         }
         GetUserIdBasedOnUserName(dbconnection,ws.username).then(function(rows){

            if(rows.length<1)
            {
               return
            }



            let userid=JSON.parse(JSON.stringify(rows));
            if(userid[0].id===undefined  ||  userid[0].id===null)
            return;

            userid=userid[0].id;
            let flistSql="SELECT * FROM friendslist WHERE (requesterId ='"+userid+"' AND accepted=1)  OR (requestedId ='"+userid+"' AND accepted=1)  ";
            console.log(flistSql);

            dbconnection.query(flistSql,(err,rows)=>{
               if (err) throw err;
                rows=JSON.parse(JSON.stringify(rows));
                tagMessage.tag="friendslist";
               
               
                 rows.forEach(function(row){

                    let friendId="";
                    if(row.requestedId===userid)
                    {
                       friendId=row.requesterId;
                    }else{
                       friendId=row.requestedId;
                    }


                 dbconnection.query("SELECT username FROM users WHERE id='"+friendId+"'",(err,fs)=>{
                  console.log(fs);
                  let friends=new Array();
                  fs=JSON.parse(JSON.stringify(fs));
                  console.log(fs[0].username)
                  friends.push(friendId)
                  friends.push(fs[0].username)
                  tagMessage.friends=friends;
                  ws.send(JSON.stringify(tagMessage));
                 });
                 
               })
              
               
            
            });



         });
      }
      else if(message.tag==="invite")
      {
         let friendname
      }
      else if(message.tag==="signup")
      {

         console.log("Searching for greatest id");
         let GreatesIdQuery="SELECT * from users ";
         dbconnection.query(GreatesIdQuery,(err,row)=>{
            if (err) throw err;

            let newUserName="Guest"+row.length;
            let userid=row.length;
            let level=0;
            let coin=0;
            let email=0;
            let password=0;
            let newUserQuery="Insert into users (username,id,level,coin,password,email) VALUES ('"+newUserName+"','"+userid+"',+'"+level+"',0,0,0)";
            dbconnection.query(newUserQuery,(err,row)=>{
               if(err) throw err;
               //user created
               tagMessage.tag="usercreated";
               tagMessage.username=newUserName;
               tagMessage.coin=0;
               tagMessage.email=0;
               tagMessage.level=0;

               console.log(tagMessage);
               ws.send(JSON.stringify(tagMessage));
            })
         })






         /*console.log("sign up");
         let password=message.password;
         let email=message.email;
         let coin=0;
         let level=1;
         let username="";
         let checkQuery="SELECT * from users where email='"+email+"'";
         console.log(checkQuery);
         dbconnection.query(checkQuery,(err,rows)=>{
            if (err) throw err;
            if(rows.length>0)
            {
               //this email has signed up before
               console.log("this user signed up before")
               tagMessage.tag="usedemail";
               ws.send(JSON.stringify(tagMessage));
            }else{
               console.log("new user");
               let query="INSERT INTO users(coin,level,username,password,email) VALUES ('"+coin+"','"+level+"','','"+password+"','"+email+"') ";
               dbconnection.query(query,(err,row)=>{
                  if (err) throw err;
                     dbconnection.query("SELECT id from users Where email='"+email+"'",(err,row)=>{
                        row=JSON.parse(JSON.stringify(row));
                        let id=row[0].id;
                        console.log(id)
                        let username="guest"+id;
                        let updatequery= "UPDATE users SET username='"+username+"' WHERE email='"+email+"'";
                        dbconnection.query(updatequery,(err,field)=>{
                           if(err) throw err;
                           tagMessage.tag="usercreated";
                           tagMessage.username=username;
                           tagMessage.coin=coin;
                           tagMessage.email=email;
                           tagMessage.level=level;
                           console.log(tagMessage);
                           ws.send(JSON.stringify(tagMessage));

                        })
                     })
               })
            }
         });
*/
         
         
      }
      else if(message.tag==="askstat")
      {
         let username=message.username;
         console.log(username+" asking for stat");
         ws.username=username;
         let sql="SELECT * from users WHERE username ='"+username+"'";
         dbconnection.query(sql,(err,rows)=>{
            if(err) throw err;
            rows=JSON.parse(JSON.stringify(rows));
            let coin=rows[0].coin;
            let level=rows[0].level;
            tagMessage.tag="setstat";
            tagMessage.coin=coin;
            tagMessage.level=level;
            ws.send(JSON.stringify(tagMessage));


         })



      }
      else if(message.tag==="st-smile" || message.tag==="st-cry" || message.tag==="st-winkle" ||message.tag==="st-surprise" || message.tag==="st-laugh")
      {
         console.log("sending Smileee")
         tagMessage.tag=message.tag;
         tagMessage.username=message.username;
         console.log(tagMessage);
         if(ws.opp)
         {
            ws.opp.send(JSON.stringify(tagMessage))
            ws.send(JSON.stringify(tagMessage))
         }
      }
      else if(message.tag==="reqFrndgame")
      {
         console.log(message);
         ws.opp=null;
         ws.level=message.level;
         ws.room=message.room;

         ws.roomId=message.roomId;
         ws.token=message.UserToken;


         ws.username=message.username;
         console.log(message);
         let friendId=message.friendid;
         let room=message.room;
         console.log(ws.username+" is asking for userName"+room);
         let query="Select * from users where id='"+friendId+"'";
         console.log(query);

         dbconnection.query(query,(err,rows)=>{
            if((err)) throw err;
            console.log(rows);
            rows=JSON.parse(JSON.stringify(rows));
            let friendname=rows[0].username;
            console.log(ws.username+" is asking for "+friendname+" to play game");
            let friendOnline=false;
            wss.clients.forEach(function(client) {
               
               if(client.username===friendname)
               {
                  friendOnline=true;
                  ws.oppcandid=client;
                  boards.forEach(function(board)
                  {
                     if(board.userA===friendname || board.userB===friendname)
                     {
                        console.log(friendname+" is playing a game");
                     }else{
                        console.log(friendname+" is idle");
                     }
                  });
               }
         });        
         if(friendOnline)
         {
            tagMessage.tag="friendonline";
            ws.send(JSON.stringify(tagMessage));
            tagMessage.friend=ws.username;
            tagMessage.room=room;
            console.log(room);
            tagMessage.tag="friendlysug";
            tagMessage.roomid=ws.roomid;
            tagMessage.opplevel=ws.level;
            ws.oppcandid.send(JSON.stringify(tagMessage));
         }else{
                tagMessage.tag="friendoffline";
                ws.send(JSON.stringify(tagMessage));
         }       
         })
         
      }
      else if(message.tag==="acceptFriendGame")
      {
         console.log(message);
         let friendname=message.friendName;
         ws.username=message.username;
         ws.level=message.level;
         ws.room=message.room;
         ws.token=message.UserToken;
         ws.roomId=message.roomId;

         console.log("accepting"+friendname+" request for game")
         FriendlyMatchmaker(ws,friendname);
      }
      else if(message.tag==="cancelfr")
      {
         console.log("canceling the invitation");
         ws.oppcandid=undefined;
      }
      else if(message.tag==="rejectinv")
      {
         let hostname=message.friendname;
         console.log(hostname+" should recieve cancelation request")
         wss.clients.forEach(function(client) {
            if(client.username===hostname)
            {
               tagMessage.tag="fr-reject";
               client.send(JSON.stringify(tagMessage));
            }


         });

      }
      else if(message.tag==="searchFriend")
      {
         let tosearch=message.friendName;
         let username=message.username;
         let query="select * from users where username='"+tosearch+"' ";
         
         console.log(query);
         dbconnection.query(query,(err,rows)=>{
            if(err) throw err;
            if(rows.length>0)
            {
               GetUserIdBasedOnUserName(dbconnection,username).then(function(rows3){
                  let userid=JSON.parse(JSON.stringify(rows3));
                  userid=userid[0].id;
                  GetUserIdBasedOnUserName(dbconnection,tosearch).then(function(rows2){
                     let OppId=JSON.parse(JSON.stringify(rows2));
                     console.log(rows2);
                     OppId=OppId[0].id;
                    CheckIfFriendRequestSent(userid,OppId,dbconnection).then(function(c){
                     
                     if(c===0)
                     {
                        rows=JSON.parse(JSON.stringify(rows))               
                        let username=rows[0].username;
                        let id=rows[0].id;
                        tagMessage.tag="friendfound";
                        tagMessage.friendName=username;
                        tagMessage.friendid=id;
                        console.log(tagMessage);
                        ws.send(JSON.stringify(tagMessage));  
                        
                     }else{
                        rows=JSON.parse(JSON.stringify(rows))               
                        let username=rows[0].username;
                        let id=rows[0].id;
                        tagMessage.tag="friendAlreadyReqSent";
                        tagMessage.friendName=username;
                        tagMessage.friendid=id;
                        console.log(tagMessage);
                        ws.send(JSON.stringify(tagMessage)); 
                     }
                    })
                  })
               })
                  
                                                
            }else{
               tagMessage.tag="friendnotfound";
               ws.send(JSON.stringify(tagMessage));     
            }

         })

      }
      else if(message.tag==="frshpReqBySrch")
      {
         let friendTOSearch=message.friendName;
         let user=message.username;
         ws.username=user;
         let friendid=message.friendid;
         console.log(friendTOSearch+" is being searched by "+ws.username)
         GetUserIdBasedOnUserName(dbconnection,ws.username).then(function(rows){
            let userid=JSON.parse(JSON.stringify(rows));
            userid=userid[0].id;
            GetUserIdBasedOnUserName(dbconnection,friendTOSearch).then(function(rows){
               let OppId=JSON.parse(JSON.stringify(rows));
               console.log(rows);
               OppId=OppId[0].id;
              CheckIfFriendRequestSent(userid,OppId,dbconnection).then(function(c){
               
               if(c===0)
               {
                  //new friend request
                  let insertSql="INSERT INTO friendslist (requesterId,requestedId,accepted) VALUES ('"+userid+"','"+OppId+"',0)"
                  console.log(insertSql);
                  dbconnection.query(insertSql,(err,rows)=>{
                     if (err) throw err;
                     tagMessage.tag="friendreqsentsuccess";
                     ws.send(JSON.stringify(tagMessage));
                     tagMessage.tag="newFriendReq";
                     if(ws.opp!==null && ws.opp!==undefined)
                     {
                        ws.opp.send(JSON.stringify(tagMessage))
                     }else{
                        wss.clients.forEach(function(client){
                           if(client.username===friendTOSearch)
                           {
                              client.send(JSON.stringify(tagMessage));
                           }
                        })
                     }
                  
                  });
                  
               }
              })
            })
         })
      }
      else if(message.tag==="askForReqList")
      {
         ws.username=message.username;
         console.log(ws.username +"is asking for friends requests");
         if(ws.username===null || ws.username===undefined )
         {
            return
         }
         GetUserIdBasedOnUserName(dbconnection,ws.username).then(function(rows){

            if(rows.length<1)
            {
               return
            }



            let userid=JSON.parse(JSON.stringify(rows));
            if(userid[0].id===undefined  ||  userid[0].id===null)
            return;

            userid=userid[0].id;
            let flistSql="SELECT requesterId FROM friendslist WHERE requestedId ='"+userid+"' AND accepted=0";
            console.log(flistSql);

            dbconnection.query(flistSql,(err,rows)=>{
               if (err) throw err;
                rows=JSON.parse(JSON.stringify(rows));
               
               console.log(rows);
               
               rows.forEach(function(row){
                 dbconnection.query("SELECT username FROM users WHERE id='"+row.requesterId+"'",(err,fs)=>{
                  
                  if(fs.length<1)
                  {
                     return;
                  }
                  console.log(fs);
                  let friends=new Array();
                  fs=JSON.parse(JSON.stringify(fs));
                  console.log(fs[0].username)
                  friends.push(row.requesterId)
                  friends.push(fs[0].username)
                  tagMessage.friends=friends;
                  console.log(tagMessage);
                  tagMessage.tag="friendsReqs";
                  ws.send(JSON.stringify(tagMessage));
                 });
                 
               })
              
               
            
            });



         });
      }
      else if(message.tag==="fr-Req-accept")
      {
         let requesterid=message.friendid;
         let userName=message.username;
         ws.username=userName;
         GetUserIdBasedOnUserName(dbconnection,ws.username).then(function(rows){
         
            rows=JSON.parse(JSON.stringify(rows));
            console.log("userid is "+rows[0].id+"   friend id is "+requesterid);

            let acceptSql="Update friendslist  SET accepted=1 where requesterId='"+requesterid+"' AND  requestedId='"+rows[0].id+"'  ";
            dbconnection.query(acceptSql,(err,row)=>{
               if(err) 
               throw err;
               let q1="select id from friendslist where requesterId='"+rows[0].id+"'  and requestedId='"+requesterid+"' " ;
               dbconnection.query(q1,(err,rw)=>{
                  if(rw.length>0)
                  {
                     let acceptSqlmirror="Update friendslist  SET accepted=1 where requesterId='"+rows[0].id+"' AND  requestedId='"+requesterid+"'  ";
                     dbconnection.query(acceptSqlmirror,(err,rw2)=>{
                        if(err)
                        throw err;

                        let flistSql="SELECT requestedId FROM friendslist WHERE requesterId ='"+rows[0].id+"' AND accepted=1";
            console.log(flistSql);

            dbconnection.query(flistSql,(err,rows)=>{
               if (err) throw err;
                rows=JSON.parse(JSON.stringify(rows));
               tagMessage.tag="friendslist";
               
               
               rows.forEach(function(row){
                 dbconnection.query("SELECT username FROM users WHERE id='"+row.requestedId+"'",(err,fs)=>{
                  console.log(fs);
                  let friends=new Array();
                  fs=JSON.parse(JSON.stringify(fs));
                  console.log(fs[0].username)
                  friends.push(row.requestedId)
                  friends.push(fs[0].username)
                  tagMessage.friends=friends;
                  ws.send(JSON.stringify(tagMessage));
                 });
                 
               })
              
               
            
            });

                     })
                  }else{
                     let acceptMirrorInsert="INSERT INTO friendslist (requesterId,requestedId,accepted) VALUES ('"+rows[0].id+"','"+requesterid+"',1) "
                     console.log(acceptMirrorInsert);
                     dbconnection.query(acceptMirrorInsert,(err,rw3)=>{
                        if(err)
                        throw err;

                        let flistSql="SELECT requestedId FROM friendslist WHERE requesterId ='"+rows[0].id+"' AND accepted=1";
                        console.log(flistSql);
            
                        dbconnection.query(flistSql,(err,rows)=>{
                           if (err) throw err;
                            rows=JSON.parse(JSON.stringify(rows));
                           tagMessage.tag="friendslist";
                           
                           
                           rows.forEach(function(row){
                             dbconnection.query("SELECT username FROM users WHERE id='"+row.requestedId+"'",(err,fs)=>{
                              console.log(fs);
                              let friends=new Array();
                              fs=JSON.parse(JSON.stringify(fs));
                              console.log(fs[0].username)
                              friends.push(row.requestedId)
                              friends.push(fs[0].username)
                              tagMessage.friends=friends;
                              ws.send(JSON.stringify(tagMessage));
                             });
                             
                           })
                          
                           
                        
                        });
                        


                     })
                  }
                  

               })
               
            })           

         });



      }
      else if(message.tag==="fr-Req-reject")
      {
         let requesterid=message.friendid;
         let userName=message.username;
         ws.username=userName;
         GetUserIdBasedOnUserName(dbconnection,ws.username).then(function(rows){
         
            rows=JSON.parse(JSON.stringify(rows));
            console.log("userid is "+rows[0].id+"   friend id is "+requesterid);

            let acceptSql="Update friendslist  SET accepted=3 where requesterId='"+requesterid+"' AND  requestedId='"+rows[0].id+"'  ";
            dbconnection.query(acceptSql,(err,row)=>{
               if(err) 
               throw err;

            })
            


         });
      }
      else if(message.tag==="resign")
      {
         
         let Board=boards.find(x=>x.Boardid===ws.matchid);
         console.log(ws.matchid+"  resign");
         Resign(Board,ws.username,ws);
      }
      else if(message.tag==="syncprofile")
      {
         console.log("syncing");
         let username=message.username;
         let id=message.uuid;
         let coin=message.point;
         let query="select * from users where id ='"+id+"'";
         console.log(query);
         dbconnection.query(query,(err,row)=>{
            if(err) throw err;
            console
            if(row.length>0)
            {
               let updateQ="UPDATE users SET username='"+username+"', coin='"+coin+"' WHERE id='"+id+"'";
               dbconnection.query(updateQ,(err2,row2)=>{
                  if(err2) throw err2;
               sendMessage("updated",ws);
               console.log(updateQ);
               })
            }else{
               let insertQ="INSERT INTO users (username,id,coin,level,password,email) VALUES ('"+username+"','"+id+"','"+coin+"',0,'0','0')";
               dbconnection.query(insertQ,(err2,row3)=>{
                  if(err2) throw err2;
                  sendMessage("updated",ws);
               console.log(insertQ);
               })
            }
         })
      }else if(message.tag==="checkUser")
      {
         let c=0;
         wss.clients.forEach(function(client) {
            if(client.username===message.username)
            {
               c++;
            }


         });
         tagMessage.tag="userCount";
         tagMessage.count=c;
         console.log("number of users named"+message.username+" is "+c);+
         ws.send(JSON.stringify(tagMessage));
      }
      
   })
   
   ws.on('close',()=>{
      console.log("socket close")
      if(ws.opp)
      {
         let message=new Object();
         message.tag="SyncReq";
         ws.opp.send(JSON.stringify(message));
      }
      ws.alive=false;
      if(lobby.includes(ws))
      {
         let indexOfClosingSocket=lobby.indexOf(ws);
         lobby.splice(indexOfClosingSocket,1);
         console.log(indexOfClosingSocket,1);
      }
      
   })

   ws.on('open',()=>{
      console.log("socket open")
   })
})

function OppIsOffline(socket)
{
   let message=new Object();
   message.tag="oppOfline";
   socket.send(JSON.stringify(message));
}

function DeclareEnteringGame(socket)
{
   let message=new Object();
   message.tag="EnteringRoom";
   socket.send(JSON.stringify(message));
}
function reconnect(gameid,socket,username)
{
   socket.username=username;
   socket.matchid=gameid;


   let board=checkForOngoingGame(gameid);
   if(!board)
   {
      return;
   }
   console.log(username+" searching for left game and turn is for "+board.userturn)
   messageTager={};
   let tag="";
   
   if(board.userturn===username)
   {
      tag="extratimeselfe";
   }else{
     
      tag="extratime";
   }

   let elapsedTime=Date.now()-board.delayrecorder;
   let extraTime=0;
   console.log(elapsedTime);
   

   let oppusername="";
   let oppSocket=null;
   let playerRemaining=0;
   if(board.userA===username)
   {
      playerRemaining=board.userATimer;
      oppusername=board.userB;
   }else{
      oppusername=board.userA;   
      playerRemaining=board.userBTimer;   
   }
   if(elapsedTime>90000)
   {
      extraTime=elapsedTime-90000;
      messageTager.tag=tag;
      messageTager.extra=playerRemaining-extraTime;
      socket.send(JSON.stringify(messageTager));
   }
   console.log("Opp userName found:"+oppusername)

   wss.clients.forEach(function(client) {
      
         if(client.username===oppusername)
         {
            console.log("opp socket found")
            client.opp=socket;
            socket.opp=client;
         }
        
   });
  let message=new Object();

  let opp=false;

  if(socket.opp)
  {

  }else{
     opp=true;
   //  OppIsOffline(socket);
  }

  message.Opp=opp;
  message.tag=board.tag;
  message.userturn=board.userturn;

   if(board.userturn===username)
   {
      console.log("players turn"+socket.username)
      board.state=socket;
   }else{

      board.state=socket.opp;
   }
  //console.log(board.state.opp.username);

  message.userA=username;
  message.userB=oppusername;
  message.board=board.array;



  message.room=board.room;
  console.log("room price is"+board.room);
  message.diceA=board.diceA;
  message.diceB=board.diceB;
  console.log(board.userAdetails);
  console.log(board.userBdetails);
  message.userAdetails=board.userAdetails;
  message.userBdetails=board.userBdetails;
  message.userarray=board.userarray;
  message.lasttimer=board.lasttimer;
  message.phase=board.phase;
  console.log(message.tag)
  socket.send(JSON.stringify(message));
}


const interval = setInterval(function ping() {
 //  console.log("number of games is"+boards.length);
   wss.clients.forEach(function each(ws) {

      //console.log("check");
      if (ws.alive === false)
      {
         console.log("a user was lost in pong");
         if(ws.opp)
         {
            let message=new Object();
            message.tag="SyncReq";
            ws.opp.send(JSON.stringify(message));
         }
         return ws.terminate();
      }

      ws.alive = false;
      ws.ping();
   });
}, 3000);


 function FriendlyMatchmaker(ws,oppname)
 {
   let tagMessage={
      tag:""
   }  
   let closeOpponent;
   wss.clients.forEach(function(client){
      if(client.username===oppname && client.readyState==WebSocket.OPEN )
      {
         closeOpponent=client;
      }
   })


   if(closeOpponent!=null)
    {      
      console.log("match init")
      if(closeOpponent.oppcandid!==null && closeOpponent.oppcandid!==undefined)
      {
         if(closeOpponent.oppcandid===ws)
         {
            console.log("correct host")
         }else{
            console.log("incorect host 1")
            tagMessage.tag="invfail";
            ws.send(JSON.stringify(tagMessage))
            return
         }
      }else{
         console.log("incorect host 2")
           tagMessage.tag="invfail";
           ws.send(JSON.stringify(tagMessage))
            return
      }
      let newgame = {host:true,oppname:"",  opplevel:0,price:0, tag:"newgame"};
      newgame.oppname=ws.username;
      newgame.opplevel=ws.level;
      newgame.price=ws.room;
      //console.log(closeOpponent.username)
      closeOpponent.send(JSON.stringify(newgame));
      //console.log(newgame.toString())
      newgame.oppname=oppname;
      newgame.opplevel=1;
      newgame.host=false;

      ws.send(JSON.stringify(newgame));
      console.log("new opponent sent to caller")

      let indexOfClosingSocket=lobby.indexOf(ws);
         lobby.splice(indexOfClosingSocket);
      


       indexOfClosingSocket=lobby.indexOf(closeOpponent);
         lobby.splice(indexOfClosingSocket,1);
      

      //assign opponent in lobby
      ws.opp=closeOpponent;
      closeOpponent.opp=ws;
      console.log("startTimeout");
      setTimeout(()=>{
       console.log("TimeOut");
       if(ws===null)
       {
         console.log("websocket Failed");
         return;
       }
         if(ws.opp===null)
         {
            return;
         }
         if(ws.readyState===WebSocket.OPEN && ws.opp.readyState===WebSocket.OPEN)
         {
            console.log("starting game");
            if(ws.opp.opp===ws)
            {
              // console.log("opponents ready")
               let matchid=uuidv4();
               ws.matchid=matchid;
               ws.opp.matchid=matchid;
               tagMessage.tag="gameStart";
               tagMessage.id=matchid;
               let UserAdetails=new Object();
               let UserBdetails=new Object();
               let GameState=
                  {
                     tag:"ServerBoard",
                     Boardid:matchid,
                     array:MakeNewBoard(),
                     state:null,
                     timer:null,
                     userturn:"",
                     room:"",
                     userAdetails:UserAdetails,
                     userBdetails:UserBdetails,
                     turn:0,
                     diceA:0,
                     diceB:0,
                     userA:"",
                     userB:"",
                     lasttimer:0,
                     userATimer:300000,
                     userBTimer:300000,
                     delayrecorder:0,
                     token:""
                  };

               tagMessage.brd=GameState.array;
               GameState.room=ws.room;
               console.log(GameState.room)
               console.log(ws.level)
               GameState.userAdetails.username=ws.opp.username;
               GameState.userAdetails.hitted=0;
               GameState.userAdetails.stage=0;
               GameState.userBdetails.username=ws.username;
               GameState.userBdetails.hitted=0;
               GameState.userBdetails.stage=0;
               GameState.userA=ws.opp.username;
               GameState.userB=ws.username;

               GameState.token=ws.opp.token;
               //check if friendReq has been sent

              


               console.log("setting board users User A"+ws.opp.username);
               console.log("setting board users User B"+ws.username);

               console.log("array lenght"+GameState.array.length)
               ws.send(JSON.stringify(tagMessage))
               ws.opp.send(JSON.stringify(tagMessage))
               setTimeout(() => {
                 dice(ws);
                 console.log("ckeckin friend req on start")
                 GetUserIdBasedOnUserName(dbconnection,ws.username).then(function(rows){
                  let userid=JSON.parse(JSON.stringify(rows));
                  userid=userid[0].id;
                  GetUserIdBasedOnUserName(dbconnection,ws.opp.username).then(function(rows){
                     let OppId=JSON.parse(JSON.stringify(rows));
                     console.log(rows);
                     OppId=OppId[0].id;
                     //------------------
                     SendGameDataTocrypto(OppId,userid,ws.roomId,matchid,null,null);

                    CheckIfFriendRequestSent(userid,OppId,dbconnection).then(function(c){
                     let tagMessage={
                        tag:""
                     }
                     console.log(c);
                      if(c===0)
                     {
                        tagMessage.tag="friend_req_not_sent";
                        ws.send(JSON.stringify(tagMessage));
                     }
                    })

                    CheckIfFriendRequestSent(OppId,userid,dbconnection).then(function(c){
                     let tagMessage={
                        tag:""
                     }
                     console.log(c);
                      if(c===0)
                     {
                        tagMessage.tag="friend_req_not_sent";
                        ws.opp.send(JSON.stringify(tagMessage));
                     }
                    })


                  })
               }) 
               }, 6000);
               boards.push(GameState);                                              
            }else{
               console.log("opponents left that lobby suggestion")
            }
         }else{
            console.log("one or both sockets of lobby match making not alive")
            ws.opp.opp=null;
            ws.opp=null;
            
         }
      },50)

    }else{
      tagMessage.tag="invfail";
      ws.send(JSON.stringify(tagMessage))
    }

 }

function SendGameDataTocrypto(hostId,guestId,roomId,MatchId,WinnerId,token)
{
   console.log(roomId+"sending game data to crypto server"+hostId+"--------"+guestId+" and matchIdis"+MatchId)
   console.log("winner is"+WinnerId)
   console.log("token is"+token)
   let formData=new FormData();
   formData.append('room_id',roomId);
   formData.append('host_id',hostId);
   formData.append('guest_id',guestId);
   formData.append('match_id',MatchId);
   
   if(WinnerId!==null)
   {
      formData.append('winner_id',WinnerId);
   }
   
   
   var config = {
      method: 'post',
      url: 'https://game.iwco.io/api/matches',
      headers: { 
        'Authorization': 'Bearer '+token, 
        ...formData.getHeaders()
      },
      data : formData
    };
   
   
   
    
    axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });


}



function MatchMaker(ws)
{
   let tagMessage={
      tag:""
   }  
   let closeOpponent;
   let c=0;
   wss.clients.forEach(function(client) {
      c++;
      console.log("websocket"+c+": is "+client.username);
      if(client!=ws && client.room===ws.room && client.readyState===WebSocket.OPEN && client.username !=ws.username)
      {

         if(closeOpponent!=null )
         {
            if(Math.abs(closeOpponent.level-ws.level)>Math.abs(client.level-ws.level))
            {
               closeOpponent=client;
            }
         }else{
            closeOpponent=client;
         }
      }
     
    });

    //console.log(closeOpponent.level)

    if(closeOpponent!=null)
    {
      console.log("match init")
       console.log(ws.username);
      console.log(closeOpponent.username);
      let newgame = {host:true,oppname:"",  opplevel:0,price:0, tag:"newgame"};
      newgame.oppname=ws.username;
      newgame.opplevel=ws.level;
      newgame.price=ws.room;
      //console.log(closeOpponent.username)
      closeOpponent.send(JSON.stringify(newgame));
      //console.log(newgame.toString())
      newgame.oppname=closeOpponent.username;
      newgame.opplevel=closeOpponent.level;
      newgame.host=false;

      ws.send(JSON.stringify(newgame));
      console.log("new opponent sent to caller")

      let indexOfClosingSocket=lobby.indexOf(ws);
         lobby.splice(indexOfClosingSocket,1);
      


         indexOfClosingSocket=lobby.indexOf(closeOpponent);
         lobby.splice(indexOfClosingSocket,1);
      

      //assign opponent in lobby
      ws.opp=closeOpponent;
      closeOpponent.opp=ws;

      


      console.log("startTimeout");
      setTimeout(()=>{
       console.log("TimeOut");
       if(ws===null)
       {
         console.log("websocket Failed");
         return;
       }
         if(ws.opp===null)
         {
            return;
         }
         if(ws.readyState===WebSocket.OPEN && ws.opp.readyState===WebSocket.OPEN)
         {
            console.log("starting game");
            if(ws.opp.opp===ws)
            {
              // console.log("opponents ready")
               let matchid=uuidv4();
               ws.matchid=matchid;
               ws.opp.matchid=matchid;
               tagMessage.tag="gameStart";
               tagMessage.id=matchid;
               let UserAdetails=new Object();
               let UserBdetails=new Object();
               let GameState=
                  {
                     tag:"ServerBoard",
                     Boardid:matchid,
                     array:MakeNewBoard(),
                     state:null,
                     timer:null,
                     userturn:"",
                     room:0,
                     userAdetails:UserAdetails,
                     userBdetails:UserBdetails,
                     turn:0,
                     diceA:0,
                     diceB:0,
                     userA:"",
                     userB:"",
                     lasttimer:0,
                     userATimer:300000,
                     userBTimer:300000,
                     delayrecorder:0,
                     token:""
                  };

               tagMessage.brd=GameState.array;
               GameState.room=ws.room;
               console.log(GameState.room+"is game price")
               console.log(ws.level)
               GameState.userAdetails.username=ws.opp.username;
               GameState.userAdetails.hitted=0;
               GameState.userAdetails.stage=0;
               GameState.userBdetails.username=ws.username;
               GameState.userBdetails.hitted=0;
               GameState.userBdetails.stage=0;
               GameState.userA=ws.opp.username;
               GameState.userB=ws.username;
              
               GameState.token=ws.opp.token;
               console.log("token is"+GameState.token)
               //check if friendReq has been sent

              


               console.log("setting board users User A"+ws.opp.username);
               console.log("setting board users User B"+ws.username);

               console.log("array lenght"+GameState.array.length)
               ws.send(JSON.stringify(tagMessage))
               ws.opp.send(JSON.stringify(tagMessage))
               setTimeout(() => {
                 dice(ws);
                 
                 console.log("ckeckin friend req on start")
                 GetUserIdBasedOnUserName(dbconnection,ws.username).then(function(rows){
                  let userid=JSON.parse(JSON.stringify(rows));
                  userid=userid[0].id;
                  GetUserIdBasedOnUserName(dbconnection,ws.opp.username).then(function(rows){
                     let OppId=JSON.parse(JSON.stringify(rows));
                     console.log(rows);
                     OppId=OppId[0].id;

                     //--------------------
                     
                     SendGameDataTocrypto(OppId,userid,ws.roomId,matchid,null,GameState.token)

                     //---------------------
                    CheckIfFriendRequestSent(userid,OppId,dbconnection).then(function(c){
                     let tagMessage={
                        tag:""
                     }
                     console.log(c);
                      if(c===0)
                     {
                        tagMessage.tag="friend_req_not_sent";
                        ws.send(JSON.stringify(tagMessage));
                     }
                    })

                    CheckIfFriendRequestSent(OppId,userid,dbconnection).then(function(c){
                     let tagMessage={
                        tag:""
                     }
                     console.log(c);
                      if(c===0)
                     {
                        tagMessage.tag="friend_req_not_sent";
                        ws.opp.send(JSON.stringify(tagMessage));
                     }
                    })


                  })
               }) 
               }, 6000);
               boards.push(GameState);                                              
            }else{
               console.log("opponents left that lobby suggestion")
            }
         }else{
            console.log("one or both sockets of lobby match making not alive")
            ws.opp.opp=null;
            ws.opp=null;
            
         }
      },5000)

    }else{      
      console.log("no match for"+ws.username)
    }   

    console.log("lobby lenght after matchMaking is"+lobby.length);

}

function MakeNewBoard()
{
   let board= Array.from(Array(24), () => new Array(15));
   for(let column=0;column<24;column++)
   {
      for(let row=0;row<15;row++)
      {                 
         if(column==0 && (row===0 || row===1 ))
         {
            board[column][row]=1;
         }else if(column===5 && (row===0 || row===1 || row===2 || row===3 || row===4 )){
            board[column][row]=2;

         }else if(column===7 && (row===0 || row===1 || row===2  )){
            board[column][row]=2;

         }else if(column===11 && (row===0 || row===1 || row===2 || row===3 || row===4 )){
            board[column][row]=1;

         }else if(column===12 && (row===0 || row===1 || row===2 || row===3 || row===4 )){

            board[column][row]=2;
         }else if(column===16 && (row===0 || row===1 || row===2  )){

            board[column][row]=1;
         }else if(column===18 && (row===0 || row===1 || row===2 || row===3 || row===4 )){
            board[column][row]=1;

         }else if(column===23 && (row===0 || row===1  )){

            board[column][row]=2;
         }else{
            board[column][row]=0;
         }
         
      }
   }
   let singleArrayBoard=new Array();
   board.forEach((el1)=>{

      el1.forEach((el2)=>{
         singleArrayBoard.push(el2);
      })

   })
   console.log(singleArrayBoard);
   return singleArrayBoard; 

}

function sendMessage(message,socket)
{
   obj={};
   obj.tag=message;
   socket.send(JSON.stringify(obj));
}


function changeTurn(GameBoard,ws)
{
   if(GameBoard.state.opp!=null)
   {
      GameBoard.state=GameBoard.state.opp;
      
   }else{
      GameBoard.state=null;  
      
   }
   let elapsedTime=Date.now()-GameBoard.delayrecorder;
   let extraTime=0;
   console.log(elapsedTime);
   if(elapsedTime>90000)
   {
      extraTime=elapsedTime-90000;
   }
   if(GameBoard.userA===GameBoard.userturn)
      {
        
         GameBoard.userATimer=GameBoard.userATimer-extraTime;

         GameBoard.userturn=GameBoard.userB;
      }else{
         GameBoard.userBTimer=GameBoard.userBTimer-extraTime;
         GameBoard.userturn=GameBoard.userA;
      }
   console.log(GameBoard.userturn+"'s tuen")
   GameBoard.turn++;
   if(GameBoard.timer!==undefined)
   {
      console.log("cancelling last turn timer")
      clearTimeout(GameBoard.timer)
   }
   console.log("setting timer for dice Btn")
   GameBoard.timer = setTimeout(() => {     
      
      let tagMessage={
         tag:"Turn-start",         
      }

      if(ws.opp.alive)
      {
         ws.send(JSON.stringify(tagMessage))

         waitForSocketToPlay(GameBoard);
      }


      }, 6000);
  console.log("waiting for dice timer");
  
}

function heartbeat() {
   this.alive = true;
}
function waitForSocketToPlay(GameBoard)
{
   
   let turn=GameBoard.turn;
   console.log("turn "+turn+" started");
   let remainingTimer=0;
   if(!GameBoard.state.username)
   {
      return;
   }
   if(GameBoard.state.username===GameBoard.userA)
   {
      remainingTimer=GameBoard.userATimer;
   }else{
      remainingTimer=GameBoard.userBTimer;
   }
   GameBoard.delayrecorder=Date.now();

   GameBoard.timer = setTimeout(() => {console.log("after  seconds in turn:"+turn)

   //check whose turn is it and calculate its remaining bank time
      console.log("printing ws socket");

   console.log(GameBoard.state.username);
   if( GameBoard.state && GameBoard.state.alive===true )
   {
      console.log("p2");
      if(turn===GameBoard.turn)
      {
         let tagMessage={
            tag:"gameFinished",
            won:false
         }
         tagMessage.point=GameBoard.room;
         GameBoard.state.send(JSON.stringify(tagMessage))
         tagMessage.won=true;
         if( GameBoard.state.opp)
         {
            GameBoard.state.opp.send(JSON.stringify(tagMessage));
         }

         console.log(GameBoard.state.username+" Lost because of not playing his/her turn in turn"+GameBoard.turn)
         let winnerusername="";
         if(GameBoard.userA===GameBoard.userturn)
         {
            winnerusername=GameBoard.userB;
         }

         if(GameBoard.userB===GameBoard.userturn)
         {
            winnerusername=GameBoard.userA;
         }

         let winnersocket=null;

         wss.clients.forEach(function(client) {

            if(client.username===winnerusername)
            {
               winnersocket=client;
            }
         });

         finishBoard(GameBoard,winnerusername,winnersocket);
      }
   }else{
      messageTager={};
      messageTager.tag="extratime";
      messageTager.extra=remainingTimer;
      let waiterUserName;

      if(GameBoard.userturn===GameBoard.userA)
      {
         waiterUserName=GameBoard.userB;
      }else{
         waiterUserName=GameBoard.userA;
      }

      wss.clients.forEach(function (client){

         if(client.username===waiterUserName)
         {
            client.send(JSON.stringify(messageTager));
            console.log("opp is offline and sending extra time"+remainingTimer)
         }

      });


      GameBoard.timer = setTimeout(() => {console.log("Extra time Finished:"+turn)
      if(turn===GameBoard.turn)
      {
         let tagMessage={
            tag:"gameFinished",
            won:false
         }


         let absentSocket;
         if(GameBoard.userturn===GameBoard.userA)
         {
            waiterUserName=GameBoard.userB;
            absentSocket=GameBoard.userA;
         }else{
            waiterUserName=GameBoard.userA;
            absentSocket=GameBoard.userB;
         }
         tagMessage.point=GameBoard.room;


         wss.clients.forEach(function (client){

            if(client.username===waiterUserName)
            {
               tagMessage.won=true;
               client.send(JSON.stringify(tagMessage));
               console.log("opp is offline and sending extra time"+remainingTimer)
            }
            if(client.username===absentSocket)
            {
               tagMessage.won=false;
               client.send(JSON.stringify(tagMessage));
               console.log("opp is offline and sending extra time"+remainingTimer)
            }


         });



        // console.log(GameBoard.state.username+" Lost because of not playing his/her turn in turn"+GameBoard.turn)
         let winnerusername="";
         if(GameBoard.userA===GameBoard.userturn)
         {
            winnerusername=GameBoard.userB;
         }
   
         if(GameBoard.userB===GameBoard.userturn)
         {
            winnerusername=GameBoard.userA; 
         }
   
         let winnersocket=null;
   
    wss.clients.forEach(function(client) {
         
            if(client.username===winnerusername)
            {
               winnersocket=client;
            }
         });
   
         finishBoard(GameBoard,winnerusername,winnersocket);
      }


   }, remainingTimer);
   }



}, 90000);
   
   
}
 
function checkForOngoingGame(gameid)
{
   console.log(gameid);
   let Board=boards.find(x=>x.Boardid===gameid);
   if(Board)
   {
      console.log("found ongoing board");
      return Board;
   }else{
      console.log("Not found ongoing board");
      return null;
   }
}

function SendWinner(winnerId,MatchId)
{
   console.log("winner Id:"+winnerId+"---MatchId is:"+MatchId);

   let formData=new FormData();
   formData.append('winner_id',winnerId);      
   
   //axios.defaults.headers.common = {'Authorization': `Bearer ${token}`}
   
   let config = {
      method: 'post',
      url: 'https://game.iwco.io/api/matches/'+MatchId+"/conclusion",
      headers: { 
        ...formData.getHeaders()
      },
      data : formData
    };
    
    axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
}


function finishBoard(Board,winnerUsername,winnerSocket)
{
   if(Board)
   {
      clearTimeout(Board.timer);
   }

   let boardId=Board.Boardid;

   GetUserIdBasedOnUserName(dbconnection,winnerUsername).then(function(rows){
      let userid=JSON.parse(JSON.stringify(rows));
      let winnerid=(userid[0].id);
      SendWinner(winnerid,boardId);
   })

   let winPrice=Board.room;
   let loserusername;
   if(Board.userA==winnerUsername)
   {
      loserusername=Board.userB;
   }else{
      loserusername=Board.userA;
   }


   let winnerQuery="Select * from users where username='"+winnerUsername+"'";
   console.log(winnerQuery);
   dbconnection.query(winnerQuery,(err,rows)=>{
      if(err) throw err;
      rows=JSON.parse(JSON.stringify(rows));
      let lastcoin=rows[0].coin;
      let newcoin=lastcoin+(winPrice*0.9);
      let lastLevel=rows[0].level;
      let newlevel=lastLevel+50;
       
      let updatequeryOnWinner="Update users Set coin ="+newcoin+" , level="+newlevel+"  WHERE username ='"+winnerUsername+"' ";
      console.log(updatequeryOnWinner)
      dbconnection.query(updatequeryOnWinner,(err,rows2)=>{
         if(err) throw err;
         
         let tagMessage={
            tag:""
         }
         tagMessage.tag="setstat";
         tagMessage.coin=newcoin;
         tagMessage.level=newlevel;
         if(winnerSocket)
         {
            winnerSocket.send(JSON.stringify(tagMessage));
         }
        

      })


   })

   let loserQueryQuery="Select * from users where username='"+loserusername+"'";
   console.log(loserQueryQuery);
   dbconnection.query(loserQueryQuery,(err,rows)=>{
      if(err) throw err;
      
      rows=JSON.parse(JSON.stringify(rows));
      let lastcoin=rows[0].coin;
      let newcoin=lastcoin-winPrice;
      let lastLevel=rows[0].level;
      let newlevel=lastLevel-30;
       if(newlevel<0)
       {
         newlevel=0;
       }
      let updatequeryOnloser="Update users Set coin ="+newcoin+" , level="+newlevel+"  WHERE username ='"+loserusername+"' ";
      console.log(updatequeryOnloser)
      dbconnection.query(updatequeryOnloser,(err,rows2)=>{
         if(err) throw err;
         
         let tagMessage={
            tag:""
         }
         tagMessage.tag="setstat";
         tagMessage.coin=newcoin;
         tagMessage.level=newlevel;
         if(winnerSocket!=null  && winnerSocket!=undefined)
         {
            let loserSocket=winnerSocket.opp;
            if(loserSocket!=undefined && loserSocket!=null)
            {
               loserSocket.send(JSON.stringify(tagMessage));
            }
           
         }        

      })

   })



   let index=boards.indexOf(Board);
   boards.splice(index,1);
}

function Resign(Board,resignerName,resignerSocket)
{

   if(!Board)
   {
      return;
   }

   if(!Board.room && Board.room!==0)
   {
      console.log("no room");
      return;
   }

   //let winPrice=Board.room;
   console.log("resigning")
   let loserusername;
   let winnerUsername;
   if(Board.userA===resignerName)
   {
      loserusername=Board.userA;
      winnerUsername=Board.userB;
   }else{
      loserusername=Board.userB;
      winnerUsername=Board.userA;
   }


   let boardId=Board.Boardid;
   console.log(Board.room+" is room price");
   GetUserIdBasedOnUserName(dbconnection,winnerUsername).then(function(rows){
      let userid=JSON.parse(JSON.stringify(rows));
      let winnerid=(userid[0].id);
      console.log("winner id"+winnerid);
      SendWinner(winnerid,boardId);
   })


      if(Board)
      {
         if(Board.timer)
         {
            clearTimeout(Board.timer);
         }
      }


   let winnerQuery="Select * from users where username='"+winnerUsername+"'";
   console.log(winnerQuery);
   dbconnection.query(winnerQuery,(err,rows)=>{
      if(err) throw err;
      rows=JSON.parse(JSON.stringify(rows));
      //let lastcoin=rows[0].coin;

      let lastLevel=rows[0].level;
      let newlevel=lastLevel+50;
       
      let updatequeryOnWinner="Update users Set level='"+newlevel+"'  WHERE username ='"+winnerUsername+"' ";
      console.log(updatequeryOnWinner)
      dbconnection.query(updatequeryOnWinner,(err,rows2)=>{
         if(err) throw err;
         
         let tagMessage={
            tag:""
         }
         tagMessage.tag="setstat";
         //tagMessage.coin=newcoin;
         tagMessage.level=newlevel;
         let winnerSocket;
         wss.clients.forEach(function(client) {
            if(client.username===winnerUsername)
            {
               winnerSocket=client;

            }
         });
         if(winnerSocket )
         {
            winnerSocket.send(JSON.stringify(tagMessage));

            tagMessage={}
            tagMessage.tag="gameFinished";
            tagMessage.won=true;
            tagMessage.point=Board.room;
            winnerSocket.send(JSON.stringify(tagMessage));

         }
        

      })


   })

   let loserQueryQuery="Select * from users where username='"+loserusername+"'";
   console.log(loserQueryQuery);
   dbconnection.query(loserQueryQuery,(err,rows)=>{
      if(err) throw err;
      
      rows=JSON.parse(JSON.stringify(rows));
      //let lastcoin=rows[0].coin;
      //let newcoin=lastcoin-winPrice;
      let lastLevel=rows[0].level;
      let newlevel=lastLevel-30;
       if(newlevel<0)
       {
         newlevel=0;
       }
      let updatequeryOnloser="Update users Set level='"+newlevel+"'  WHERE username ='"+loserusername+"' ";
      console.log(updatequeryOnloser)
      dbconnection.query(updatequeryOnloser,(err,rows2)=>{
         if(err) throw err;
         
         let tagMessage={
            tag:""
         }
         tagMessage.tag="setstat";
        // tagMessage.coin=newcoin;
         tagMessage.level=newlevel;
         if(resignerSocket)
         {
            resignerSocket.send(JSON.stringify(tagMessage));
            tagMessage={}
            tagMessage.tag="gameFinished";
            tagMessage.won=false;
            tagMessage.point=Board.room;
            resignerSocket.send(JSON.stringify(tagMessage));

           
         }        

      })

   })



   let index=boards.indexOf(Board);
   boards.splice(index,1);
}

function dice(ws)
{
   let tagMessage={
      tag:""
   }
   
        let a= Math.floor(Math.random() * 6) + 1;
        let b= Math.floor(Math.random() * 6) + 1;       


        
        let Board=boards.find(x=>x.Boardid===ws.matchid);   
        if(!Board)
        {
         return;    
        }
        if(Board.timer)
        {
           console.log("cancelling last turn timer")
           clearTimeout(Board.timer)
        }
        Board.lasttimer=Date.now();
        Board.phase="move";
        if(Board.state===null)
        {
           if(a===b)
           {
              if(a+1<7)
              {
                 a=a+1;
              }else{
                 a=a-1;
              }


           }
         if(a>b)
         {
            Board.state=ws;
            Board.userturn=Board.state.username;
            waitForSocketToPlay(Board);
         }if(a<b)
         {
            Board.state=ws.opp;
            Board.userturn=Board.state.username;
            waitForSocketToPlay(Board);
         }        
        
        }else{
         waitForSocketToPlay(Board);
        }
        
        
        Board.diceA=a;
        Board.diceB=b;
        console.log(Board.diceA);
       

        //tagMessage.board=Board;
        tagMessage.tag="dice";
        tagMessage.a=a;
        tagMessage.b=b;
        ws.send(JSON.stringify(tagMessage));
        tagMessage.a=b;
        tagMessage.b=a;
        if(ws.opp)
        {
           ws.opp.send(JSON.stringify(tagMessage));
        }

}

function GetUserIdBasedOnUserName(connection,userName)
{   
 let sql="select id from users where username='"+userName+"'";
 return new Promise(function(resolve,reject){
   connection.query(sql,function(err,rows,fields){
      if(err){
         return reject(err);
      }
      
      resolve(rows);
   })
 })
 
}


async function CheckIfFriendRequestSent(requester,requested,con)
{
   let sql="Select * from friendslist where (requesterId='"+requester+"' and requestedId='"+requested+"') OR  (requesterId='"+requested+"' and requestedId='"+requester+"');";
   console.log(sql);
   return new Promise(function(resolve,reject){
      con.query(sql,function(err,rows,fields){
         if(err){
            return reject(err);
         }
         
         resolve(rows.length);
      })
    })
  
   


}

function base64ToArrayBuffer(base64) {
   let binary_string = Buffer.from(base64, 'base64').toString('binary');
   let len = binary_string.length;
   let bytes = new Uint8Array(len);
   for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
   }

   return bytes.buffer;
}

wss.on('listening',()=>{
   console.log('listening on 80')
})

wss.on('close', function close() {
   clearInterval(interval);
});
