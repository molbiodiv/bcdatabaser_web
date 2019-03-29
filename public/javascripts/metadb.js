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
  function handle_log(data){
    var logarea = $('<textarea>');
    logarea.text(data.data);
    logarea.css('width', '100%');
    logarea.css('height', 600);
    logarea.css('font-family', 'mono');
    logarea.attr('readonly','readonly')
    $('#messages').append(logarea);
  }

  socket.on('logs', handle_log);
  socket.on('err-logs', handle_log);

  socket.on('download-link', function(msg){
    var button = $('<a>').text('Download');
    button.addClass('btn');
    button.addClass('btn-primary');
    button.addClass('btn-lg');
    button.attr('href', 'download?id='+msg.href);
    $('#result_buttons').append(button);
  });

  $('#markerSearchPresetITS2').on('click', function(){
    $('#markerSearchString').val("ITS2 OR 'internal transcribed spacer2'");
    return false;
  })
  $('#markerSearchPresetRbcL').on('click', function(){
    $('#markerSearchString').val("rbcL OR 'ribulose-1,5-bisphosphate carboxylase/oxygenase large subunit'");
    return false;
  })
})
