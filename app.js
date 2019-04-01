var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exec = require('child_process').exec;
var Queue = require('bull');
var tmp = require('tmp');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

//setup socket connection
var app = express();
var server = app.listen(3141);
var io = require('socket.io')(server);
//define process queue
var metadbQueue = new Queue('execute pipeline', {
  redis: {
    host: 'redis',
    port: 6379
  }
});
metadbQueue.process(function(job, done){
   var spawn = require('child_process').spawn;
   let parameters = [];
   let tmpdir = tmp.dirSync();
   let userParameters = job.data.data.parameters;
   if(!('outdir' in userParameters)){
     done(null, {error: 'Error! No outdir string provided'});
     return;
   }
   if(userParameters['outdir'].indexOf('/') !== -1){
     done(null, {error: 'Error! Illegal character in output name: "/"'});
     return;
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
   if('sequence-length-filter' in userParameters){
     parameters.push('--sequence-length-filter', userParameters['sequence-length-filter']);
   }
   parameters.push('--zip', '--check-tax-names', '--zenodo-token', '/metabDB_web/bcdatabaser/.zenodo_token')
   var process = spawn('/metabDB_web/bcdatabaser/bin/reference_db_creator.pl', parameters, {'cwd': tmpdir.name});
   var result = [];
   var error = [];
   let zenodo_info = {};
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
     error.push(data)
   })
   process.on('close', function(code){
     done(null,{data: result.join("\n"), error: error.join("\n"), zenodo_info: zenodo_info})
   })
});

//setup socket connection
io.on('connection', function(socket){
  console.log('made socket connection', socket.id)
  socket.on('execute', function(data){
    //add parameters to the queue
    metadbQueue.add({data}).then(function(job){
      job.finished().then(function(result){
        console.log(result)
        if(!(result.error.length > 0)){
          socket.emit('logs', {data: result.data})
        } else {
          socket.emit('err-logs', {data: result.error})
        }
        if('zenodo_file_download' in result.zenodo_info){
          socket.emit('download-link', {href: result.zenodo_info.zenodo_file_download, zenodo_info: result.zenodo_info})
        }
        console.log(result.error)
    }).catch(logError)
    }).catch(logError);

    metadbQueue.on('failed', function(job, err){
      socket.emit('err-logs', err)
    })

  })
});

function logError(error){console.error(error)}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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
