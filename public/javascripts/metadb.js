// make connection

$(function() {
  var socket = io.connect('http://127.0.0.1:3141');

  //emit event

  $('button').click(function(){
    var params = {};
    var markerSearchString = $('#markerSearchString').val();
    var outdir = $('#outdir').val();
    var taxonomicRange = $('#taxonomicRange').val();
    var sequenceLengthFilter = $('#sequenceLengthFilter').val();
    var taxaListFiles = $('#exampleInputFile')[0].files;
    if(markerSearchString.length > 0){
      params['marker-search-string'] = markerSearchString;
    }
    if(outdir.length > 0){
      params['outdir'] = outdir;
    }
    if(taxonomicRange.length > 0){
      params['taxonomic-range'] = taxonomicRange;
    }
    if(sequenceLengthFilter.length > 0){
      params['sequence-length-filter'] = sequenceLengthFilter;
    }
    if(taxaListFiles.length > 0){
      var taxaListFile = taxaListFiles[0];
      var fileReader = new FileReader();
      fileReader.readAsText(taxaListFile);
      fileReader.onload = function(e){
        socket.emit('execute', {
          parameters: params,
          taxaFile: { 
            name: taxaListFile.name, 
            type: taxaListFile.type, 
            size: taxaListFile.size, 
            data: e.target.result 
          }
        }); 
      }
    } else {
      socket.emit('execute', {
        parameters: params,
        taxaFile: null
      });
    }
    //TODO add all the other params
    //console.log(params)
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
    button.attr('href', msg.href);
    $('#result_buttons').append(button);
    var badge = $('<img>');
    badge.attr('src', msg.zenodo_info.zenodo_badge_link);
    var badgeLink = $('<a>');
    badgeLink.attr('href', msg.zenodo_info.zenodo_record_link);
    badgeLink.append(badge);
    $('#result_buttons').append(badgeLink);
  });

  $('#markerSearchPresetITS2').on('click', function(){
    $('#markerSearchString').val("ITS2 OR 'internal transcribed spacer2'");
    return false;
  })
  $('#markerSearchPresetRbcL').on('click', function(){
    $('#markerSearchString').val("rbcL OR 'ribulose-1,5-bisphosphate carboxylase/oxygenase large subunit'");
    return false;
  })

  $('#prevResults').DataTable({
    ajax: '/queue',
    columns: [
      {
        "data": "time",
        "render": (data,type,row,meta) => new Date(data).toISOString().substr(0,10)
      },
      { "data": "name" },
      { "data": "marker" },
      { "data": "range" },
      {
        "data": "zenodo_badge",
        "render": (data,type,row,meta) => $('<a>').attr('href', row.zenodo_record_link).append($('<img>').attr('src', data)).get(0).outerHTML
      },
      {
        "data": "id",
        "render": (data,type,row,meta) => $('<a>').attr('href', 'job_details?id='+data).text("Details").get(0).outerHTML
      }
    ],
    order: [[ 0, "desc" ]],
    dom: 'frtipB',
    buttons: [
      'copy', 'csv', 'pdf'
    ]
  });
})
