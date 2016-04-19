var express = require('express');
var app = express();
var crypto = require('crypto');
var model = require('./models/json');
var admin = require('./admin');

app.use(express.static('public'));


var io = require('socket.io').listen(app.listen(3000, function () {
  console.log('App listening on port 3000!');
}));


var database={};
var session=[];

database.projects = new model({file:'./data/projects',index:['id']});
database.projects.init();

database.structure = new model({file:'./data/structure',index:['id']});
database.structure.init();

database.floor = new model({file:'./data/floor',index:['id']});
database.floor.init();

database.devices = new model({file:'./data/devices',index:['id']});
database.devices.init();

database.langs = new model({file:'./data/langs',index:['label']});
database.langs.init();


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
    
    var cookies=parseCookies(socket.handshake.headers.cookie);

    if (typeof(cookies.sessid)!='undefined') {
        var hash=cookies.sessid;
    } else {
        var hash=md5(Math.random()+'_'+Date.now());
        socket.emit('cookie','sessid',hash);
    }
  
    if (typeof(session[hash])=='undefined') {
        session[hash]={};
    }
    
    session[hash].socket=socket;
    
    socket.on('disconnect',function() {
        console.log('Bye client ',hash);
        if (typeof(session[hash])!='undefined') {
            session[hash].socket=null;
        }
    });
              
        
        
    console.log('Hello new client',hash); 
    admin(socket,session,hash,database,'./public');  
  

});


