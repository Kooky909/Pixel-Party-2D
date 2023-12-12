// get the canvas
var ctx = document.getElementById("ctx").getContext("2d");

// connection data
var socket = io();
var connected = false;

// global constants
var Colors = ['black','red','orange','yellow','green','blue','purple','brown', 'pink', 'cyan', 'teal', 'magenta'];
var ColorImages = [];
var clientName = "";

for (var i = 0; i < 12; i++) {
   const temp = new Image(); // Create new img element
   temp.src = "client/img/" + Colors[i] + ".png"; // Set source path
   ColorImages[i] = temp;
}

var Characters = ['toucan','snake','doodle','steve','ghost'];
var CharacterImages = [];
var CharChoice;

for (var i = 0; i < 5; i++) {
   const temp = new Image(); // Create new img element
   temp.src = "client/img/" + Characters[i] + ".png"; // Set source path
   CharacterImages[i] = temp;
}

// document elements
var signDiv = document.getElementById('signDiv');
var gameDiv = document.getElementById('gameDiv');
var signDivUsername = document.getElementById('nameBox');
var signDivSignIn = document.getElementById('signDiv-signIn');

////////////////////////////
//
//     MUSIC STUFF
//
////////////////////////////

const audio = document.getElementById('Audio');
const songs = ['Never gonna give you up', 'Nyan Cat', 'Sandstorm', 'Vexento - Pixel Party'];


let songIndex = 0;        // Keep track of song
loadSong(songs[songIndex]);         // Initially load song details into DOM

// Update song details
function loadSong(song) {
  audio.src = `client/music/${song}.mp3`;
}

// Plays the audio
var PlayAudio = function() {
  //if (songIndex = 1) {
  document.getElementById(songIndex).play();
  //}
}

// Buttons to choose songs
var MyAudio = function() {
  songIndex = "Audio";
}

var MyAudio2 = function() {
  songIndex = "Audio1";
}

var MyAudio3 = function() {
  songIndex = "Audio2";
}

var MyAudio4 = function() {
  songIndex = "Audio3";
}

// Character Select Function
var CharChoice1 = function() {
  socket.emit('CharChoice', {imageNum:0});
}

var CharChoice2 = function() {
   socket.emit('CharChoice', {imageNum:1});
}

var CharChoice3 = function() {
  socket.emit('CharChoice', {imageNum:2});
}

var CharChoice4 = function() {
  socket.emit('CharChoice', {imageNum:3});
}

// Pause Audio
var PauseAudio = function() {
  document.getElementById(songIndex).pause();
}

// Play Countdown
var PlayCountdown = function() {
  document.getElementById("Countdown").play();
}

// Prev song
/*
var prevSong = function() {
  songIndex--;

  if (songIndex < 0) {
    songIndex = songs.length - 1;
  }
  loadSong(songs[songIndex]);
  PlayAudio();
}

// Next Song
var nextSong = function() {
  songIndex++;

  if (songIndex > songs.length - 1) {
    songIndex = 0;
  }
  loadSong(songs[songIndex]);
  PlayAudio();
}
*/

signDivSignIn.onclick = function() {
  // console.log(signDivUsername.value);
  clientName = signDivUsername.value;
  socket.emit('signIn', {username:signDivUsername.value});
}

// socket events
socket.on('signInResponse', function(data) {
  if(data.success) {
    signDiv.style.display = 'none';
    gameDiv.style.display = 'inline-block';
    connected = true;
  } else
      alert("sign in unsuccessful, username must be under 8 characters");
});


socket.on('PlayingAudio', function() {   // *****************
  PlayAudio();
});

socket.on('PausingAudio', function() {     // ****************
  PauseAudio();   
});

socket.on('CountdownAudio', function() {     // ****************
  PlayCountdown();   
});

socket.on('newPositions', function(data){
	ctx.clearRect(0,0,500,500);
   ctx.fillStyle = 'black';
   ctx.fillRect(0,0,500,500);

  // Print board and client
	for (var I = 0; I < data.length; I++) {
		var item = data[I];
    if (item.type === "board") {
      var board = item.board;
      var boardSize = board.length;
      var width = 500/boardSize;
      
    } else if(item.type === "player") {
      if (data[I].name == clientName) {
        var clientX = data[I].x;
        var clientY = data[I].y;
        var playerName = data[I].name;
        var character = data[I].character;

        // Print the board
        for (var i = 0; i < boardSize; i++) {
          for (var j = 0; j < boardSize; j++) {
            var x = (j * width) - clientX;
            var y = (i * width) - clientY;
            
            ctx.drawImage(ColorImages[board[i][j]], x*2 + 250, y*2 + 250, width*2, width*2);
          }
        }

        // Print the client
        ctx.drawImage(CharacterImages[character], 225, 225, 50, 50);
        ctx.font = "15px Georgia";
        ctx.fillStyle = 'black';
        ctx.fillRect(249, 249, 2, 2);
        ctx.fillText(playerName, /*clientX*/ 220, /*clientY*/ 290);
      }
    }
	}

  // Print all other players
  for (var I = 0; I < data.length; I++) {
    var item = data[I];
    if (item.type === "player") {
      if (data[I].name != clientName) {
        var playerX = 2*data[I].x - 2*clientX + 250/*width/2*/;
        var playerY = 2*data[I].y - 2*clientY + 250/*width/2*/;
        var playerChar = data[I].character;
        ctx.drawImage(CharacterImages[playerChar], playerX - 25, playerY - 25, 50, 50);
        ctx.font = "15px Georgia";
        ctx.fillStyle = 'black';
        ctx.fillText(data[I].name, playerX - 30, playerY + 40);
      }
    } 
  }
  for (var I = 0; I < data.length; I++) {
    var item = data[I];
    if (item.type === "timer") {
      for (var i = 0; i < 20; i++) {
         ctx.drawImage(ColorImages[item.target], 50*i, 0, width*2, width*2);
      }
      ctx.fillStyle = "#5F9EA0";
      ctx.fillRect(225, 0, 50, 50);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 10;
      ctx.strokeRect(225, 0, 50, 50);
      ctx.strokeRect(0, 0, 500, 50);
      ctx.lineWidth = 1;
      heavyPrint(item.time, 240, 35);
    } else if (item.type === "message") {
      ctx.fillStyle = "#5F9EA0";
      ctx.fillRect(50, 225, 400, 50);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 10;
      ctx.strokeRect(50, 225, 400, 50);
      ctx.lineWidth = 1;
      heavyPrint(item.text, 75, 262);
    }
  }
});

socket.on('newLobby', function(data){
   gameDiv.style.display = 'inline-block';
   lobbyDiv.style.display = 'inline-block';
   

  ctx.clearRect(0,0,500,500);
  heavyPrint("Player List:",20,30);
  var readyCount = 0;
  var playerCount = 0;
  for (var i in data) {
    if (data[i].type === "player") {
      var player = data[i];
      playerCount ++;
      if(player.ready) {
        ctx.fillStyle = "green";
        readyCount++;
      } else {
        ctx.fillStyle = "red";
      }
      ctx.font = "20px serif";
      ctx.fillText(player.name,30 + 100 * Math.floor((playerCount-1)/16), ((playerCount-1) * 25)%400 +70)
    } else if (data[i].type === "timer") {
      heavyPrint(data[i].timer, 450, 30);
    }
  }
  heavyPrint(readyCount + "/" + playerCount,180,30);
});

// player movements
document.onkeydown = function(event){
  if(!connected) {
    return;
  }
  if (event.code === 'ArrowRight')     // right arrow
    socket.emit('keyPress', {inputId: 'right', state: true});
  else if (event.code === 'ArrowLeft')     // left arrow
    socket.emit('keyPress', {inputId: 'left', state: true});
  else if (event.key === 'ArrowUp')     // up arrow
    socket.emit('keyPress', {inputId: 'up', state: true});
  else if (event.key === 'ArrowDown')     // down arrow
    socket.emit('keyPress', {inputId: 'down', state: true});
  else if (event.key === 'r')     // r
    socket.emit('keyPress', {inputId: 'ready'});
};

document.onkeyup = function(event){
  if(!connected) {
    return;
  }
  if (event.key === 'ArrowRight')     // right arrow
    socket.emit('keyPress', {inputId: 'right', state: false});
  else if (event.key === 'ArrowLeft')     // left arrow
    socket.emit('keyPress', {inputId: 'left', state: false});
  else if (event.key === 'ArrowUp')     // up arrow
    socket.emit('keyPress', {inputId: 'up', state: false});
  else if (event.key === 'ArrowDown')     // down arrow
    socket.emit('keyPress', {inputId: 'down', state: false});

};

// utility functions
var heavyPrint = function(text, x, y) {
  ctx.font = "32px serif";
  ctx.fillStyle = "black";
  ctx.fillText(text, x, y);
}
// global variable on the client side, print everything at 2X size so only some of it fits, the rest will try to print but not actually.*/
