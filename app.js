var express = require('express');
var app = express();
var crypto = require('crypto');
var model = require('./jsonmodel');

app.use(express.static('public'));


var io = require('socket.io').listen(app.listen(3000, function () {
  console.log('App listening on port 3000!');
}));


var data={};
var session=[];

data.projects = new model('./data/projects',['id']);
data.projects.init();



function parseCookies (rc) {
    var list = {};

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

function md5(txt) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(txt);
  return md5sum.digest('hex');
}



io.sockets.on('connection', function (socket) {
  var hash='#';
  var cookies=parseCookies(socket.handshake.headers.cookie);
    
  console.log('Hello new client',session);
  
  if (typeof(cookies.sessid)!='undefined')
    if (typeof(session[cookies.sessid])!='undefined')
      hash=cookies.sessid;
      
  if (hash.length>1) {
    socket.emit('login',session[hash]);
  } else {
    socket.emit('logout');
  }
  
  
  socket.on('disconnect',function() {
    console.log('Bye client');
  });
  
  socket.on('login',function (data) {
    
    hash=md5(data.username + new Date());
    
    if (data.username==data.password) {
      session[hash]=data;
      socket.emit('cookie','sessid',hash);
      socket.emit('login',data);
            
    } else {
      socket.emit('err','Login error',"Username or password doesn't match");
    }
    
  });
  
  socket.on('logout',function() {
    
    if (typeof(session[hash])) {
      delete(session[hash]);
      socket.emit('logout');
    }
  });
  
});


