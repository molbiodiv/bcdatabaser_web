// make connection

$(function() {
  var socket = io.connect('http://127.0.0.1:3141');

  //emit event

  $('button').click(function(){
    var params = {};
    var markerSearchString = $('#markerSearchString').val();
    var taxonomicRange = $('#taxonomicRange').val();
    var sequenceLengthFilter = $('#sequenceLengthFilter').val();
    if(markerSearchString.length > 0){
      params['marker-search-string'] = markerSearchString;
    }
    if(taxonomicRange.length > 0){
      params['taxonomic-range'] = taxonomicRange;
    }
    if(sequenceLengthFilter.length > 0){
      params['sequence-length-filter'] = sequenceLengthFilter;
    }
    //TODO add all the other params
    //console.log(params)
    socket.emit('execute', {
      parameters: params
    });
    $(this).attr('disabled', 'none');
  })

  // listen for events

  socket.on('logs', function(data){
    $('#messages').append($('<textarea>').text(data.data));
  })

  socket.on('err-logs', function(msg){
    $('#messages').append($('<textarea>').text(msg.data));
  });

  socket.on('download-link', function(msg){
    var button = $('<a>').text('Download');
    button.addClass('btn');
    button.addClass('btn-primary');
    button.attr('href', 'download?id='+msg.href);
    $('#messages').append(button);
  });

})
