var polygonMode=true;
var polygonPoints=[];
var lastDragEvent=0;
var dotW=16;
var dotH=16;


var zoomContainer = function(z) {
    
    var sel='#floor-container .draggable-container';
    var current=$(sel).css('zoom');
    
    

    if (current===undefined) {
        current=$(sel).css('-moz-transform');
        if (current===undefined || current=='none') current=1;
        else {
            current=current.substr(7);
            current=current.split(',');
            current=parseFloat(current[0]);
        }
    } else if (current.indexOf('%')>0) {
        current=current.replace('%','');
        current=parseFloat(current)/100;
    } else {
        current=parseFloat(current);
    }
 
    
    if (z!=null) {
        current*=z;
        $(sel).css('-moz-transform','scale('+current+')');
        $(sel).css('zoom',current);
        
    }    
    
    return current;    

}

var calulatePoint = function(p) {
    var zoom=zoomContainer();
    var w=$('#floor-container .draggable-container').width();
    var h=$('#floor-container .draggable-container').height();

    var point={
        x: p.x*w*zoom,
        y: p.y*h
    };
    
    return point;
}

var drawPolygonPoints = function() {

    
    var xs=[];
    for (var i=0; i<polygonPoints.length; i++) {
    
        xs.push(polygonPoints[i].x);
        var p=calulatePoint(polygonPoints[i]);
        var x=p.x - (dotW/2);
        var y=p.y - (dotH/2);
        
        polygonPoints[i].dot.css({left: x, top: y});
        
    }
    
    //console.log(xs);
    //console.log(w,h,w*zoom,h*zoom);
}

var createPolygonFromPoints = function() {
    
    for (var i=0; i<polygonPoints.length; i++) {

        polygonPoints[i].dot.remove();
    }
    polygonPoints=[];   
}

var floorDraw=function(data) {
    
    
    $('.page-header .page-title').text(data.name);
    $('.page-header .page-desc').text(data.desc);
    
    if (typeof(data.parent)=='undefined' || data.parent==null) {
        setBreadcrumbs([{name: data.desc, href:'project.html,'+data.project},
                       {name: data.name, href:'floor.html,'+data.id}]);
    }
    
    $('#floor-container img.svg').attr('src',data.img);
    
    $('#floor-container .svg').click(function(e){
        if (polygonMode && Date.now()-lastDragEvent>800) {
            var zoom=zoomContainer();
            var ex = parseFloat(e.offsetX === undefined ? e.originalEvent.layerX : e.offsetX);
            var ey = parseFloat(e.offsetY === undefined ? e.originalEvent.layerY : e.offsetY);
            var w=parseFloat($('#floor-container').width());
            var h=parseFloat($('#floor-container .draggable-container').height());
            var point={
                x:(ex/zoom)/w,
                y:(ey/zoom)/h
            }
            
            var img='<img src="assets/img/dot.png" class="polygon-dot"/>';
            
            
            point.dot=$(img).css({left: -1*dotW, top: -1*dotH}).appendTo('#floor-container .draggable-container');
            
            polygonPoints.push(point);
            point.dot.attr('title',polygonPoints.length);
            point.dot.click(createPolygonFromPoints);
            drawPolygonPoints();
        }
    
    });
    
    
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
    
    
    
    
    $('#floor-container .draggable-container').draggable({
        stop: function() {
            lastDragEvent=Date.now();
        }
    });
    
    
    $('#floor-container .draggable-container').bind('mousewheel', function(e){
        
        if(e.originalEvent.wheelDelta /120 > 0) zoomContainer(1.1);
        else zoomContainer(0.9);
        
    }).bind('DOMMouseScroll',function(e) {
        if (e.detail<0) zoomContainer(1.1);
        if (e.detail>0) zoomContainer(0.9);
        
    });   
    
    
    var calculateWH = function () {
        $('#floor-container').height(parseInt($(window).height())-270);
        $('.svg').width($('#floor-container').width());
        
        drawPolygonPoints();
    }

    calculateWH();
    $(window).bind('resize', calculateWH);
    
});
