// app.js = index.js
var express = require('express');
var app = express();
var serv = require('http').Server(app);  // create server

// if the query starts with nothing, send the index.html file
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
// if the query starts with client, send file request ?
app.use('/client',express.static(__dirname + '/client'));

serv.listen(3000);  // tell server to listen to port 3000
console.log('server started.');

// global lists
var SOCKET_LIST = {};
var PLAYER_LIST = {};

// global constants (settings)
var COLOR_COUNT = 12;
var BOARD_SIZE = 20;

// global OBJECTS and Variables
var GAME_STATE = "lobby";
var GAME_PHASE = "waiting"; // waiting, active, ending
var GameBoard = [];
var TIMER = 0;
var TargetColor = 0;
var RoundCount = 0;
var PlayersAlive = 0;
var EndingMessage = "";
GameOverFlag = false;

// constructors (objects)
var Player = function(id, name) {
  var self = {
    x:100 + Math.floor(Math.random() * 400),
    y:100 + Math.floor(Math.random() * 400),
    id:id,
    name:name,
    character:1,
    ready:false,
    rightArrow:false,   // Pressing arrow keys
    leftArrow:false,
    upArrow:false,
    downArrow:false,
    alive:(GAME_STATE === "lobby")
  }
  return self;
}

var Board = function() {
  var self = [];
  var totalTiles = BOARD_SIZE*BOARD_SIZE;
  for (var i = 0; i < totalTiles; i++) {
    self.push(Math.floor(i * COLOR_COUNT/totalTiles))
  }
  self = shuffle(self)
  return self;
}

// functions
var shuffle = function(inList) {
  var outList = inList;
  for (var i in outList){
    var target = Math.floor(Math.random()*outList.length);
    if (target != i) {
      var temp = outList[i];
      outList[i] = outList[target];
      outList[target] = temp;
    }
  } 
  var out2dList = [];
  for (var i = 0; i < BOARD_SIZE; i++) {
    out2dList.push(outList.slice(i*BOARD_SIZE, (i+1)*BOARD_SIZE))
  }
  return out2dList;
}

var initialize = function() {
  if (GameBoard.length == 0) {
    GameBoard = Board();
  }
}

var checkSuccess = function(player) {
  // ignore already dead players
  if (!player.alive) {
    return true;
  }

  // determine player tile
  var x = Math.floor(player.x/25);
  var y = Math.floor(player.y/25);

  // if player on wrong color tile
  return GameBoard[y][x] == TargetColor;
} 

var startGame = function() {
  GAME_STATE = "running";
  GAME_PHASE = "waiting";
  RoundCount = 0;
  PlayersAlive = playerCount;
  GameOverFlag = false;
}

var updatePlayers = function() {
  if (GAME_PHASE != "active") {
    return;
  }
  var speed = 1 * (1.1**RoundCount);
  for (var i in PLAYER_LIST) {
    var player = PLAYER_LIST[i];

    if (!player.alive) {
      continue;
    }
    
    if(player.rightArrow && player.x + speed <= 495)
        player.x += speed;
    if(player.leftArrow && player.x - speed >= 5)
        player.x -= speed;
    if(player.upArrow && player.y - speed >= 5)
        player.y -= speed;
    if(player.downArrow && player.y + speed <= 495)
        player.y += speed;

    PLAYER_LIST[i] = player;
  }
}

var resetPlayers = function() {
  for(var i in PLAYER_LIST) {
    var player = PLAYER_LIST[i];
    player.alive = true;
    player.ready = false;
    player.x = 100 + Math.floor(Math.random() * 400);
    player.y = 100 + Math.floor(Math.random() * 400);
    PLAYER_LIST[i] = player;
  }
}

var count = function() {
  TIMER += 40/1000;
}

// allows us to use socket.io -- socket connection
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket) {
	socket.id = Math.random();  // assign a unique id to the client socket
  SOCKET_LIST[socket.id] = socket;  // add to socket list

  // if client emits "signIn", do this function
  // data is the extra data from the client emit call
  socket.on('signIn',function(data) {
    console.log("Sign in recieved");
    if (data.username.length <= 8) {
      var player = Player(socket.id, data.username);
      PLAYER_LIST[socket.id] = player;
      socket.emit('signInResponse', {success:true});
    } else {
       socket.emit('signInResponse', {success:false});
    }
  });
  
  //console.log("New connection: " + socket.number);
  socket.on('disconnect',function() {
		//console.log("Disconnect: " +   PLAYER_LIST[socket.id].number);
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
	});

  socket.on('keyPress',function(data) {
    var player = PLAYER_LIST[socket.id];
    if(data.inputId === 'right')
      player.rightArrow = data.state;
    else if(data.inputId === 'left')
      player.leftArrow = data.state;
    else if(data.inputId === 'up')
      player.upArrow = data.state;
    else if(data.inputId === 'down')
      player.downArrow = data.state;
    else if(data.inputId === 'ready') {
      player.ready = !(player.ready);
    }
    PLAYER_LIST[socket.id] = player;
  });
  

  socket.on('CharChoice', function(data) {
    var player = PLAYER_LIST[socket.id];
    player.character = data.imageNum;
    PLAYER_LIST[socket.id] = player;
  });
  
  
});


// loop! -- is the clock
setInterval (function() {
  if (GAME_STATE === "running"){
  	var pack = []; // data to be sent to clients
    var timeAdjust = 3; // how long the current phase timer is

    // store players that die this round
    // failsafe if everyone dies, they can be brought back
    var newDead = [];

    initialize();
    updatePlayers();

    if (GAME_PHASE === "waiting") {
       
      // loop through the client sockets
      for(var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('PausingAudio');  // ***************
        socket.emit('CountdownAudio');
      } 
       
      var old_time = TIMER;
      count();

      // if a full second has passed, shuffle the board
      if (Math.ceil(TIMER) > Math.ceil(old_time)) {
        GameBoard = Board();
      }

      // waiting phase done
      // timer initialized for active phase
      if (TIMER >= 3){
        TIMER = 5 - (5*(0.95**RoundCount));
        GAME_PHASE = "active";
        TargetColor = Math.floor(Math.random() * COLOR_COUNT);
      }
    } else if (GAME_PHASE === "active") {
       
      // loop through the client sockets
      for(var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('PlayingAudio');   // *******************
      }
 
      count();
      timeAdjust = 5;

      // if active phase over
      if (TIMER >= timeAdjust) {
        // check each player
        for (var i in PLAYER_LIST) {
          var player = PLAYER_LIST[i];

          // if player on wrong color tile
          if(!checkSuccess(player)) {
            player.alive = false;
            player.character = 4; // ghost
            PLAYER_LIST[i] = player;
            newDead.push(i);
          }
        }

        // active phase over
        GAME_PHASE = "ending";
        TIMER = 0;
        TargetColor = 0;
        RoundCount++;

        // check if game is over
        if(PlayersAlive - newDead.length > 1) {
          // multiple players alive
          EndingMessage = "";
          PlayersAlive -= newDead.length;
        } else if (PlayersAlive - newDead.length < 1) {
          // everyone died
          EndingMessage = "Everyone Died, Try Again"
          RoundCount --;

          // revive players who died this round
          for (var i in newDead) {
            var player = PLAYER_LIST[newDead[i]];
            player.alive = true;
            PLAYER_LIST[newDead[i]] = player;
          }
        } else {
          // someone won
          for (var i in PLAYER_LIST) {
            if(PLAYER_LIST[i].alive) {
              EndingMessage = "Winner: " + PLAYER_LIST[i].name;
              GameOverFlag = true;
              break;
            }
          }
        }
        
      }
    // end active phase
    } else if (GAME_PHASE === "ending") {
      // loop through the client sockets
      for(var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('PausingAudio');  // ***************
      } 

      // send ending message if there is one
      if(EndingMessage != ""){
        pack.push({
          type:"message",
          text:EndingMessage
        });
      }

      count();
      timeAdjust = 5;

      // ending phase over
      if (TIMER >= 5) {
        EndingMessage = "";
        TIMER = 0;
        if(GameOverFlag){
          // if game over, return to lobby
          resetPlayers();
          GAME_STATE = "lobby";
        } else {
          // next round
          GAME_PHASE = "waiting";
        }
      }
    }
    
    // send board and timer
    pack.push({
      type:"board",
      board:GameBoard
    });
    pack.push({
      type:"timer",
      time:Math.ceil(timeAdjust - TIMER),
      target:TargetColor
    });

    // send player data
  	for(var i in PLAYER_LIST) {
  		var player = PLAYER_LIST[i];
  		pack.push({
  			type:"player",
        x:player.x,
  			y:player.y,
        character:player.character,
  			name:player.name,
        alive:player.alive
  		});
  	}

    // loop through the client sockets
  	for(var i in SOCKET_LIST) {
  		// send packets
      var socket = SOCKET_LIST[i];
  		socket.emit('newPositions', pack);  // client.js picks up call
  	}
  // end running
  } else if (GAME_STATE === "lobby") {
    var pack = [];
    var readyCount = 0;
    var playerCount = 0;

    // count ready players
    for (var i in PLAYER_LIST) {
      playerCount++;
      var player = PLAYER_LIST[i]
      if(player.ready) {
        readyCount++;
      }
      // send player data
      pack.push({
        type:"player",
        name:player.name,
        ready:player.ready
      });
    }

    // if all players ready and at least 2 are connected
    if (readyCount == playerCount && playerCount >= 2) {
      // waits 5 seconds
      if (TIMER >= 5) {
        // initialize game variables
        for (var i in PLAYER_LIST) {
          PLAYER_LIST[i].alive = true;
        }
        startGame();
        TIMER = 0;
      } else {
        count();
      }
      pack.push({
        type:"timer",
        timer:Math.ceil(5 - TIMER)
      });
    } else {
      // reset timer if someone unreadies
      TIMER = 0;
    }
    
    // loop through the client sockets
    for(var i in SOCKET_LIST) {
      // send packet
      var socket = SOCKET_LIST[i];
      socket.emit('newLobby', pack);  // client.js picks up call
    }
  } // end lobby
}, 1000/40);