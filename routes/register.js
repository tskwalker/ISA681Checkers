var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const _ = require('lodash');

const models = require('../models');


router.get('/', (req, res) => {
    res.render('register', { title: 'New player registration' ,csrfToken: req.csrfToken()})
})

router.post('/', async (req, res) => {
    
    const newPlayer = {
        lastName: req.body.lastName,
        firstName: req.body.firstName,
        email: req.body.email,
        password: req.body.password

    }

    console.log("in post",newPlayer);
    const { error } = models.Player.validate(newPlayer);
    if (error) {
        console.log('pswd',error);
        const errMsg = error.details[0].message;
        if(errMsg.indexOf('password') > -1){
            var errors=['Password should be atleast 8 characters.','Password should contain atleast 1 uppercase ,1 lowercase,  1 numeral and 1 special character(!,@,#,$,%,^,&,*)'];
            return res.render('register',{error:errors,csrfToken: req.csrfToken()});
        }else
            return res.render('register',{usererror:error.details[0].message,csrfToken: req.csrfToken()});
    }

    let player = await models.Player.findOne({ where: { email: req.body.email } });
    if (player) return res.render('register',{usererror:'User already registered.',csrfToken: req.csrfToken()});

    player = new models.Player(_.pick(req.body, ['firstName', 'lastName', 'email', 'password']));
    const salt = await bcrypt.genSalt(11);
    player.password = await bcrypt.hash(player.password, salt);
    await player.save();

    res.render('login',{csrfToken: req.csrfToken()});
})

module.exports = router;
