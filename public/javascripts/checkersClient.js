const socket = io('https://localhost:3000');
var App = {
    gRoomId: 0,
    pEmail: "",
    pName: "",
    mySocketId: 0,
    numPlayersInRoom: 0,
    roundCount: 0,
    currCountry: 0,
    totalScore: 0,
};


socket.on('newGameRoomCreated', function (data) {
    App.gRoomId = data.gRoomId;
    App.mySocketId = data.mySocketId;
    App.numPlayersInRoom = data.numPlayersInRoom;
    App.points = 0;
    console.log('GameRoom created with Id: ' + App.gRoomId + ' and socketId: ' + App.mySocketId + ' with ' + App.numPlayersInRoom + ' Players');
    $("#createGRBtn").attr("disabled", "disabled");
    $(".waitMsg").show();
    //$("#startPlayBtn").removeAttr("disabled");


});


socket.on('gameRoomList', (GameRooms) => {

    for (var i in GameRooms) {
        if (GameRooms[i] < 2) {
            console.log(i + " has " + GameRooms[i] + " player(s)");
            $("<input type='radio' name='radiobtn' value=" + i + ">" + i + "</input><br/>").appendTo("#roomList");
        }
    }
    console.log(GameRooms);
    const rooms = jQuery.isEmptyObject(GameRooms);
    if (!rooms) {

        $("#joinGRBtn").prop('disabled', false);
        $("#createGRBtn").prop('disabled', true);
    }


});
/*
on joining emit start play to both players. so this not required.
socket.on('joinedRoom', (roomInfo) => {

    $("#joinGRBtn").removeAttr("disabled");
    
});*/

socket.on('startCheckers',(roomInfo) => {
    console.log(roomInfo);
    $("#startPlayBtn").removeAttr("disabled");
    $(".waitMsg").hide();
    $(".playerJoinedMsg").show();
    $(".joinRoomMsg").show();

});
socket.on('message', (data) => {
    console.log('from client:', data);
    socket.emit('received', data);
});

//functions

function createGRoom() {
    socket.emit('createGameRoom', { email: App.pEmail });
    console.log('emitted createGameRoom');

}
function joinRoom() {
    var gRoomId = $("input[type='radio'][name='radiobtn']:checked").val();
    App.gRoomId = gRoomId;
    console.log('->value now: ' + App.gRoomId);
    var content = { 'gRoomId': App.gRoomId, 'email': App.pEmail };
    console.log("Value of gRoodId:  " + gRoomId);
    socket.emit('joinGameRoom', content);
    $(".joinRoomMsg").hide();
    $("#roomList").hide();
    console.log('GRoomId sent to Join: ' + $("input:radio:checked").val());
}
function checkGameRoomStatus() {
    socket.emit('getGameRooms');
    console.log('get the list of game rooms from server');
}
function startCheckers(){
    console.log('start checkers...');
    //to do 
    //game logic
}

$(function () {
    $("#joinGRBtn").attr("disabled", "disabled");
    $("#resumeGBtn").attr("disabled", "disabled");
    $("#startPlayBtn").attr("disabled", "disabled");

    checkGameRoomStatus();

    $("#createGRBtn").one('click', function () {
        createGRoom();
    });
    $("#joinGRBtn").one('click', function () {
        joinRoom();
    });
    $("#startPlayBtn").one('click',() =>{
        startCheckers();
    });

    App.pEmail = $("#sEmail").text();
    console.log('Created global email variable: ' + App.pEmail);

    App.pName = $("#sName").text();
    console.log('Created global name variable: ' + App.pName);
});


