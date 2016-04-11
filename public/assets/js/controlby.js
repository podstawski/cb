


var websocket = io.connect();

websocket.on('err',function(err,details) {
    toastr.error(details, err, {
        closeButton: true,
        progressBar: true,
    });
});


websocket.on('cookie',function(cn,cv) {
    document.cookie=cn+'='+cv;
});

websocket.on('login',function(data) {
    $('#username').text(data.username);
    $('.after-login').removeClass('after-login').addClass('_after-login');
    $('body').addClass('sidebar-nav').removeClass('sidebar-off-canvas');
    loadPage('dashboard.html');
});

$('#logout').click(function () {
    websocket.emit('logout');
});

websocket.on('logout',function() {
    $('#username').text('nobody');
    $('._after-login').removeClass('_after-login').addClass('after-login');
    $('body').removeClass('sidebar-nav').addClass('sidebar-off-canvas');
    loadPage('main.html');
});

$(function(){
    
    (function() {
        var loadPageParent = window.loadPage;
        
        window.loadPage = function(url) {
            //console.log(url);
            loadPageParent(url);        
        }
    
    })();

});