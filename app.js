var express = require('express');
var app = express();
var crypto = require('crypto');
var admin = require('./admin');
var fs = require('fs');

var ini = require('./ini.default.js');

try {
    fs.lstatSync('./ini.js');
    var ini2 = require('./ini.js');
    for (var k in ini2) ini[k]=ini2[k];
        
} catch(e) {
    console.log('File ini.js missing!');
}



var port=ini.port;
if (process.argv[2]!==undefined) port=parseInt(process.argv[2]);

var database={};
var session=[];
var models={};

for (var k in ini.database) {
 
    if (models[ini.database[k].model]===undefined) {
      models[ini.database[k].model] = require('./models/'+ini.database[k].model);
    }

    database[k] = new models[ini.database[k].model]( ini.database[k] );
}








/*


database.projects = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'projects2',index:['id']});
database.structure = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'structure',index:['id']});
database.floor = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'floor',index:['id']});
database.devices = new mysqlm({host:'173.194.250.90',user:'cb',password:'cb',database:'cb',table:'devices',index:['id']});

*/




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


var initApp = function() {
    for(var k in database) {
        if (!database[k].inited()) {
            database[k].init(initApp);
            return;
        } 
      
    }
    
    console.log('Database initialized!');


    app.use(express.static('public'));
    
    
    var io = require('socket.io').listen(app.listen(port, function () {
        console.log('App listening on port',port);
    }));
    
    
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

        
}

initApp();




