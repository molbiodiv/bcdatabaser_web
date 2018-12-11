// make connection

$(function() {
  var socket = io.connect('http://127.0.0.1:3141');

  //emit event

  $('button').click(function(){
    var markerSearchString = $('#markerSearchString').val();
    var params = [ 'metabDB/bin/reference_db_creator.pl', '--help'];
    socket.emit('execute', {
      parameters: params
    });
    $(this).attr('disabled', 'none');
  })

  // listen for events

  socket.on('logs', function(data){
    $('#messages').append($('<li>').text(data.data));
  })

  socket.on('err-logs', function(msg){
    $('#messages').append($('<li>').text(msg));
  });

})
