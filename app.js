var express = require('express');
const helmet = require('helmet');
var path = require('path');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/login');

var User = require('./models/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(helmet);
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

var sixtyDaysInSeconds = 5184000;
app.use(helmet.hsts({
  maxAge: sixtyDaysInSeconds
}))

// launch app server
var server = require('http').createServer(app).listen(3000);

app.use('/', indexRouter);
app.use('/login', usersRouter);

module.exports = app;
