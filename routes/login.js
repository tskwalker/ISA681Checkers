var express = require('express');
var router = express.Router();

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Checkers' });
});

/**
 * post the credentials to server
 */
router.post('/', function(req, res, next) {
  console.log(req.body.username);
  res.send("post login function");
  
});

module.exports = router;
