var express = require('express');
var app = express();
var crypto = require('crypto');
var jsonm = require('./models/json');
var admin = require('./admin');
var mysqlm = require('./models/mysql');



app.use(express.static('public'));


var io = require('socket.io').listen(app.listen(3000, function () {
  console.log('App listening on port 3000!');
}));


var database={};
var session=[];

/*
database.projects = new model({file:'./data/projects',index:['id']});
database.structure = new model({file:'./data/structure',index:['id']});
database.floor = new model({file:'./data/floor',index:['id']});
database.devices = new model({file:'./data/devices',index:['id']});

*/


database.projects = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'projects2',index:['id']});
database.structure = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'structure',index:['id']});
database.floor = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'floor',index:['id']});
database.devices = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'devices',index:['id']});

database.langs = new jsonm({file:'./data/langs',index:['label']});

database.projects.init(function(){
  database.structure.init();
  database.floor.init();
  database.devices.init();
});

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


