var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'MetaDB' });
});

router.get('/download', function(req, res, next) {
  let id = req.query.id;
  //TODO sanitize input. Restricted through .zip suffix (not sufficient)
  res.download('/tmp/'+id+'.zip', id+'.zip');
});

module.exports = router;
