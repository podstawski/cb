var Device = function(device) {
    var _self=this;
    var _dom=null,_parent=null;
    var _attr={};
    
    _attr.name=$.translate(device.name);
    _attr.label=device.label || '';
    
    var draw = function() {
        if (_dom!=null) return _self; 
    
        
        _dom=$('<div class="device-container" title="'+$.translate(device.name)+'"></div>');
        _parent.append(_dom);
        
        var controls=$('<div class="controls-container"></div>');
        _dom.append(controls);
        
        var label=$('<div class="device-label"></div>');
        _dom.append(label);
        
        if (device.controls!==undefined) {
            for (var i=0;i<device.controls.length;i++) {
                var control=$('<div></div>');
                controls.append(control);
                control.css({
                    left: (device.controls[i].x*100)+'%',
                    top: (device.controls[i].y*100)+'%',
                    width: (device.controls[i].w*100)+'%',
                    height: (device.controls[i].h*100)+'%'
                });
                
                if (device.controls[i].state!==undefined && device.controls[i].state.length>0 && device.controls[i].sstyle!==undefined) {
                    var style=control.attr('style');
                    style+=';'+device.controls[i].sstyle.replace('__STATE__',device.controls[i].state);
                    control.attr('style',style);
                }
                
                
            }
            
            _dom.find('.controls-container').each(function(){
                $(this).height($(this).width());
            });
        }
        
        _dom.draggable({
            helper: "clone"
        });

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
        draw: function() {
            return draw();
        },
        attr: function(attr,val) {
            if (attr==null) return _attr;
            if (val==null) return _attr[attr];
            _attr[attr]=val;
            return _self;
        }
        
    }
}