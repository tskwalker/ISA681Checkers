var express = require('express');
var indexRouter = express.Router();

/* GET home page. */
indexRouter.get('/', function(req, res, next) {
  console.log('session ID: ',req.sessionID);
  res.render('index', { title: 'Checkers' });
  
});


module.exports = indexRouter;
