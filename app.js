var express = require('express');
var app = express();
var crypto = require('crypto');
var model = require('./jsonmodel');
var fs = require('fs');

app.use(express.static('public'));

var images='images';
var images_path='./public';


var io = require('socket.io').listen(app.listen(3000, function () {
  console.log('App listening on port 3000!');
}));


var database={};
var session=[];

database.projects = new model('./data/projects',['id']);
database.projects.init();



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
    
  var wallProjects = function () {
    if (hash.length>1) socket.emit('projects-all',database.projects.getAll());
  }
  
  
  if (typeof(cookies.sessid)!='undefined')
    if (typeof(session[cookies.sessid])!='undefined')
      hash=cookies.sessid;
      
  console.log('Hello new client',hash); 
      
  if (hash.length>1) {
    socket.emit('login',session[hash]);
    wallProjects();
    if (typeof(session[hash].project)!='undefined') {
        socket.emit('projects',database.projects.get(session[hash].project));
    }
  } else {
    socket.emit('logout');
  }
  
  
  socket.on('disconnect',function() {
    console.log('Bye client');
  });
  
  socket.on('login',function (data) {
    
    if (data.username==data.password) {
      hash=md5(data.username + new Date());
      session[hash]=data;
      socket.emit('cookie','sessid',hash);
      socket.emit('login',data);
      
      
      wallProjects();
            
    } else {
      socket.emit('err','Login error',"Username or password doesn't match");
    }
    
  });
  
  socket.on('logout',function() {

    if (typeof(session[hash])) {
      delete(session[hash]);
      socket.emit('logout');
    }
    hash='#';
  });
  
  
  socket.on('db-save',function(db,d) {
    if (hash.length<=1) return;
    if (typeof(database[db])=='undefined') return;
    if (typeof(d.id)=='undefined') return;
    
    var img_blob=null;
    if (typeof(d.img)!='undefined' && d.img.length>0 && d.img.substr(0,11)=='data:image/') {
        var img=d.img.substr(11);
        var semicolon=img.indexOf(';');
        var img_ext=img.substr(0,semicolon);
        img=img.substr(semicolon+1);
        
        if (img.substr(0,7)=='base64,') {
          var img_blob=new Buffer(img.substr(7),'base64');
        }
       
        d.img='';
    }
    
    if (parseInt(d.id)==0) {
      delete(d.id);
      d=database[db].add(d);
    } else {
      d=database[db].set(d);
    }
    
    if (img_blob!=null) {
      d.img=images+'/'+db+'-'+d.id+'.'+img_ext;
      fs.writeFile(images_path+'/'+d.img,img_blob);
      console.log(d,images_path+'/'+d.img);
      d=database[db].set(d);
    }
    socket.emit(db,d);
    if (db=='projects') wallProjects();
    
  });
  
  
  socket.on('db-get',function(db,idx){
    
    if (hash.length<=1) return;
    if (typeof(database[db])=='undefined') return;
    
    var ret=database[db].get(idx);
    
    if (typeof(ret)=='object') {
      
      socket.emit(db,ret);
      if (db=='projects') session[hash].project=idx;
    }
  });
});


