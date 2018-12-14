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
var hsts = require('hsts');
const xssFilter = require('x-xss-protection');


//middleware
var error = require('./middleware/error');
var csrfProtection = csrf({ cookie: false });

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');
var homeRouter = require('./routes/home');
var logoutRouter = require('./routes/logout');
var gameRouter = require('./routes/checkersgame');

/*var User = require('./models/users');*/

/**
 * get the keys from /certificates folder
 */
var options = {
  
  rejectUnauthorized: true,
  key: fs.readFileSync('./bin/certificates/localhost.key'),
  cert: fs.readFileSync('./bin/certificates/localhost.crt'),
  
};

var app = express();
var server = https.createServer(options, app);
var io = require('socket.io')(server);
app.set('trust proxy', 1);
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
    httpOnly: true,
    domain: 'localhost'
  },
}))


app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.contentSecurityPolicy({
  directives: {
  defaultSrc: ["'self'", 'wss://localhost:3000'],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    fontSrc: ["'self'"]
  }, setAllHeaders: true,
}));
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
app.use(helmet.frameguard({ action: 'sameorigin' }));
var oneYearInSeconds = 31536000;
app.use(hsts({
  maxAge: oneYearInSeconds,
  includeSubDomains: true,
  preload: true
}))

app.use(xssFilter());
app.use(xssFilter({ setOnOldIE: true }));


app.use(csrfProtection);

//app.use(socketIO);
//sockets

//Socket Events
var AllGames = {};
var globalStats = [];
//var players{};


io.on('connection', function (socket) {
  console.log('A player connected', socket.id);
  /*
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);*/

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

  //create gameroom
  socket.on('createGameRoom', async function (data) {
    var thisGameId = (Math.random() * 100000) | 0;
    var email = data.email;
    var playerNumber = 1;

    socket.join(thisGameId.toString());
    //var numPlayersInRoom = 1;
    AllGames[thisGameId] = 1;
    console.log('AllGames', AllGames);
    //db insert for above logic

    var game = {
      gameId: thisGameId,
      player1_id: email,
      //player2_id: mySocketId,
      //player2_id: email,
      player2_id: '',
      status: 'waiting',
      //playerOne: playerNumber
    };
    try {
      const gameRoom = await models.Game.create(game);
      if (gameRoom) {
        socket.emit('newGameRoomCreated', { 'gRoomId': thisGameId, 'mySocketId': socket.id, 'numPlayersInRoom': 1 });
        console.log('GameRoomCreated: ' + thisGameId + " user email: ", email);
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
      numPlayersInRoom: 2,
      //play1Id: 1,
      //play2Id: 2
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

    } 
    
    catch (err) {
      console.log(err);
      socket.emit('error', err);

    }

    //todo
    //now initialize game data and set everything ready for players to start
    /**
       * Handle the turn played by either player and notify the other.
       */
    /*socket.on('playTurn', (data) => {
      socket.broadcast.to(data.roomId).emit('turnPlayed', {
        tile: data.tile,
        room: gRoomId
      });
    });*/
    //socket.on('userId',function(data){
      //var user = data.id ;
      //console.log('GameRoomCreated: ' + thisGameId + " user email: ");
      //Add user to a list and consolidate or whatever //
    //});

    // when the client emits 'typing', we broadcast it to others
    /*socket.on('typing', function () {
      socket.broadcast.emit('typing', {
      username: socket.username
    });*/
  })

  socket.on('moveTo', async (moveSrcDest) => {

    var currentMove = moveSrcDest.PlayerMove;
    //console.log(currentMove);
    var gameMove = {
      gameId: currentMove.roomId,
      moveNum: currentMove.roundCount,
      player: currentMove.playerEmail,
      src: currentMove.src,
      dest: currentMove.dest
    }

    console.log('Game set to playing..');

    const { error } = models.GameMove.validate(gameMove);
    if (error) socket.emit('error', { message: 'Invalid Move' });
    gameMove.src = currentMove.src.toString();
    gameMove.dest = currentMove.dest.toString();

    const gameMovesToDB = await models.GameMove.create(gameMove);
    if (gameMovesToDB) {
      io.sockets.emit('moved', { move: moveSrcDest });
    }
    //}
  })
  socket.on('end', async (data) => {
    console.log(data);
    var game = data.Game;
    //update Game table. set status as completed and add the winner email id.
    const gameData = await models.Game.update({ status: game.status, result: game.winner }, {
      where: { gameId: game.roomId }
    });

    if (gameData) {
      console.log('Updated result in DB.');
      console.log('Fetching moves..')
      const player1Moves = await models.GameMove.findAll({
        where: {
          player: game.player1Email,
          gameId: game.roomId
        }
      });

      const player2Moves = await models.GameMove.findAll({
        where: {
          player: game.player2Email,
          gameId: game.roomId
        }
      });

      console.log(player1Moves[0].dataValues);
      console.log(player2Moves[0].dataValues);
      io.sockets.emit('currentGameMoves', { player1: player1Moves[0].dataValues, player2: player2Moves[0].dataValues });
    }

  })

  //get moves for game
  socket.on('getGameMoves', async (data) => {
    

  })

  //get completed games history with winner.
  socket.on('gameHistory', async (data) => {
    var gameHistory = [];
    try {
      let stat = await models.Game.findAll({ where: { status: 'completed' } });
      if (stat) {
        stat.forEach(Game => {
          gameHistory.push(Game.get({ plain: true }));
        })
        socket.emit('gameHistoryFromServer', gameHistory);
      }

    } catch (err) {

    }
  })

  //get all completed game moves;
  //get a room id from server and get the moves for play in that room 
  socket.on('getCompletedGameMoves', async (data) => {
    var gameMoves = [];
    try {
      const moves = await models.GameMove.findAll({
        where: {
          gameId: data.roomId
        }
      })
      if (moves)
        moves.forEach(GameMove => {
          gameMoves.push(GameMove.get({ plain: true }));
        })
      socket.emit('gameMoves', gameMoves);

    } catch (err) {
    }
  })
  socket.on('paused',()=>{
    console.log('User has paused the game');
    io.sockets.emit('pause');

  })

});



app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/home', homeRouter);
app.use('/logout', logoutRouter);
app.use('/checkersGame', gameRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next();
});

app.use(error);

module.exports = { app: app, server: server };
