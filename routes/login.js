var express = require('express');
var loginRouter = express.Router();
var models = require('../models');
const bcrypt = require('bcrypt');


/* GET login page. */
loginRouter.get('/', function (req, res, next) {

  res.render('login', { title: 'Checkers' });
});


loginRouter.post('/', async (req, res) => {
  //var playerId = (Math.random() * 100000) | 0;
  var playerId = 1;
  //var pId = (Math.random() * 2) | 0;

  var login = { email: req.body.username, password: req.body.password };
  const { error } = models.Player.validateLogin(login);
  if (error) return res.status(400).send(error.details[0].message);

  let player = await models.Player.findOne({ where: { email: req.body.username } });
  if (player) {
    //console.log(player.dataValues);
    //var playerId = (Math.random() * 100000) | 0;
    const match = await bcrypt.compare(req.body.password, player.dataValues.password);
    if (match) {

      res.render('home', {
        title: 'Home Page',
        name:player.dataValues.firstName + " " + player.dataValues.lastName,
        email: player.dataValues.email,
        pId: playerId
      });
      //res.send('password verified successfully')
    }
    else
      res.send('Invalid username or password');

  } else {
    res.send("Invalid email or password");
    
  }

  

});

module.exports = loginRouter;
