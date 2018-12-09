require('express-async-errors');
var express = require('express');
const helmet = require('helmet');
var path = require('path');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var https = require('https');
var debug = require('debug');
var csrf = require('csurf');
var session = require('express-session');
var cors = require('cors');
var morgan = require('morgan');
var hsts = require('hsts');
const models = require('./models');
const xssFilter = require('x-xss-protection');




//middleware
var error = require('./middleware/error');

var csrfProtection = csrf({ cookie: false });


var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');
var homeRouter = require('./routes/home');
var logoutRouter=require('./routes/logout');
var gameRouter=require('./routes/checkersgame');

/*var User = require('./models/users');*/

/**
 * get the keys from /certificates folder
 */
var options = {
  //testing
//key: fs.readFileSync('./bin/certificates/newCert-key.pem'),
  //cert: fs.readFileSync('./bin/certificates/newCert-cert.pem'),
  //ca: [fs.readFileSync('./bin/certificates/newCert-cert.pem')],
  rejectUnauthorized: true,
 // key: fs.readFileSync('./bin/certificates/checkers-key.pem'),
  ///cert: fs.readFileSync('./bin/certificates/checkers-cert.pem'),
 // dhparam: fs.readFileSync('./bin/certificates/dhparam.pem'),
 // ca: [fs.readFileSync('./bin/certificates/checkers-cert.pem')]

 key: fs.readFileSync('./bin/certificates/localhost.key'),
  cert: fs.readFileSync('./bin/certificates/localhost.crt'),
  //ca: [fs.readFileSync('./bin/certificates/newCert-cert.pem')],

 
};


var app = express();
var server = https.createServer(options, app);
var io = require('socket.io')(server);
//io.set('flash policy port', 3300)
/*app.use(function(req, res, next){
  res.io = io;
  next();
});*/
app.set('trust proxy', 1);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'pug');

app.use(morgan('combined'));
app.use(cors());

app.use(session({
  cookieName: 'cqsession',
  secret: 'jiqch6ec8ker1sinf2orm7',
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: 600000,
    secure: true,
    httpOnly: true,
    domain:'localhost'
  },
}))

app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'wss://localhost:3001'],
    styleSrc: ["'self'", "'unsafe-inline'"],
  }, setAllHeaders: true,
}));
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
app.use(helmet.frameguard({ action: 'sameorigin' }));
var sixtyDaysInSeconds = 5184000;
app.use(hsts({
  maxAge: sixtyDaysInSeconds,
  includeSubDomains:true,
  preload:true
}))

app.use(xssFilter());
app.use(xssFilter({ setOnOldIE: true }));

//app.use(cookieParser());
app.use(csrfProtection);

//app.use(socketIO);
//sockets

//Socket Events
var AllGames = {};
var globalStats = [];

io.on('connection', function (socket) {
  console.log('A player connected', socket.id);

  io.sockets.connected[socket.id].emit('takeStats', globalStats);
  socket.on('disconnect', function () {
    setTimeout(function () {
      console.log("User " + socket.id + " disconnected!");
    }, 10000);

  });

  var list = io.sockets.sockets;
  console.log("Connected sockets:");
  Object.keys(io.sockets.sockets).forEach(function (id) {
    console.log("ID: ", id);
  });

  socket.emit('message', { 'inital ': 'message from server' });
  socket.on('received', (data) => {
    console.log('received :', data);
  })

  //create gameroom
  socket.on('createGameRoom', async function (data) {
    var thisGameId = (Math.random() * 100000) | 0;
    var email = data.email;

    socket.join(thisGameId.toString());
    //var numPlayersInRoom = 1;
    AllGames[thisGameId] = 1;
    console.log('AllGames', AllGames);
    //db insert for above logic

    var game = {
      gameId: thisGameId,
      player1_id: email,
      player2_id: '',
      status: 'waiting'
    };
    try {
      const gameRoom = await models.Game.create(game);
      if (gameRoom) {
        socket.emit('newGameRoomCreated', { 'gRoomId': thisGameId, 'mySocketId': socket.id, 'numPlayersInRoom': 1 });
        console.log('GameRoomCreated: ' + thisGameId + " user email: ",email);
      }

    } catch (err) {
      console.log(err);
      socket.emit('error', err);
    }

  });

  socket.on('getGameRooms', () => {
    socket.emit('gameRoomList', AllGames);
    console.log('sending gameRooms..', AllGames);
  })

  socket.on('joinGameRoom', async (newPlayer) => {
    var playerInfo = {
      gRoomId: newPlayer.gRoomId,
      mySocketId: socket.id,
      numPlayersInRoom: 2
    }

    var roomId = playerInfo.gRoomId;
    socket.join(roomId);
    AllGames[playerInfo.gRoomId] = 2;
    //now update db

    const { error } = models.Game.validateEmail({ player2_id: newPlayer.email });
    if (error) socket.emit('error', { message: 'Invalid player Email Received' })

    try {
      const gRoomUpdate = await models.Game.update({ player2_id: newPlayer.email, status: "ready" }, {
        where: { gameId: playerInfo.gRoomId }
      });

      if (gRoomUpdate) {
        socket.emit('joinedRoom', playerInfo);
        const getRoomInfo = await models.Game.findOne({ where: { gameId: roomId } });
        if (getRoomInfo)
          io.to(roomId).emit('startCheckers', getRoomInfo.dataValues);
      }

    } catch (err) {
      console.log(err);
      socket.emit('error', err);

    }

  });


  socket.on('moveTo', async(moveSrcDest)=>{
    console.log(moveSrcDest);
    io.sockets.emit('moved',{move:moveSrcDest});

  })
  socket.on('move',async(moveData)=>{
    console.log(moveData);
    const email = moveData.email;
    const roomId=moveData.roomId;
    var gameMove = {
      gameId:moveData.roomId,
      player:email,
      src:moveData.tile,
      dest:moveData.position
    }
    
    io.sockets.emit('moved',{tile:moveData.tile,piece:moveData.piece,board:moveData.board})
    
    try{

      console.log('updating Game....');
      const gameData = await models.Game.update({status:"playing"}, {
        where :{gameId:roomId}
      });

      if(gameData){
        console.log('updating game moves');
/*
        const gameMoves = await models.GameMove.create(gameMove);
        if(gameMoves){
          console.log('Moves Added..')
        }*/
      }
    }catch(err){

    }
    
  })
  


});

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/home',homeRouter);
app.use('/logout',logoutRouter);
app.use('/checkersGame',gameRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next();
});

app.use(error);

module.exports = { app: app, server: server };
