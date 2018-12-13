var express = require('express');
var homeRouter = express.Router();
var models = require('../models');

/** get dashboard or home page */

homeRouter.get('/', async (req, res) => {

    //console.log('home:', req.session);
    
    var email = req.session.email;
    var name=req.session.name;

    if (req.session && req.session.email) {

        let player = await models.Player.findOne({ where: { email: req.session.email } });

        if (player) {


            res.locals.email = player.dataValues.email;
            res.locals.name = player.dataValues.firstName + " " + player.dataValues.lastName;

            res.render('home', {
                title: 'Home Page',
                name: player.dataValues.firstName + " " + player.dataValues.lastName,
                email: player.dataValues.email
            });

        } else {
            req.session.destroy();
            res.render('login', { title: 'Checkers', csrfToken: req.csrfToken() });

        }
    }

})

module.exports = homeRouter;



