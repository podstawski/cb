
$(function(){
    
    
    $('#s').css('left','330px');
    $('#s').css('top','460px');
    
    
    $('#s').css('width','395px');
    $('#s').css('height','270px');
    
    $('#s svg').css('width','395px');
    $('#s svg').css('height','270px');
    
    
    //$('#s').draggable();
    
    
    $('.svg').width($('#floor-container .draggable-container').width());
    
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
    }

    calculateWH();
    $(window).bind('resize', calculateWH);
    
});
