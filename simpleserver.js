
module.exports = function(socket,session) {

    var states={};
    
    socket.on('bus',function(addr,state) {
        var a=addr.replace('I','O');
        
        if (states[a]===undefined) {
            if (a==addr) {
                states[a]=state;
            } else {
                states[a]=0;
            }
        }
        
        var state2=state==0?1:0;
        states[a]=state2;

        
        for (var h in session) {    
            if (typeof(session[h].socket)!='undefined' && session[h].socket!=null ) {
                session[h].socket.emit('bus',a,state2);
            }
        } 
        
        
        
    });
}