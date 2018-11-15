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
var Joi = require('joi');
const models = require('./models');



//middleware
var error = require('./middleware/error');

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');

/*var User = require('./models/users');*/

/**
 * get the keys from /certificates folder
 */
var options = {
  key: fs.readFileSync('./bin/certificates/checkers-key.pem'),
  cert: fs.readFileSync('./bin/certificates/checkers-cert.pem'),
  ca: [fs.readFileSync('./bin/certificates/checkers-cert.pem')]
};

var app = express();
var server = https.createServer(options, app);
var io = require('socket.io')(server);
/*app.use(function(req, res, next){
  res.io = io;
  next();
});*/

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
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
    httpOnly: true
  },
}))

app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'wss://localhost:3000'],
    styleSrc: ["'self'", "'unsafe-inline'"],
  }, setAllHeaders: true,
}));
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
var sixtyDaysInSeconds = 5184000;
app.use(helmet.hsts({
  maxAge: sixtyDaysInSeconds
}))

//app.use(socketIO);
//sockets

//Socket Events
var AllGames = {};
var globalStats = [];

io.on('connection', function (socket) {
  console.log('A player connected', socket.id);

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
      game_id: thisGameId,
      player1_id: email,
      player2_id: '',
      status: 'waiting'
    };
    try {
      const gameRoom = await models.Game.create(game);
      if (gameRoom) {
        socket.emit('newGameRoomCreated', { 'gRoomId': thisGameId, 'mySocketId': socket.id, 'numPlayersInRoom': 1 });
        console.log('GameRoomCreated: ' + thisGameId + " user email: ");
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
        where: { game_id: playerInfo.gRoomId }
      });

      if (gRoomUpdate) {
        socket.emit('joinedRoom', playerInfo);
        const getRoomInfo = await models.Game.findOne({ where: { game_id: roomId } });
        if (getRoomInfo)
          io.to(roomId).emit('startCheckers', getRoomInfo.dataValues);
      }

    } catch (err) {
      console.log(err);
      socket.emit('error', err);

    }


    //todo
    //now initialize game data and set everything ready for players to start
  })


});



app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
//todo
//add logout route handler

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(error);

module.exports = { app: app, server: server };
