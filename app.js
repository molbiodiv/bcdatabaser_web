require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var exec = require('child_process').exec;
var Queue = require('bull');
var tmp = require('tmp');
const fs = require('fs');
var favicon = require('serve-favicon');
const redis = require('redis')
const session = require('express-session')
let RedisStore = require('connect-redis')(session)
let redisClient = redis.createClient(6379, "redis")
 
// Set the configuration settings for oauth
const credentials = {
  client: {
    id: process.env.ORCID_ID,
    secret: process.env.ORCID_SECRET,
  },
  auth: {
    tokenHost: 'https://orcid.org',
    tokenPath: '/oauth/token',
    authorizePath: '/oauth/authorize'
  }
};

// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(credentials);


var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var usersRouter = require('./routes/users');

var app = express();
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  })
)
app.use(favicon(__dirname + '/public/img/favicon.ico'));
//define process queue
var metadbQueue = new Queue('execute pipeline', {
  redis: {
    host: 'redis',
    port: 6379
  }
});
// make oauth available in routers
app.locals.oauth2 = oauth2;
// make queue available in routers
app.locals.metadbQueue = metadbQueue;
metadbQueue.process(function(job, done){
   let parameters = [];
   let tmpdir = tmp.dirSync().name;
   let userParameters = job.data.data.parameters;
   let taxaFile = job.data.data.taxaFile;
   let user = job.data.user;
   if(!('outdir' in userParameters)){
     done(null, {error: 'Error! No outdir string provided'});
     return;
   }
   if(userParameters['outdir'].indexOf('/') !== -1){
     done(null, {error: 'Error! Illegal character in output name: "/"'});
     return;
   }
   if(userParameters['warn-failed-tax-names']){
     parameters.push('--warn-failed-tax-names');
   }
   parameters.push('--outdir', userParameters['outdir']);
   if(!('marker-search-string' in userParameters)){
     done(null, {error: 'Error! No marker search string provided'});
     return;
   }
   parameters.push('--marker-search-string', userParameters['marker-search-string']);
   if('taxonomic-range' in userParameters){
     parameters.push('--taxonomic-range', userParameters['taxonomic-range']);
   }
   parameters.push(
     '--zip',
     '--check-tax-names',
     '--zenodo-token',
     '/bcdatabaser/bcdatabaser/.zenodo_token',
     '--zenodo-author-name',
     user.name,
     '--zenodo-author-orcid',
     user.orcid,
     '--sequence-length-filter',
     '100:2000',
     '--sequences-per-taxon',
     '9'
   );
   if(taxaFile){
     fs.writeFile(tmpdir+'/species_list.txt', taxaFile.data, (err) => { 
      if (err){
        done(null, {error: 'Error! There was a problem with the taxa file you uploaded.'+err.message});
        return; 
      }
      parameters.push('--taxa-list', 'species_list.txt')
      spawn_process(parameters, tmpdir, done);
     });
   } else {
     spawn_process(parameters, tmpdir, done);
   }
});

function spawn_process(parameters, tmpdir, done){
   var spawn = require('child_process').spawn;
   var process = spawn('/bcdatabaser/bcdatabaser/bin/bcdatabaser.pl', parameters, {'cwd': tmpdir});
   var result = [];
   var error = [];
   let zenodo_info = {};
   let stat_info = {};
   process.stdin.end();
   process.stdout.setEncoding('utf-8');
   process.stdout.on('data', function (data) {
     result.push(data)
   });
   process.stderr.setEncoding('utf-8');
   process.stderr.on('data', function (data) {
     let zenodo_pos = data.indexOf('zenodo_');
     if(zenodo_pos !== -1){
       zenodo_lines = data.split("\n");
       for(zline of zenodo_lines){
         if(zline.indexOf("zenodo_") !== 0){
           continue;
         }
         let parts = zline.split(": ");
         zenodo_info[parts[0]] = parts[1];
       }
     }
     let stat_pos = data.indexOf('STAT\t');
     if(stat_pos !== -1){
       stat_lines = data.split("\n");
       for(sline of stat_lines){
         if(sline.indexOf("STAT\t") === -1){
           continue;
         }
         let parts = sline.split("\t");
         stat_info[parts[1]] = parts[2];
       }
     }
     error.push(data)
   })
   process.on('close', function(code){
     done(null,{data: result.join("\n"), error: error.join("\n"), zenodo_info: zenodo_info, stat_info: stat_info})
   })
}

function logError(error){console.error(error)}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
