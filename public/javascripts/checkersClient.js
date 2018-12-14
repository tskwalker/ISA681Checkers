const socket = io.connect('https://localhost:3000/', {
    secure: true,
    'flash policy port': 3300
});

var App = {
    gRoomId: 0,
    pEmail: "",
    pName: "",
    playId: 0,
    mySocketId: 0,
    numPlayersInRoom: 0,
    roundCount: 0
};

var Game = {
    player1Email: "",
    player2Email: "",
    roomId: 0,
    status: "ready",
    winner: "",
    totalScore1: 0,
    totalScore2: 0
}

var PlayerMove = {
    player: "",
    playerEmail: "",
    roomId: "",
    src: [],
    dest: [],
    jump: false,
    roundCount: 0
}
var roomList = [];
var gamesHistory = [];
var selectedGameId;
//sockets and functions


socket.on('newGameRoomCreated', function (data) {
    App.gRoomId = data.gRoomId;
    App.mySocketId = data.mySocketId;

    App.numPlayersInRoom = data.numPlayersInRoom;
    App.points = 0;
    console.log('GameRoom created with Id: ' + App.gRoomId + ' and socketId: ' + App.mySocketId + ' with ' + App.numPlayersInRoom + ' Players');


    $(".waitMsg").append(' to join Game Room : ', App.gRoomId);
    $(".waitMsg").show();
    var gRoom = [];
    gRoom[App.gRoomId] = App.numPlayersInRoom;

    $("#joinGRBtn").prop('disabled', true);
    Game.player1Email = data.player1_id;

    window.alert('Welcome, ' + App.pEmail + ' Your game room number is:' + App.gRoomId + ' and you are player 1');
});


socket.on('gameRoomList', (GameRooms) => {
    roomList = GameRooms;
    showGameRooms(GameRooms);
});


socket.on('startCheckers', (roomInfo) => {
    console.log(roomInfo);

    $(".waitMsg").hide();
    $(".playerJoinedMsg").show();
    $(".joinRoomMsg").hide();

    if (App.pEmail === roomInfo.player1_id) {
        App.playId = 1;
        //disable player 2 pieces
        $(".player2pieces").removeClass('selected');
        window.alert(roomInfo.player2_id + ' has joined your game room: ' + App.gRoomId + ' as Player 2, click ok to start the game');
    }
    else if (App.pEmail === roomInfo.player2_id) {
        App.playId = 2;
        //disable player 1 pieces
        $(".player1pieces").removeClass('selected');
        window.alert('Welcome, ' + roomInfo.player2_id + ', You have joined game room :' + App.gRoomId + ' and you are Player 2, click ok to start the game');

    }

    Game.player1Email = roomInfo.player1_id;
    Game.player2Email = roomInfo.player2_id;
    Game.roomId = App.gRoomId;
    Game.redTop = 1;
    Game.blueBottom = 2;
    Game.status = roomInfo.status;


    //var email = $("#myEmail").append();
    $("#player1Id").append(Game.player1Email);
    $("#player2Id").append(Game.player2Email);
    $("#gameRoom").append(Game.roomId);

    $(".column").show();

    //startCheckers(Game);
    console.log('Player 1 is ' + Game.player1Email + 'Player 2 is ' + Game.player2Email);

});

socket.on('gameMoves', (data) => {


    $(".movesMsg").show();
    $("#moves_table").show();
    var table = new Tabulator("#moves_table", {

        width: "50%",
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 6,

        columns: [
            { title: "round", field: "moveNum", sorter: "number" },
            { title: "player", field: "player" },
            { title: "from", field: "src" },
            { title: "to", field: "dest" },
        ],

    });
    table.setData(data);


})

socket.on("gameHistoryFromServer", (data) => {

    gamesHistory = data;
    $("#stat_table").show();
    var table = new Tabulator("#stat_table", {

        width: "50%",
        layout: "fitColumns",
        selectable: true,
        columns: [
            { title: "Room", field: "gameId", sorter: "number" },
            { title: "Player1", field: "player1_id", },
            { title: "Player2", field: "player2_id" },
            { title: "Winner", field: "result" },
            { title: "Status", field: "status", visible: false },

        ],
        rowSelected: function (row) {
            var selected = row.getData();
            if (selected) {

                selectedGameId = selected.gameId;
                $("#moveGBtn").prop('disabled', false);
            }

        },
    });

    table.setData(gamesHistory);
    $("#select-row").click(function () {
        table.selectRow(1);
    });

})
//functions

function createGRoom() {
    socket.emit('createGameRoom', { email: App.pEmail });
    //console.log('emitted createGameRoom', App.pEmail);
    console.log('New game room was created by', App.pEmail);
    console.log('emitted createGameRoom', App.mySocketId);
    $("#gameHistory").prop('disabled', true);
    $("#moveGBtn").prop('disabled', true);
    $("#clearTables").prop('disabled', true);

}
function joinRoom() {
    $(".joinRoomMsg").show();
    var gRoomId = $("input[type='radio'][name='radiobtn']:checked").val();
    App.gRoomId = gRoomId;
    console.log('->value now: ' + App.gRoomId);
    var content = { 'gRoomId': App.gRoomId, 'email': App.pEmail };
    console.log("Value of gRoodId:  " + gRoomId);
    socket.emit('joinGameRoom', content);
    $(".joinRoomMsg").hide();
    $("#roomList").hide();
    $("#gameHistory").prop('disabled', true);
    $("#moveGBtn").prop('disabled', true);
    $("#clearTables").prop('disabled', true);
    console.log('GRoomId sent to Join: ' + $("input:radio:checked").val());
}
function checkGameRoomStatus() {
    socket.emit('getGameRooms');
    console.log('get the list of game rooms from server');
}
function startCheckers(GameData) {
    console.log('startCheckers', GameData);

}


function showGameRooms(GameRooms) {
    for (var i in GameRooms) {
        if (GameRooms[i] < 2) {
            console.log(i + " has " + GameRooms[i] + " player(s)");
            $("<input type='radio' name='radiobtn' value=" + i + ">" + i + "</input><br/>").appendTo("#roomList");
        }
        // else
        // $("#createGRBtn").prop('disabled', false);

    }
    console.log(GameRooms);
    const rooms = jQuery.isEmptyObject(GameRooms);
    if (!rooms) {

        $("#joinGRBtn").prop('disabled', false);
        // $("#createGRBtn").prop('disabled', true);

    }

}

function getCompletedGameMoves() {

    //emit completed game list
    if (selectedGameId)
        console.log('emiting..', selectedGameId);
    socket.emit('getCompletedGameMoves', { roomId: selectedGameId });
}

function getGameHistory() {
    //get game history from server
    socket.emit('gameHistory');
}

$(function () {
    $("#joinGRBtn").attr("disabled", "disabled");
    // $("#resumeGBtn").attr("disabled", "disabled");
    $("#startPlayBtn").attr("disabled", "disabled");
    $("#moveGBtn").attr('disabled', "disabled");

    $(".column").hide();

    checkGameRoomStatus();

    $("#createGRBtn").one('click', function () {
        createGRoom();
    });
    $("#joinGRBtn").one('click', function () {
        joinRoom();
    });
    $("#startPlayBtn").one('click', () => {
        //startCheckers();
    });

    $("#moveGBtn").on('click', () => {
        getCompletedGameMoves();

    })

    $('#gameHistory').on('click', () => {
        getGameHistory();
    })

    $("#clearTables").on('click', () => {
        $("#stat_table").hide();
        $(".movesMsg").hide();
        $("#moves_table").hide();
    })

    App.pEmail = $("#sEmail").text();
    console.log('Created global email variable: ' + App.pEmail);

    App.pName = $("#sName").text();
    console.log('Created global name variable: ' + App.pName);

    App.mySocketId = $("#pId").text();
    console.log('Users player ID is ' + App.mySocketId);



    //checkers board



    // var socket=io();
    //The initial setup
    var gameBoard = [
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [2, 0, 2, 0, 2, 0, 2, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
        [2, 0, 2, 0, 2, 0, 2, 0]
    ];
    //arrays to store the instances
    var pieces = [];
    var tiles = [];
    var players = [];

    Game.player1Email = parseInt("1");
    Game.player2Email = parseInt("2");
    var firstPlayer = Game.player1Email;
    var secondPlayer = Game.player2Email;


    //distance formula
    var dist = function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }
    //Piece object - there are 24 instances of them in a checkers game
    function Piece(element, position) {
        //linked DOM element
        this.element = element;
        //positions on gameBoard array in format row, column
        this.position = position;
        //which player's piece i it
        this.player = '';
        //figure out player by piece id
        if (this.element.attr("id") < 12)
            this.player = firstPlayer;

        else
            this.player = secondPlayer;

        this.king = false;
        this.makeKing = function () {
            this.element.css("backgroundImage", "url('/images/king" + this.player + ".png')");
            this.king = true;
        }

        this.move = function (tile) {
            this.element.removeClass('selected');
            if (!Board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;
            var move = { dest: [tile.position[0], tile.position[1]] };

            PlayerMove.src = [this.position[0], this.position[1]];
            PlayerMove.dest = [tile.position[0], tile.position[1]];
            PlayerMove.player = this.player;
            //make sure piece doesn't go backwards if it's not a king
            if (this.player == 1 && this.king == false) {
                if (tile.position[0] < this.position[0]) return false;
            } else if (this.player == 2 && this.king == false) {
                if (tile.position[0] > this.position[0]) return false;
            }
            //remove the mark from Board.board and put it in the new spot
            Board.board[this.position[0]][this.position[1]] = 0;
            Board.board[tile.position[0]][tile.position[1]] = this.player;
            this.position = [tile.position[0], tile.position[1]];
            //change the css using board's dictionary
            this.element.css('top', Board.dictionary[this.position[0]]);
            this.element.css('left', Board.dictionary[this.position[1]]);
            //if piece reaches the end of the row on opposite side crown it a king (can move all directions)
            if (!this.king && (this.position[0] == 0 || this.position[0] == 7))
                this.makeKing();
            Board.changePlayerTurn();
            //socket.emit('moveTo', { src: PlayerMove.src, dest: PlayerMove.dest, player: this.player });
            return true;
        };

        //tests if piece can jump anywhere
        this.canJumpAny = function () {
            if (this.canOpponentJump([this.position[0] + 2, this.position[1] + 2]) ||
                this.canOpponentJump([this.position[0] + 2, this.position[1] - 2]) ||
                this.canOpponentJump([this.position[0] - 2, this.position[1] + 2]) ||
                this.canOpponentJump([this.position[0] - 2, this.position[1] - 2])) {
                return true;
            } return false;
        };

        this.checkBoundayandValidate = function (x, y) {
            if (x > 7 || y > 7 || x < 0 || y < 0) return false;
            return Board.isValidPlacetoMove(x, y);

        }
        this.canMakeAnyMove = function () {
            //console.log('canMakeAnyMove from :', this.position);
            //do boundary validation

            if (this.checkBoundayandValidate(this.position[0] + 1, this.position[1] + 1) ||
                this.checkBoundayandValidate(this.position[0] + 1, this.position[1] - 1) ||
                this.checkBoundayandValidate(this.position[0] - 1, this.position[1] + 1) ||
                this.checkBoundayandValidate(this.position[0] - 1, this.position[1] - 1)) {
                return true;
            }
            else {
                //no direct moves possible, so check if jumps are possible.
                return this.canJumpAny();
            };

        }

        //tests if an opponent jump can be made to a specific place
        this.canOpponentJump = function (newPosition) {
            // console.log('canOpponentJump:', newPosition[0],newPosition[1]);

            //find what the displacement is
            var dx = newPosition[1] - this.position[1];
            var dy = newPosition[0] - this.position[0];
            //make sure object doesn't go backwards if not a king
            if (this.player == 1 && this.king == false) {
                if (newPosition[0] < this.position[0]) return false;
            } else if (this.player == 2 && this.king == false) {
                if (newPosition[0] > this.position[0]) return false;
            }
            //must be in bounds
            if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0) return false;
            //middle tile where the piece to be conquered sits
            var tileToCheckx = this.position[1] + dx / 2;
            var tileToChecky = this.position[0] + dy / 2;
            //if there is a piece there and there is no piece in the space after that
            if (!Board.isValidPlacetoMove(tileToChecky, tileToCheckx) && Board.isValidPlacetoMove(newPosition[0], newPosition[1])) {
                //find which object instance is sitting there
                for (pieceIndex in pieces) {
                    if (pieces[pieceIndex].position[0] == tileToChecky && pieces[pieceIndex].position[1] == tileToCheckx) {
                        if (this.player != pieces[pieceIndex].player) {
                            //return the piece sitting there
                            return pieces[pieceIndex];
                        }
                    }
                }
            }
            return false;
        };

        this.opponentJump = function (tile) {
            var pieceToRemove = this.canOpponentJump(tile.position);
            //if there is a piece to be removed, remove it
            if (pieceToRemove) {
                pieces[pieceIndex].remove();
                return true;
            }
            return false;
        };

        this.remove = function () {
            //remove it and delete it from the gameboard
            this.element.css("display", "none");
            if (this.player == 1) {
                $('#player2').append("<div class='capturedPiece'></div>");
                Game.totalScore2++;
                // console.log("Game.totalScore2:", Game.totalScore2)
            }
            if (this.player == 2) {
                $('#player1').append("<div class='capturedPiece'></div>");
                Game.totalScore1++;
                //console.log("Game.totalScore1:", Game.totalScore1);
            }
            Board.board[this.position[0]][this.position[1]] = 0;
            //reset position so it doesn't get picked up by the for loop in the canOpponentJump method
            this.position = [];

        }

    }


    function Tile(element, position) {
        //this.piece = piece;
        //linked DOM element
        this.element = element;
        //position in gameboard
        this.position = position;
        //if tile is in range from the piece
        this.inRange = function (piece) {
            if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
                //regular move
                return 'regular';
            } else if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == 2 * Math.sqrt(2)) {
                //jump move
                return 'jump';
            }
        };
    }

    //Board object - controls logistics of game
    var Board = {
        board: gameBoard,
        playerTurn: 1,
        tilesElement: $('div.tiles'),
        //dictionary to convert position in Board.board to the viewport units
        dictionary: ["0vmin", "10vmin", "20vmin", "30vmin", "40vmin", "50vmin", "60vmin", "70vmin", "80vmin", "90vmin"],
        //initialize the 8x8 board
        initalize: function () {
            var countPieces = 0;
            var countTiles = 0;
            for (row in this.board) { //row is the index
                for (column in this.board[row]) { //column is the index
                    //whole set of if statements control where the tiles and pieces should be placed on the board
                    if (row % 2 == 1) {
                        if (column % 2 == 0) {
                            this.tilesElement.append("<div class='tile' id='tile" + countTiles + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
                            tiles[countTiles] = new Tile($("#tile" + countTiles), [parseInt(row), parseInt(column)]);
                            countTiles += 1;
                        }
                    } else {
                        if (column % 2 == 1) {
                            this.tilesElement.append("<div class='tile' id='tile" + countTiles + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
                            tiles[countTiles] = new Tile($("#tile" + countTiles), [parseInt(row), parseInt(column)]);
                            countTiles += 1;
                        }
                    }
                    if (this.board[row][column] == 1) {
                        $('.player1pieces').append("<div class='piece' id='" + countPieces + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
                        pieces[countPieces] = new Piece($("#" + countPieces), [parseInt(row), parseInt(column)]);
                        countPieces += 1;
                    } else if (this.board[row][column] == 2) {
                        $('.player2pieces').append("<div class='piece' id='" + countPieces + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
                        pieces[countPieces] = new Piece($("#" + countPieces), [parseInt(row), parseInt(column)]);
                        countPieces += 1;
                    }
                }
            }


        },
        //check if the location has an object
        isValidPlacetoMove: function (row, column) {
            if (this.board[row][column] == 0) {
                return true;
            } return false;
        },
        //change the active player - also changes div.turn's CSS
        changePlayerTurn: function () {
            if (this.playerTurn == 1) {
                $(".player2pieces").removeClass('selected');
                this.playerTurn = 2;
                $('.turn').css("background", "linear-gradient(to right, transparent 50%, #BEEE62 50%)");
                return;
            }
            if (this.playerTurn == 2) {
                $(".player1pieces").removeClass('selected');
                this.playerTurn = 1;
                $('.turn').css("background", "linear-gradient(to right, #BEEE62 50%, transparent 50%)");
            }
        },



        getWinner: function () {

            if (Game.totalScore1 == 12) {
                Game.winner = Game.player1Email;

            }
            else if (Game.totalScore2 == 12) {
                Game.winner = Game.player2Email;

            }
            if (Game.winner) {
                Game.status = "completed";
                return true;
            }
            else
                return false;

        },


        //reset the game
        pause: function () {
            //location.pause();
            setTimeout(function () {
                window.alert('The game has been paused');
            }, 1000);

        }
    }


    //initialize the board
    Board.initalize();

    /***
    Events
    ***/

    //select the piece on click if it is the player's turn
    $('.piece').on("click", function () {
        var selected;
        var isPlayersTurn = ($(this).parent().attr("class").split(' ')[0] == "player" + Board.playerTurn + "pieces");
        console.log('isplayerturn', isPlayersTurn);
        if (isPlayersTurn) {
            if (Board.playerTurn === App.playId) {
                console.log(`${App.pEmail} turn`);
                if ($(this).hasClass('selected')) selected = true;
                $('.piece').each(function (index) {
                    $('.piece').eq(index).removeClass('selected')
                });
                if (!selected) {
                    $(this).addClass('selected');
                }
                var pieceToCheck = pieces[$('.selected').attr("id")];
                if (!pieceToCheck.canMakeAnyMove()) {
                    window.alert('No Moves possible for selected piece.');
                }
            }


        }
    });

    //pause game when pause button is pressed
    $('#pausegame').on("click", function () {
        Board.pause();
        console.log('board has been reset...');
        //add emit
        socket.emit('paused', Board.gameBoard);


    });

    //move piece when tile is clicked
    $('.tile').on("click", function () {
        //make sure a piece is selected
        if ($('.selected').length != 0) {
            //find the tile object being clicked
            var tileID = $(this).attr("id").replace(/tile/, '');
            var tile = tiles[tileID];
            //find the piece being selected
            var piece = pieces[$('.selected').attr("id")];
            //check if the tile is in range from the object
            var inRange = tile.inRange(piece);
            if (inRange) {
                //if the move needed is jump, then move it but also check if another move can be made (double and triple jumps)
                if (inRange == 'jump') {
                    PlayerMove.jump = true;
                    if (piece.opponentJump(tile)) {

                        piece.move(tile);
                        if (piece.canJumpAny()) {
                            Board.changePlayerTurn(); //change back to original since another turn can be made
                            //piece.element.addClass('selected');
                        }
                    }
                    //if it's regular then move it if no jumping is available
                } else if (inRange == 'regular') {
                    PlayerMove.jump = false;
                    if (!piece.canJumpAny()) {
                        piece.move(tile);


                    } else {
                        alert("You must jump when possible!");
                    }

                }
                PlayerMove.roomId = App.gRoomId;
                PlayerMove.playerEmail = App.pEmail;
                PlayerMove.roundCount = App.roundCount++;
                socket.emit('moveTo', { PlayerMove });
            }
        }
    });

    function checkIfAnyMovesLeft() {
        for (var i = 0; i < pieces.length; i++) {

            var piece = pieces[i];
            if (piece.position != 0 && piece.player == App.playId) {
                console.log('piece position :', piece);
                if (piece.canMakeAnyMove()) {
                    return true;
                }
            }

        }
        return false;

    }


    socket.on('moved', (data) => {
        var src = data.move.PlayerMove.src;
        var dest = data.move.PlayerMove.dest;
        var jump = data.move.PlayerMove.jump;

        //src is a piece. So find the piece at that src
        var piece;
        for (var i = 0; i < pieces.length; i++) {
            var position = pieces[i].position
            if ((position[0] === src[0]) && (position[1] === src[1])) {
                piece = pieces[i];
            }
        }

        //destination is a tile. Identify dest tile 
        var tile;
        for (var i = 0; i < tiles.length; i++) {
            var position = tiles[i].position
            if ((position[0] === dest[0]) && (position[1] === dest[1])) {
                tile = tiles[i];
                //console.log(tile);
            }
        }

        //piece and tile will be available only in opponents board. So replicate the moves.
        if (piece && tile) {

            //check if that was a jump move
            if (jump === true) {
                //  console.log(piece, tile);
                var pieceToRemove = piece.canOpponentJump(tile.position);
                if (pieceToRemove) {
                    pieces[pieceIndex].remove();
                }

            }
            //move piece from src to destination
            Board.board[piece.position[0]][piece.position[1]] = 0;
            Board.board[tile.position[0]][tile.position[1]] = data.move.player;
            piece.position = [tile.position[0], tile.position[1]];
            //change the css using board's dictionary
            piece.element.css('top', Board.dictionary[piece.position[0]]);
            piece.element.css('left', Board.dictionary[piece.position[1]]);
            //if piece reaches the end of the row on opposite side crown it a king (can move all directions)
            if (!piece.king && (piece.position[0] == 0 || piece.position[0] == 7))
                piece.makeKing();
            //piece.makeKing();
            Board.changePlayerTurn();

            //check is more jumps are possible for the current user.
            if (jump === true) {
                if (piece.canJumpAny()) {
                    Board.changePlayerTurn(); //change back to original since another turn can be made
                }

            }

        }

        console.log('checking for winner....');
        if (Board.getWinner()) {
            if (Game.winner == App.pEmail) {
                socket.emit('end', { Game });
            }

            window.alert(`Game stat: winner : ${Game.winner}`);
            $("#gameHistory").prop('disabled', false);
            $("#moveGBtn").prop('disabled', false);
            $("#clearTables").prop('disabled', false);
        } else {
            console.log('winner check :', pieces);

            if (!checkIfAnyMovesLeft()) {
                if (Game.totalScore1 > Game.totalScore2) winPlayer = 1;
                else winPlayer = 2;

                if ((winPlayer == 1))
                    Game.winner = Game.player1Email;
                else if (winPlayer == 2)
                    Game.winner = Game.player2Email;

                if (Game.winner == App.pEmail) {
                    socket.emit('end', { Game });
                }

                window.alert(`Game stat: winner : ${Game.winner}`);
                $("#gameHistory").prop('disabled', false);
                $("#moveGBtn").prop('disabled', false);
                $("#clearTables").prop('disabled', false);
            } else
                console.log('Moves Left');

        }


    })

    socket.on('pause', (data) => {
        Board.pause();
        //add timeout
        //logout user

    })

    socket.on('currentGameMoves', (data) => {
        console.log(data);
        // show them in ui.
    })

});

