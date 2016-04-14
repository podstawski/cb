$(function(){
	$('.datatable').DataTable({
		language: {
			url: "assets/js/datatables/"+$.translateLang()+".json"
		}
	});
});
