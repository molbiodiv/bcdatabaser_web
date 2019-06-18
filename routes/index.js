var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'BCdatabaser' });
});

router.get('/job_counts', function(req, res, next) {
  let metadbQueue = req.app.locals.metadbQueue;
  metadbQueue.getJobCounts().then(result => res.json(result));
});

router.get('/queue', function(req, res, next) {
  let metadbQueue = req.app.locals.metadbQueue;
  metadbQueue.getJobs(['completed']).then(
    (result) => {
      filtered_result = result.filter(x => 
        'zenodo_info' in x.returnvalue &&
        'zenodo_doi' in x.returnvalue.zenodo_info &&
        'stat_info' in x.returnvalue
      );
      final_results = filtered_result.map(
        x => {return {
          'name': x.data.data.parameters['outdir'],
          'marker': x.data.data.parameters['marker-search-string'],
          'range': x.data.data.parameters['taxonomic-range'],
          'time': x.finishedOn,
          'doi': x.returnvalue.zenodo_info.zenodo_doi,
          'num_seqs': x.returnvalue.stat_info.number_of_sequences,
          'num_taxa': x.returnvalue.stat_info.number_of_taxa,
          'zenodo_badge': x.returnvalue.zenodo_info.zenodo_badge_link,
          'zenodo_record_link': x.returnvalue.zenodo_info.zenodo_record_link,
          'id': x.id
        }}
      )
      res.json({data: final_results});
    });
});

let job_status = function(processedOn, finishedOn, returnvalue){
  if(!processedOn){
    return "queued";
  }
  if(!finishedOn){
    return "running";
  }
  return (returnvalue !== null && "zenodo_info" in returnvalue && "zenodo_doi" in returnvalue.zenodo_info ? "success" : "fail")
}

router.get('/all_jobs', function(req, res, next) {
  let metadbQueue = req.app.locals.metadbQueue;
  metadbQueue.getJobs(['waiting','active','completed']).then(
    (result) => {
      final_results = result.map(
        x => {return {
          'time': x.timestamp,
          'name': x.data.data.parameters['outdir'] || 'null',
          'id': x.id,
          'status': job_status(x.processedOn, x.finishedOn, x.returnvalue)
        }}
      )
      res.json({data: final_results});
    });
});

router.post('/process', function(req, res, next) {
  let metadbQueue = req.app.locals.metadbQueue;
  console.log(req.body)
  metadbQueue.add({data: req.body}).then(function(job){
    res.json({id: job.id});
  });
});

router.get('/job_details', function(req, res, next) {
  let metadbQueue = req.app.locals.metadbQueue;
  metadbQueue.getJob(req.param("id")).then(
    (result) => {
      res.json({data: result});
    });
});

router.get('/details/:id', function(req, res, next) {
  let metadbQueue = req.app.locals.metadbQueue;
  let status_color_map = {
    "running": "blue",
    "queued": "yellow",
    "success": "brightgreen",
    "fail": "red"
  }
  metadbQueue.getJob(req.params.id).then(
    (result) => {
      status = job_status(result.processedOn, result.finishedOn, result.returnvalue)
      res.render('details', {
        stdout: result.returnvalue.error,
        status: status,
        status_color: status_color_map[status]
      });
    });
});

module.exports = router;
