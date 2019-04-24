// make connection

$(function() {

  $('button').click(function(){
    var params = {};
    var markerSearchString = $('#markerSearchString').val();
    var outdir = $('#outdir').val();
    var taxonomicRange = $('#taxonomicRange').val();
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
    if(taxaListFiles.length > 0){
      var taxaListFile = taxaListFiles[0];
      var fileReader = new FileReader();
      fileReader.readAsText(taxaListFile);
      fileReader.onload = function(e){
        $.ajax('process', {
          method: 'POST',
          data: JSON.stringify({
            parameters: params,
            taxaFile: { 
              name: taxaListFile.name, 
              type: taxaListFile.type, 
              size: taxaListFile.size, 
              data: e.target.result 
            }
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: (data) => {
            $('#your_job').attr('href', 'job_details?id='+data.id).text(data.id);
            $('#your_job_notification').show();
          }
        });
      }
    } else {
      $.ajax('process', {
        method: 'POST',
        data: JSON.stringify({
          parameters: params,
          taxaFile: null
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json"
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
  $.ajax('job_counts', {
    success: (data, textStatus) => {
      $('#running_jobs').text(data.active)
      $('#pending_jobs').text(data.waiting)
      $('#queue_status').show()
    }
  })
})
