var io_socket = io.connect();

io_socket.on ('message',function(msg) {
    toastr.success(msg.message, 'Simon sais', {
        closeButton: true,
        progressBar: true,
    });
});