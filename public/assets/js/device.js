var Device = function(device) {
    var _self=this;
    var _dom=null,_parent=null;
    var _attr={};
    var _default={};
    
    _attr.name=$.translate(device.name);
    _attr.label=device.label || '';
    
    var redraw=function(ratio) {
        
        _dom.attr('title',_attr.name);
        _dom.find('.device-label').text(_attr.label);
        
        _dom.width(ratio*_default.width);
        _dom.height(ratio*_default.height);
        _dom.find('.controls-container').height(ratio*_default.devicesHeight);
        _dom.find('.device-label').height(ratio*_default.labelHeight);
        _dom.find('.device-label').css('font-size',(ratio*_default.fontSize)+'px');
 
        for (var i=0; i<device.controls.length; i++) {
            var dst=_dom.find('div[_idx="'+i+'"]');
       
            for (var k in device.controls[i]) {
                dst.attr(k,device.controls[i][k]);
            }
        }
 
        return _self;
    }
    
    var draw = function(options,ratio) {
        if (ratio==null) ratio=1;
        if (_dom!=null) return redraw(ratio);
          
        
        _dom=$('<div class="device-container" title="'+_attr.name+'"></div>');
        _parent.append(_dom);
        
        var controls=$('<div class="controls-container"></div>');
        _dom.append(controls);
        
        var label=$('<div class="device-label">'+_attr.label+'</div>');
        _dom.append(label);
        if (options.dblclickDevice!==undefined) label.dblclick(options.dblclickDevice);
        
        if (device.controls!==undefined) {
            for (var i=0;i<device.controls.length;i++) {
                var control=$('<div _idx="'+i+'" class="control-'+device.controls[i].type+'"></div>');
                controls.append(control);
                control.css({
                    left: (device.controls[i].x*100)+'%',
                    top: (device.controls[i].y*100)+'%',
                    width: (device.controls[i].w*100)+'%',
                    height: (device.controls[i].h*100)+'%'
                });
                
                if (device.controls[i].type=='slider') {
                    var slider='<div class="slider">';
                    if (device.controls[i].simage!==undefined && device.controls[i].simage.length>0) {
                        slider+='</div><img class="dst" src="'+device.controls[i].simage+'"/>';
                    } else {
                        slider+='<div class="progressbar dst"></div></div>';
                    }
                    control.append(slider);
                }
                
                
                for(var k in device.controls[i]) {
                    control.attr(k,device.controls[i][k]);
                }
                
                setStateElement(control);
                
                if (device.controls[i].haddr!==undefined && device.controls[i].haddr.length>0
                    && device.controls[i].mdown!==undefined && device.controls[i].mdown.length>0) {
                    control.addClass('mouseclick');
                    control.mousedown(function() {
                        var lastIdx=$(this).attr('_counter');
                        if (lastIdx===undefined) lastIdx=0;
                        var mdown=$(this).attr('mdown').split(',');
                        var size=mdown.length;
                        var state=mdown[lastIdx%size];
                        lastIdx++;
                        $(this).attr('_counter',lastIdx);
                        busSend($(this).attr('haddr'),state);
                    });
                }
                
                if (options.dblclickControl!==undefined) control.dblclick(options.dblclickControl);
        
                
            }
            
            _dom.find('.controls-container').each(function(){
                $(this).height($(this).width());
            });
        }
        
        
        
        _dom.draggable(options);
        
        _default.labelHeight=label.height();
        _default.width=_dom.width();
        _default.height=_dom.height();
        
        _default.devicesHeight=controls.height();
        
        _default.fontSize=parseInt(label.css('font-size'));
    };
    
    var setStateElement = function(element,state) {
        if (state==null) state=element.attr('state');

        if (element.attr('min')!==undefined
            && element.attr('min').length>0
            && parseInt(state)<parseInt(element.attr('min'))
        ) return;
        
        if (element.attr('max')!==undefined
            && element.attr('max').length>0
            && parseInt(state)>parseInt(element.attr('max'))
        ) return;
        
        
        var sstyle=element.attr('sstyle');
        var oldState=element.attr('state');
        var min=element.attr('min')||0;
        var max=element.attr('max')||1;
        
        var oldPrc=Math.round(100*(parseFloat(oldState)-parseFloat(min))/(parseFloat(max)-parseFloat(min)));
		var oldRprc=100-oldPrc;

        var prc=Math.round(100*(parseFloat(state)-parseFloat(min))/(parseFloat(max)-parseFloat(min)));
		var rprc=100-prc;

        if (sstyle!==undefined && sstyle.length>0) {
            
            var dst=element.find('.dst');
            if (dst.length==0) dst=element;
            
            var style=dst.attr('style');
            if (style===undefined) style='';
            style=style.replace(sstyle.replace(/__STATE__/g,oldState),'');
            style=style.replace(sstyle.replace(/__PRC__/g,oldPrc),'');
            style=style.replace(sstyle.replace(/__RPRC__/g,oldRprc),'');
            
            
            if (style.length>0) style+='; ';
            style+=sstyle.replace(/__STATE__/g,state).replace(/__PRC__/g,prc).replace(/__RPRC__/g,rprc);
            dst.attr('style',style);
        }
        
    };
    
    var setState = function(haddr,state) {
        $('.draggable-container div[haddr="'+haddr+'"]').each(function(){
            setStateElement($(this),state);
        });
    };
    
    return {

        dom: function(dom) {
            if (dom!=null) _dom=dom;
            return _dom;
        },
        parent: function(parent) {
            if (parent!=null) _parent=parent;
            return _parent;
        },
        draw: function(options,ratio) {
            return draw(options,ratio);
        },
        attr: function(attr,val) {
            if (attr==null) return _attr;
            if (val==null) return _attr[attr];
            _attr[attr]=val;
            return _self;
        },
        state: function(haddr,state) {
            setState(haddr,state);
        }
        
    }
}