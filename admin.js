var fs = require('fs');

var images='images';
var images_path='./public';


var Admin = function(socket,session,hash,database) {
    var loggedIn=false;

 
    var wallStructure = function (project,all) {
        if (!loggedIn) return;
        
        if (all==null) all=false;
        
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
        
        
        if (!all) socket.emit('structure-all',structure);
        else {
            for (var h in session) {    
                if (typeof(session[h].socket)!='undefined' && session[h].socket!=null && typeof(session[h].project)!='undefined' && session[h].project==project) {
                  session[h].socket.emit('structure-all',structure);
                }
            }      
        }
    }
    
    
    var wallProjects = function (all) {
        if (all==null) all=false;
        
        
        if (loggedIn) {
  
            var projects=database.projects.select(null,['name']);
            if (all) {
                for (var h in session) {    
                    if (typeof(session[h].socket)!='undefined' && session[h].socket!=null) {
                        session[h].socket.emit('projects-all',projects);
                    }
                }
            } else {
                socket.emit('projects-all',projects);
            }
        }
    }
    
    var wallDevices = function () {
        if (loggedIn) {
            for (var h in session) {    
                if (typeof(session[h].socket)!='undefined' && session[h].socket!=null) {
                  session[h].socket.emit('devices-all',database.devices.getAll());
                }
            }
        }
    }
    
    var wallFloor = function (floor) {
        if (loggedIn) {
            for (var h in session) {    
                if (typeof(session[h].socket)!='undefined' && session[h].socket!=null && typeof(session[h].floor)!='undefined' && session[h].floor==floor) {
                  session[h].socket.emit('floor-select',database.floor.select([{floor:floor}]));
                }
            }
        }
    }

    
    socket.on('login',function (data) {
      
        if (data.username.length && data.username==data.password) {
            loggedIn=true;
            session[hash].username=data.username;
            socket.emit('login',data);
            wallProjects();
              
        } else {
            loggedIn=false;
            socket.emit('err','Login error',"Username or password doesn't match");
        }
      
    });
    
    socket.on('logout',function() {
        session[hash].username=null;
        loggedIn=false;
        socket.emit('logout');
    });
    
    
    socket.on('db-save',function(db,d) {
        if (!loggedIn) return;
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
            img_ext=img_ext.replace('svg+xml','svg');
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
        if (db=='projects') {
            session[hash].project=d.id;
            wallProjects();
        }
        if (db=='structure') wallStructure(session[hash].project,true);
        if (db=='devices') wallDevices();
        if (db=='floor' && typeof(d.floor)!='undefined') wallFloor(d.floor);
    });
    
    socket.on('db-remove',function(db,idx){
        if (!loggedIn) return;
        
        if (typeof(database[db])=='undefined') return;
        
        if (db=='floor') {
          var floor=database[db].get(idx);
        }
        
        database[db].remove(idx);
    
        if (db=='projects') wallProjects(true);
        if (db=='structure') wallStructure(session[hash].project);
        if (db=='devices') wallDevices();    
        if (db=='floor') wallFloor(floor.floor);
    });
    
    socket.on('db-select',function(db,where,order) {
        if (!loggedIn) return;
        if (typeof(database[db])=='undefined') return;
        var ret=database[db].select(where,order);            
        socket.emit(db+'-select',ret);
    });
    
    socket.on('db-get',function(db,idx){
        if (!loggedIn) return;
        if (typeof(database[db])=='undefined') return;
        
        if (idx==null) {
            var ret=database[db].getAll();
        } else {
            var ret=database[db].get(idx);
        }
        
        if (typeof(ret)=='object' && ret!=null) {
        
            if (idx==null) {
                socket.emit(db+'-all',ret);
            } else {
                socket.emit(db,ret);
            }
            if (db=='projects') {
                session[hash].project=idx;
                wallStructure(idx);
            }
            if (db=='structure') {
                session[hash].floor=idx;
            }
    
        }
    });
    
    //INIT STATE

    if (typeof(session[hash].username)!='undefined' && session[hash].username!=null) {
        loggedIn=true;
        socket.emit('login',{username:session[hash].username});
        wallProjects();
        if (typeof(session[hash].project)!='undefined') {
            socket.emit('projects',database.projects.get(session[hash].project));
            wallStructure(session[hash].project);
        }
    } else {
        socket.emit('logout');
    }
    
}



module.exports = Admin;