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
                    var slider='<div class="slider"/>';
                    if (device.controls[i].simage!==undefined && device.controls[i].simage.length>0) {
                        slider+='<img src="'+device.controls[i].simage+'"/>';
                    } else {
                        slider+='<div class="progressbar"/>';
                    }
                    control.append(slider);
                }
                
                
                if ( device.controls[i].sstyle!==undefined) {
                    var style=control.attr('style');
                    var sstyle=device.controls[i].sstyle;
                    if(device.controls[i].state!==undefined && device.controls[i].state.length>0) {
                        sstyle=sstyle.replace('__STATE__',device.controls[i].state);
                    }
                    
                    style+=';'+sstyle;
                    control.attr('style',style);
                }
                
                for(var k in device.controls[i]) {
                    control.attr(k,device.controls[i][k]);
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
    }
    
    
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
        }
        
    }
}