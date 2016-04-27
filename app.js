var express = require('express');
var app = express();
var crypto = require('crypto');
var jsonm = require('./models/json');
var admin = require('./admin');
var mysqlm = require('./models/mysql');

var port=3000;


if (process.argv[2]!==undefined) port=parseInt(process.argv[2]);


app.use(express.static('public'));


var io = require('socket.io').listen(app.listen(port, function () {
  console.log('App listening on port',port);
}));


var database={};
var session=[];


database.projects = new jsonm({file:'./data/projects',index:['id']});
database.structure = new jsonm({file:'./data/structure',index:['id']});
database.floor = new jsonm({file:'./data/floor',index:['id']});
database.devices = new jsonm({file:'./data/devices',index:['id']});

/*


database.projects = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'projects2',index:['id']});
database.structure = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'structure',index:['id']});
database.floor = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'floor',index:['id']});
database.devices = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'devices',index:['id']});

*/

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


