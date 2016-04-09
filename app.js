var express = require('express');
var app = express();

app.use(express.static('public'));


var io = require('socket.io').listen(app.listen(3000, function () {
  console.log('App listening on port 3000!');
}));

var sockets=[];

io.sockets.on('connection', function (socket) {
  console.log('Hello new client');
  
  setTimeout(function() {
    socket.emit('message', { message: 'welcome my old friend' });
  },2000);
  
  socket.on('disconnect',function() {
    console.log('Bye client');
    
  });
});


