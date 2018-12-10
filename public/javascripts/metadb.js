// make connection

$(function() {
  var socket = io.connect('http://127.0.0.1:3141');

  //emit event

  $('button').click(function(){
    var markerSearchString = $('#markerSearchString').val();
    var taxonomicRange = $('#taxonomicRange').val();
    var params = [ 'run', '--rm', 'iimog/metabdb_dev', '--marker-search-string', markerSearchString, '--sequence-length-filter', '100:2000', 'taxonomic-range', taxonomicRange];
    console.log(markerSearchString);
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
