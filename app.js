var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exec = require('child_process').exec;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

//setup socket connection
var app = express();
var server = app.listen(3141);
var io = require('socket.io')(server);
io.on('connection', function(socket){
  console.log('made socket connection', socket.id)
  socket.on('execute', function(data){
    executeScript(socket, data);
  })
});

var executeScript = function(socket, data){
  var spawn = require('child_process').spawn;
  var process = spawn('perl', data.parameters);
  process.stdout.setEncoding('utf-8');
  process.stdout.on('data', function (data) {
      socket.emit('logs', {data: data});
  });
  process.stderr.setEncoding('utf-8');
  process.stderr.on('data', function (data) {
      socket.emit('err-logs', data);
  });
}

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
