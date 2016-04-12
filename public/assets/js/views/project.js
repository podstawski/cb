$(function() {

    var data={};
    
    $('#img-input').on('change',function(){
        file_reader = new FileReader();
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
        websocket.emit('db-get','projects',hash[1]);
    }


});

