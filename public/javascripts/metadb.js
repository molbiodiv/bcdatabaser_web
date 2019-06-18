// make connection

$(function() {
  let prevResultsTable;
  let allJobsTable;

  function updateOutputName(){
    var markerSearchString = $('#markerSearchString').val().replace(/[^\w\s]/g, '');
    var taxonomicRange = $('#taxonomicRange').val().toLowerCase();
    var taxaListDescription = $('#taxaListDescription').val().replace(/\s/g, '_');
    if(markerSearchString == ""){
      markerSearchString = "<searchstring>";
    } else {
      markerSearchString = markerSearchString.split(" ")[0].toLowerCase()
    }
    if(taxonomicRange == ""){
      taxonomicRange = "root";
    }
    if(taxaListDescription == ""){
      taxaListDescription = "none";
    }
    var dateString = new Date().toISOString().substr(0,10);
    var outputName = [markerSearchString, taxonomicRange, taxaListDescription, dateString].join(".");

    var outdir = $('#outdir').val(outputName);
  }

  function jobSubmissionSuccessful(data){
    $('#your_job').attr('href', 'job_details?id='+data.id).text(data.id);
    $('#your_job_notification').show();
    prevResultsTable.ajax.reload();
    allJobsTable.ajax.reload();
  }

  $('#toggleAllJobsPanelButton').click(function(){
    $('#allJobsPanel').toggle();
  });

  $('#executeJobButton').click(function(){
    updateOutputName();
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
          success: jobSubmissionSuccessful
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
        dataType: "json",
        success: jobSubmissionSuccessful
      });
    }
    $(this).attr('disabled', 'none');
  })

  $('#markerSearchString').on("change", updateOutputName);
  $('#taxonomicRange').on("change", updateOutputName);
  $('#taxaListDescription').on("change", updateOutputName);

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
    $('#markerSearchString').change();
    return false;
  })
  $('#markerSearchPresetRbcL').on('click', function(){
    $('#markerSearchString').val("rbcL OR 'ribulose-1,5-bisphosphate carboxylase/oxygenase large subunit'");
    $('#markerSearchString').change();
    return false;
  })

  prevResultsTable = $('#prevResults').DataTable({
    ajax: '/queue',
    columns: [
      {
        "data": "time",
        "visible": false
      },
      { "data": "name" },
      { "data": "num_seqs" },
      { "data": "num_taxa" },
      {
        "data": "zenodo_badge",
        "render": (data,type,row,meta) => {
          if ( type === 'display' ){
            return $('<a>').attr('href', row.zenodo_record_link).append($('<img>').attr('src', data)).get(0).outerHTML;
          }
          return row.doi;
        }
      },
      {
        "data": "id",
        "render": (data,type,row,meta) => $('<a>').attr('href', 'job_details?id='+data).text("Details").get(0).outerHTML
      }
    ],
    order: [[ 0, "desc" ]],
    dom: 'frtip',
    buttons: [
      'copy', 'csv', 'pdf'
    ]
  });
  
  let status_color_map = {
    "running": "blue",
    "queued": "yellow",
    "success": "brightgreen",
    "fail": "red"
  }
  allJobsTable = $('#allJobs').DataTable({
    ajax: '/all_jobs',
    columns: [
      {
        "data": "time",
        "render": (data,type,row,meta) => new Date(data).toISOString()
      },
      { "data": "name" },
      //{ "data": "marker" },
      //{ "data": "range" },
      {
        "data": "status",
        "render": (data,type,row,meta) => {
          if ( type === 'display' ){
            return $('<img>').attr('src', "https://img.shields.io/badge/job-"+data+"-"+status_color_map[data]+".svg").get(0).outerHTML;
          }
          return data;
        }
      },
      {
        "data": "id",
        "render": (data,type,row,meta) => $('<a>').attr('href', 'job_details?id='+data).text("Details").get(0).outerHTML
      }
    ],
    order: [[ 0, "desc" ]]
  });

  $.ajax('job_counts', {
    success: (data, textStatus) => {
      $('#running_jobs').text(data.active)
      $('#pending_jobs').text(data.waiting)
      $('#queue_status').show()
    }
  })

  setInterval(() => {
    prevResultsTable.ajax.reload();
    allJobsTable.ajax.reload();
  }, 30000)
})
