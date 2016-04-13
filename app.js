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

database.structure = new model('./data/structure',['id']);
database.structure.init();


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


  var wallStructure =function (project) {
    //if (hash.length==1) return;
    
    var structure=database.structure.select([{project:project,parent:null}],['pri','name']);
    
    var name=database.projects.get(project).name;
    
    for (var i=0; i<structure.data.length; i++) {
      
      structure.data[i].parent=null;
      structure.data[i].desc=name;
      structure.data[i]._new=false;
      if (typeof(structure.data[i]._created)!='undefined' && structure.data[i]._created+30*60*1000>new Date().getTime()) {
        structure.data[i]._new=true;
      }

      var sub=database.structure.select([{project:project,parent:structure.data[i].id}],['pri','name']);
   
      for (var j=0; j<sub.data.length; j++) {
        sub.data[j]._new=false;
        sub.data[j].desc=structure.data[i].name;
  
        if (typeof(sub.data[j]._created)!='undefined' && sub.data[j]._created+30*60*1000>new Date().getTime()) {
          sub.data[j]._new=true;
        }        
      }
      structure.data[i]._sub=false;
      if (sub.data.length>0) {
        structure.data[i]._sub=sub.data;
      }
      
    }
    
    socket.emit('structure',structure);
  }
  
  
  var wallProjects = function () {
    if (hash.length>1) {
      for (var h in session) {    
        if (typeof(session[h].socket)!='undefined' && session[h].socket!=null) {
          session[h].socket.emit('projects-all',database.projects.select(null,['name']));
        }
      }
    }
  }
  
  
  if (typeof(cookies.sessid)!='undefined')
    if (typeof(session[cookies.sessid])!='undefined') {
      hash=cookies.sessid;
      session[hash].socket=socket;
    }
      
  console.log('Hello new client',hash); 
      
  if (hash.length>1) {
    socket.emit('login',{username:session[hash].username});
    wallProjects();
    if (typeof(session[hash].project)!='undefined') {
        socket.emit('projects',database.projects.get(session[hash].project));
    }
  } else {
    socket.emit('logout');
  }
  
  
  socket.on('disconnect',function() {
    console.log('Bye client');
    if (typeof(session[hash])!='undefined') {
        session[hash].socket=null;
    }
  });
  
  socket.on('login',function (data) {
    
    if (data.username==data.password) {
      hash=md5(data.username + new Date());
      
      session[hash]={username:data.username, socket: socket};
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
    if (typeof(d.id)=='undefined') d.id=0;
    
    
    
    if (db=='structure' && parseInt(d.id)==0) {
      d.project=session[hash].project;
      d.pri=database[db].max('pri',[{project: d.project}])+1;
    }
    
    
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
    
    d._updated=new Date().getTime();
    if (parseInt(d.id)==0) {
      delete(d.id);
      d._created=d._updated;
      d=database[db].add(d);
    } else {
      d=database[db].set(d);
    }
    
    if (img_blob!=null) {
      d.img=images+'/'+db+'-'+d.id+'.'+img_ext;
      fs.writeFile(images_path+'/'+d.img,img_blob);
      d=database[db].set(d);
    }
    socket.emit(db,d);
    if (db=='projects') wallProjects();
    if (db=='structure') wallStructure(session[hash].project);
  });
  
  
  socket.on('db-get',function(db,idx){
    
    if (hash.length<=1) return;
    if (typeof(database[db])=='undefined') return;
    
    var ret=database[db].get(idx);
    
    if (typeof(ret)=='object' && ret!=null) {
    
      socket.emit(db,ret);
      if (db=='projects') {
        session[hash].project=idx;
        wallStructure(idx);

      }
    }
  });
});


