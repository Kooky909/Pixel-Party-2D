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

const toucan = new Image(); // Create new img element
toucan.src = "client/img/toucan.png"; // Set source path

// doccument elements
var signDiv = document.getElementById('signDiv');
var gameDiv = document.getElementById('gameDiv');
var signDivUsername = document.getElementById('nameBox');
var signDivSignIn = document.getElementById('signDiv-signIn');

const audio = document.getElementById('Audio');
const songs = ['Never gonna give you up', 'Nyan Cat', 'Sandstorm', 'Vexento - Pixel Party'];

// Keep track of song
let songIndex = 0;

// Initially load song details into DOM
loadSong(songs[songIndex]);

// Update song details
function loadSong(song) {
  audio.src = `client/music/${song}.mp3`;
}
// Play Audio
var MyAudio = function() {
  document.getElementById("Audio").play();
}
// Pause Audio
var PauseAudio = function() {
  document.getElementById("Audio").pause();
}
// Prev song
var prevSong = function() {
  songIndex--;

  if (songIndex < 0) {
    songIndex = songs.length - 1;
  }

  loadSong(songs[songIndex]);

  MyAudio();
}
// Next Song
var nextSong = function() {
  songIndex++;

  if (songIndex > songs.length - 1) {
    songIndex = 0;
  }

  loadSong(songs[songIndex]);

  MyAudio();
}

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
      alert("sign in unsuccessful");
});

socket.on('newPositions', function(data){
   lobbyDiv.style.display = 'none';
   //gameDiv.style.display = 'inline-block';
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

        // Print the board
        for (var i = 0; i < boardSize; i++) {
          for (var j = 0; j < boardSize; j++) {
            var x = (j * width) - clientX;
            var y = (i * width) - clientY;
            
            ctx.drawImage(ColorImages[board[i][j]], x*2 + 250, y*2 + 250, width*2, width*2);
          }
        }

        // Print the client
        ctx.fillStyle = 'black';
        ctx.fillRect(249, 249, 2, 2);
        ctx.fillText(playerName, /*clientX*/ 250, /*clientY*/ 250);
        //ctx.drawImage(toucan, 250, 250, 30, 30);
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
        //var playerName = data[I].name;
        ctx.fillStyle = 'black';
        ctx.fillText(data[I].name, playerX, playerY);
      }
    } 
  }
  for (var I = 0; I < data.length; I++) {
    var item = data[I];
    if (item.type === "timer") {
      for (var i = 0; i < 20; i++) {
         ctx.drawImage(ColorImages[item.target], 50*i, 0, width*2, width*2);
      }
      //ctx.fillStyle = Colors[item.target];
      //ctx.fillRect(0, 0, 500, 50);
      ctx.fillStyle = "#5F9EA0";
      ctx.fillRect(225, 0, 50, 50);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 10;
      ctx.strokeRect(225, 0, 50, 50);
      ctx.strokeRect(0, 0, 500, 50);
      ctx.lineWidth = 1;
      heavyPrint(item.time, 240, 35);
    }
  }
});

socket.on('newLobby', function(data){
   lobbyDiv.style.display = 'inline-block';
   gameDiv.style.display = 'inline-block';


  ctx.clearRect(0,0,500,500);
  heavyPrint("Player List:",20,30);
  var readyCount = 0;
  for (var i in data) {
    if (data[i].type === "player") {
      var player = data[i];
      if(player.ready) {
        ctx.fillStyle = "green";
        readyCount++;
      } else {
        ctx.fillStyle = "red";
      }
      ctx.font = "20px serif";
      ctx.fillText(player.name,30 + 100 * Math.floor(i/16), (i * 25)%400 +70)
    } else if (data[i].type === "timer") {
      heavyPrint(data[i].timer, 450, 30);
    }
  }
  heavyPrint(readyCount + "/" + data.length,180,30);
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
