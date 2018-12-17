// make connection

$(function() {
  var socket = io.connect('http://127.0.0.1:3141');

  //emit event

  $('button').click(function(){
    var params = ['metabDB/bin/reference_db_creator.pl'];
    var markerSearchString = $('#markerSearchString').val();
    var taxonomicRange = $('#taxonomicRange').val();
    var sequenceLengthFilter = $('#sequenceLengthFilter').val();
    if(markerSearchString.length > 0){
      params.push('--marker-search-string');
      params.push(markerSearchString)
    }
    if(taxonomicRange.length > 0){
      params.push('--taxonomic-range');
      params.push(taxonomicRange)
    }
    if(sequenceLengthFilter.length > 0){
      params.push('--sequence-length-filter');
      params.push(sequenceLengthFilter)
    }
    //params = ['metabDB/bin/reference_db_creator.pl', '--marker-search-string', 'ITS2', '--taxonomic-range', 'Bellis', '--sequence-length-filter', '100:2000']
    params = ['metabDB/bin/reference_db_creator.pl', '--marker-search-string', 'ITS2', '--taxonomic-range', 'Bellis']
    console.log(params)
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
    $('#messages').append($('<li>').text(msg.data));
  });

})
