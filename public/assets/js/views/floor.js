var polygonMode=true;
var polygonPoints=[];
var elements=[];
var lastDragEvent=0;
var thisfloor=0;
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

var moveElements = function() {
    for (var i=0;i<elements.length;i++) {
        switch (elements[i].type) {
            case 'polygon': {
                elements[i].element.remove();
                drawPolygon(elements[i].points,elements[i].id,elements[i].title,elements[i]);
                break;
            }
        }
       
    }
    

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

var drawPolygon = function(points,id,title,element) {
    var points2=[],p='';
    for (var i=0; i<points.length; i++) points2.push(calulatePoint(points[i]));

    var minx=0,miny=0,maxx=0,maxy=0;

    
    for (var i=0; i<points2.length; i++) {
        
        //align to lines:
        for (var j=0; j<i; j++) {
            if (Math.abs(points2[i].x-points2[j].x)<5) points2[i].x=points2[j].x;
            if (Math.abs(points2[i].y-points2[j].y)<5) points2[i].y=points2[j].y;
        }
        //calculate bounds:
        if (points2[i].x<minx || minx==0) minx=points2[i].x;
        if (points2[i].y<miny || miny==0) miny=points2[i].y;
        if (points2[i].x>maxx ) maxx=points2[i].x;
        if (points2[i].y>maxy ) maxy=points2[i].y;
              
    }
    
    for (var i=0; i<points2.length; i++) {
        p+=Math.round(points2[i].x - minx) + ',' + Math.round(points2[i].y - miny) + ' ';
    }
    
    var polygon='<div class="polygon"><svg><polygon points="'+p.trim()+'"/></svg></div>';

    var poli = $(polygon).appendTo('#floor-container .draggable-container').css({left: minx, top:miny});
    poli.width(maxx-minx);
    poli.height(maxy-miny);

    
    if (id!=null) poli.attr('id',id);
    if (title!=null) poli.attr('title',title);
    
    if(element==null) elements.push({type:'polygon',element:poli,points: points,id:id,title:title});
    else element.element=poli;
    return poli;
}

var createPolygonFromPoints = function() {
    
    drawPolygon(polygonPoints);
    for (var i=0; i<polygonPoints.length; i++) {
        polygonPoints[i].dot.remove();
        delete(polygonPoints[i].dot);
    }
    
    websocket.emit('db-save','floor',{floor: thisfloor, type:'polygon', points:polygonPoints});
    polygonPoints=[];   
}

var floorDraw=function(data) {
    
    
    $('.page-header .page-title').text(data.name);
    $('.page-header .page-desc').text(data.desc);
    
    if (typeof(data.parent)=='undefined' || data.parent==null) {
        setBreadcrumbs([{name: data.desc, href:'project.html,'+data.project},
                       {name: data.name, href:'floor.html,'+data.id}]);
    }
    
    $('#floor-container img.svg').attr('src',data.img).load(function(){
        websocket.emit('db-select','floor',[{floor:thisfloor}]);
    });
    
    
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


var floorDrawElements=function(data) {
        
    if (data.length==0) return;
    if (data[0].floor!=thisfloor) return;
    
    for(var i=0;i<elements.length;i++) {
        elements[i].toBeDeleted=true;
    }
    
    for(var i=0;i<data.length;i++) {
        var matchFound=false;
        for(var j=0; j<elements.length; j++) {
            if (data[i].id == elements[j].id) {
                elements[j].toBeDeleted=false;
                for( var k in data[i]) elements[j][k]=data[i][k];
                matchFound=true;
                break;
            }
        }
   
        if (!matchFound) {
            if (typeof(data[i].title)=='undefined') data[i].title='';
        
            
            switch (data[i].type) {
                case 'polygon': {
                    drawPolygon(data[i].points,data[i].id,data[i].title);
                    break;
                }
            }        
            
        }
        
        
    }

    
    
    for(var i=0;i<elements.length;i++) {
        
        if (typeof(elements[i].toBeDeleted)!='undefined' && elements[i].toBeDeleted) {
            elements[i].element.remove();
            elements.splice(i,1);
            i--;
        }
    }    
    
    moveElements();
    
}

$(function(){

    var hash=window.location.hash;
    hash=hash.split(',');
    if (hash.length>1 && parseInt(hash[1])>0) {
        thisfloor=parseInt(hash[1]);
        websocket.emit('db-get','structure',thisfloor);
    }

        

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
        var height=parseInt($(window).height())-270;
        if (height<200) height=200;
        
        $('#floor-container').height(height);
        $('.svg').width($('#floor-container').width());
        
        drawPolygonPoints();
        moveElements();
    }

    calculateWH();
    $(window).bind('resize', calculateWH);
    
});
