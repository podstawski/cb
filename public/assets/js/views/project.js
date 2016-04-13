$(function() {

    var data={};
    
    $('#img-input').on('change',function(){
        var file_reader = new FileReader();
        file_reader.readAsDataURL($('#img-input').prop('files')[0]);
        
        file_reader.onload = function(){
            data.img=file_reader.result;
            $('#img_img').attr('src',data.img);
        };
    
    
    });
    
    $('#save-project').click(function() {
        $('#project input').each(function(){
            if ($(this).attr('name')!='img')
                data[$(this).attr('name')]=$(this).val();
        });
        websocket.emit('db-save','projects',data);
    });
    
    
    
    
    var hash=window.location.hash;
    hash=hash.split(',');
    if (hash.length>1 && parseInt(hash[1])>0) {
        websocket.emit('db-get','projects',parseInt(hash[1]));
    }

    $('.project .add-item a').click(function(e) {
        websocket.emit('db-save','structure',{name: $.translate('New object')});
    });

    $(document).on('change', '#project-structure input', function(e) {
        websocket.emit('db-save','structure',{id:$(this).attr('rel'),name: $(this).val()});
    });
   
    $(document).on('click', '#project-structure .add-sub', function(e) {
        websocket.emit('db-save','structure',{parent:$(this).attr('rel'),name: $.translate('New object')});
    });
    
    
    $(document).on('click', '#project-structure .svg', function(e) {
        var id=$(this).attr('rel');
        $('#svg-input').click();    
        
        
        $('#svg-input').on('change',function(){
            var d=$('#svg-input').prop('files')[0];
            if (typeof(d)!='undefined') {
                var file_reader = new FileReader();
                file_reader.readAsDataURL(d);
                
                file_reader.onload = function() {    
                    websocket.emit('db-save','structure',{id:id,img:file_reader.result});

                };
            }
        
        
        });        
        
    });
    
    
});

