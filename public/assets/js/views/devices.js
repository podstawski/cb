var devicesColumns=[
	{ title: $.translate("Name"), data: "name" },
    { title: $.translate("Symbol"), data: "symbol" },
    { title: $.translate("Inputs") , data: "inp"},
    { title: $.translate("Outputs"), data: "outp" },
    {
		title: $.translate("Actions"),
		orderable: false,
		data: null,
		defaultContent: '<a class="btn btn-info" href="#"><i class="fa fa-edit" data-toggle="modal" data-target="#edit-device"></i></a> <a class="btn btn-danger" data-target="#confirm-delete" data-toggle="modal" href="#"><i class="fa fa-trash-o "></i></a>'
	}
];

var devicesData={};

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

			$.smekta_file('views/smekta/device.html',devicesData[id],'#edit-device .modal-body',function(){
				$('#edit-device .modal-body .translate').translate();
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
		
		$('#edit-device input').each(function(){
			data[$(this).attr('name')]=$(this).val();
		});
		
		console.log(data);
		
		websocket.emit('db-save','devices',data);
	});
});


