

$('#logout').click(function () {
    websocket.emit('logout');
});


function setBreadcrumbs(b) {
    $('.breadcrumb .breadcrumb-item').remove();
    
    var html='';
    for(var i=0; i<b.length; i++) {
        var a=i==b.length-1?' active':'';
        html+='<li class="breadcrumb-item'+a+'"><a href="'+b[i].href+'">'+b[i].name+'</a></li>';
    }
    
    $(html).insertAfter('.breadcrumb .breadcrumb-home');
}



/*
$(function(){
    
    (function() {
        var loadPageParent = window.loadPage;
        
        window.loadPage = function(url) {
            //console.log(url);
            loadPageParent(url);        
        }
    
    })();

});
*/