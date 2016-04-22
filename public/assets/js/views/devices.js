var devicesColumns=[
	{ title: $.translate("Name"), data: "name" },
    { title: $.translate("Symbol"), data: "symbol" },
	{ title: $.translate("Tags"), data: "tags" },
    { title: $.translate("Inputs") , data: "inputs"},
    { title: $.translate("Outputs"), data: "outputs" },
    {
		title: $.translate("Actions"),
		orderable: false,
		data: null,
		defaultContent: '<a class="btn btn-info" href="#"><i class="fa fa-edit" data-toggle="modal" data-target="#edit-device"></i></a> <a class="btn btn-danger" data-target="#confirm-delete" data-toggle="modal" href="#"><i class="fa fa-trash-o "></i></a>'
	}
];

var devicesData={};
var callingControl=null;

var devicesTableDraw = function(data) {

	devicesData={};

	var datatable = $('.devicetable').dataTable().api();

	for (var i=0; i<data.length;i++) {
		data[i].DT_RowId=data[i].id;
	
		for (var j=0; j<devicesColumns.length; j++) {
			if (devicesColumns[j].data==null) continue;
			
			if (typeof(data[i][devicesColumns[j].data])=='undefined') {
                data[i][devicesColumns[j].data]='';
            }
		}
		
		devicesData[data[i].id] = data[i];
		
	}
	
	

	datatable.clear();
    datatable.rows.add(data);
    datatable.draw();
}


var toggleDisabled = function() {
	var symbol=$('#edit-device input[name="symbol"]');
	
	if (symbol.length>0) {
        if (symbol.val().length>0) {
            $('#edit-device .disable-toggle').hide();
        } else {
			$('#edit-device .disable-toggle').show();
		}
    }
}

var addControl = function (obj,data) {
	
	var dst=$('#edit-device .device-controls-container');
	
	if (obj==null) {
        obj=$('<div class="drg"><span class="name"></span></div>');
		for(var k in data) {
			obj.attr(k,data[k]);
		}
		obj.css({
			left: data.x*dst.width(),
			top: data.y*dst.height(),
			width: data.w*dst.width()*1.01,
			height:data.h*dst.height()*1.06
		});
	}
	
	obj.appendTo(dst);
	obj.resizable({containment:'parent'});
	obj.draggable({containment:'parent'});
	
	obj.dblclick(function(){
		$('#edit-control').modal('show');
		$('#edit-control').attr('symbol',$('#edit-device input[name="symbol"]').val());
		var type=$(this).attr('type');
		
		callingControl=$(this);
	
		$.smekta_file('views/smekta/control-'+type+'.html',{style:$(this).attr('s')},'#edit-control .modal-body',function(){
			websocket.emit('files',$('#edit-control').attr('symbol'));
		
			for (var i=0;i<obj[0].attributes.length; i++) {
				var attr=obj[0].attributes[i].nodeName;
				var val=obj[0].attributes[i].nodeValue;
				$('#edit-control input[name="'+attr+'"]').val(val);
			}
		});
	});
	
	obj.contextmenu(function(e){
		$(this).remove();
		e.preventDefault();
	});
	
	controlsStyle();
}

var controlsStyle=function() {

	$('#edit-device .device-controls-container div').each( function(){
		var addr=$(this).attr('addr');
		if (addr!==undefined && addr.length>0) {
            $(this).find('span.name').html(addr);
        }
		var style=$(this).attr('sstyle');
		var state=$(this).attr('state');
		
		
		if (style!==undefined && state!==undefined) {
            style=style.replace('__STATE__',state);
			var originalStyle=$(this).attr('style');
			$(this).attr('style',originalStyle+';'+style);
        }
	});
}

var displayFileList = function(dir,files) {

	if (dir==$('#edit-control').attr('symbol')) {
		
		var f=[];
		for(var i=0;i<files.length;i++) f.push({name:files[i],dir:dir});
		$.smekta_file('views/smekta/control-images.html',{files:f},'#edit-control ul.images',function(){
		
			$('.uploaded-images').click(function() {
				var img=$(this).parent().find('input').val();
				if ($('#edit-control #state').val().length>0) {
                    img=img.replace($('#edit-control #state').val(),'__STATE__');
                }
				$('#edit-control #sstyle').val('background-image: url(images/[dir]/'+img+')')
			});
		
		});
		
    }
};


var startDraggingLabels = function() {
	
	$('#edit-device .device-controls-label-container div').draggable({
		containment: "#edit-device .device-controls-top-container",
		helper: "clone",
		start: function() {
		},
		stop: function() {
			var hlp=$('#edit-device .ui-draggable-dragging').position();
			var top=$('#edit-device .device-controls-top-container').offset();
			var sqr=$(this).offset();
			var pos=$(this).position();
			
			var dst=$('#edit-device .device-controls-container');
			
			var obj=$(this).clone();
			obj.appendTo('#edit-device .device-controls-top-container');
			obj.css({
				position: 'absolute',
				left: sqr.left - top.left + hlp.left - pos.left,
				top: sqr.top - top.top + hlp.top - pos.top
			});
			

			
			if (obj.position().left > dst.width()) {
                obj.remove();
            } else {
				addControl(obj);			
			}
		
		}
		
	});

}



$(function(){
	
	$('.devicetable').DataTable({
		language: {
			url: "assets/js/datatables/"+$.translateLang()+".json"
		},
		columns: devicesColumns
	});

	setBreadcrumbs([{name: $.translate('Devices'), href:'devices.html'}]);
	
	$('.devices .add-item').click(function(e) {
		websocket.emit('db-save','devices',{});
	});
	
	websocket.emit('db-get','devices');

	
	if (typeof($.devicesInitiated)=='undefined') { //prevent multi event
		$(document).on('click','.devicetable td a.btn-danger',function(e){
			var id=$(this).parent().parent().attr('id');
			$('#confirm-delete').attr('rel',id);
			$('#confirm-delete .modal-header h4').text(devicesData[id].name);
		});
		
		$(document).on('click','.devicetable td a.btn-info',function(e){
			
			var id=$(this).parent().parent().attr('id');
			$('#edit-device').attr('rel',id);
			
			$('#edit-device input[name="name"]').val(devicesData[id].name);
			$('#edit-device input[name="symbol"]').val(devicesData[id].symbol);

			$.smekta_file('views/smekta/device.html',devicesData[id],'#edit-device .modal-body',function(){
				$('#edit-device .modal-body .translate').translate();
				startDraggingLabels();
				toggleDisabled();
				$('#edit-device input[name="symbol"]').change(toggleDisabled);
				
				
				if (devicesData[id].controls !== undefined) {
                    for (var i=0; i<devicesData[id].controls.length; i++) {
						addControl(null,devicesData[id].controls[i]);
					}
                }
			});
			
		});
		
		$.devicesInitiated=true;
    }
	
	$('#confirm-delete .btn-danger').click(function(e){
		$('#confirm-delete').modal('hide');
		websocket.emit('db-remove','devices',$('#confirm-delete').attr('rel'));
	});

	$('#edit-device .btn-info').click(function(e){
		$('#edit-device').modal('hide');
		var data={id:$('#edit-device').attr('rel')};
		
		$('#edit-device input,#edit-device select').each(function(){
			data[$(this).attr('name')]=$(this).val();
		});
		
		var controls=[];
		
		$('#edit-device .device-controls-container div').each( function(){
			if ($(this).attr('type')===undefined) return;
			
			var control={};

			for (var i=0;i<this.attributes.length; i++) {
				var attr=this.attributes[i].nodeName;
				var val=this.attributes[i].nodeValue;
				if (attr=='style') continue;
				if (attr=='class') continue;
				control[attr]=val;
			}
			
			var position=$(this).position();
			control.x=position.left/$(this).parent().width();
			control.y=position.top/$(this).parent().height();
			control.w=$(this).width()/$(this).parent().width();
			control.h=$(this).height()/$(this).parent().height();
						
			controls.push(control);
		});

		data.controls=controls;


		data.inputs=$('#edit-device .device-controls-container div[type="input"]').length;
		data.outputs=$('#edit-device .device-controls-container div[type="output"]').length;
	
		websocket.emit('db-save','devices',data);
	});

	$('#img-input').on('change',function(){
		var d=$('#img-input').prop('files')[0];
		if (typeof(d)!='undefined') {
			var file_reader = new FileReader();
			file_reader.readAsDataURL(d);
			
			file_reader.onload = function() {
				websocket.emit('upload-file',$('#edit-control').attr('symbol'),file_reader.result);
				
			};
		}
	
	
	});
	
	$('#edit-control .modal-footer .btn-info').click(function (){
		$('#edit-control').modal('hide');
		$('#edit-control input').each(function (){
		
			if ($(this).attr('name')!==undefined) {
                callingControl.attr($(this).attr('name'),$(this).val());
            }
		});
		controlsStyle();
	});


});


