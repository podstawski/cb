var floorDraw=function(data) {
    console.log(data);
    
    $('.page-header .page-title').text(data.name);
    $('.page-header .page-desc').text(data.desc);
    
    if (typeof(data.parent)=='undefined' || data.parent==null) {
        setBreadcrumbs([{name: data.desc, href:'project.html,'+data.project},
                       {name: data.name, href:'floor.html,'+data.id}]);
    }
    
    $('#floor-container img.svg').attr('src',data.img);
    
}


$(function(){

    var hash=window.location.hash;
    hash=hash.split(',');
    if (hash.length>1 && parseInt(hash[1])>0) {
        websocket.emit('db-get','structure',parseInt(hash[1]));
    }


    
    $('#s').css('left','330px');
    $('#s').css('top','460px');
    
    
    $('#s').css('width','395px');
    $('#s').css('height','270px');
    
    $('#s svg').css('width','395px');
    $('#s svg').css('height','270px');
    
    
    //$('#s').draggable();
    
    
    
    
    $('#floor-container .draggable-container').draggable();
    
    
    $('#floor-container .draggable-container').bind('mousewheel', function(e){
        console.log(this);
        if(e.originalEvent.wheelDelta /120 > 0) {
            $(this).css('zoom',parseFloat($(this).css('zoom'))*1.1);
        }
        else{
            $(this).css('zoom',parseFloat($(this).css('zoom'))*0.9);
        }
    });   
    
    
    var calculateWH = function () {
        $('#floor-container').height(parseInt($(window).height())-270);
        $('.svg').width($('#floor-container .draggable-container').width());
    }

    calculateWH();
    $(window).bind('resize', calculateWH);
    
});
