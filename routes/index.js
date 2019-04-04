var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'BCdatabaser' });
});

router.get('/queue', function(req, res, next) {
  let metadbQueue = req.app.locals.metadbQueue;
  metadbQueue.getJobs(['completed']).then(
    (result) => {
      filtered_result = result.filter(x => 'zenodo_info' in x.returnvalue && 'zenodo_doi' in x.returnvalue.zenodo_info);
      final_results = filtered_result.map(
        x => {return {
          'name': x.data.data.parameters['outdir'],
          'marker': x.data.data.parameters['marker-search-string'],
          'range': x.data.data.parameters['taxonomic-range'],
          'time': x.finishedOn,
          'doi': x.returnvalue.zenodo_info.zenodo_doi,
          'zenodo_badge': x.returnvalue.zenodo_info.zenodo_badge_link,
          'zenodo_record_link': x.returnvalue.zenodo_info.zenodo_record_link
        }}
      )
      res.json({data: final_results});
    });
});

module.exports = router;
