var express = require('express');
var loginRouter = express.Router();
var models = require('../models');
const bcrypt = require('bcrypt');


/* GET login page. */
loginRouter.get('/', async (req, res, next)=> {
  console.log(req,' user logged in..');
  if(req.session && req.session.email){
    

    let player = await models.Player.findOne({ where: { email: req.session.email } });
    if(player){
      res.locals.email=player.dataValues.email;
      res.locals.name = player.dataValues.firstName + " " + player.dataValues.lastName;

      res.redirect('/home');

    }else{
      req.session.destroy();
      res.render('login', { title: 'Checkers',csrfToken: req.csrfToken() });

    }

    
  }else{
    res.render('login', { title: 'Checkers',csrfToken: req.csrfToken() });
  }
  
});

loginRouter.post('/', async (req, res) => {

  
  var login = { email: req.body.username, password: req.body.password };
  const { error } = models.Player.validateLogin(login);
  if (error) return res.status(400).send(error.details[0].message);

  let player = await models.Player.findOne({ where: { email: req.body.username } });
  if (player) {
    
    const match = await bcrypt.compare(req.body.password, player.dataValues.password);
    if (match) {

      const name=player.dataValues.firstName + " " + player.dataValues.lastName;
      req.session.email=req.body.username;
      req.session.name=name;
      
      res.redirect('/home');
      
    }
    else
      res.render('login',{error:'Invalid username or password',csrfToken: req.csrfToken()});

  } else {
    res.render('login',{error:'Invalid username or password',csrfToken: req.csrfToken()});
    
  }

  

});

module.exports = loginRouter;
