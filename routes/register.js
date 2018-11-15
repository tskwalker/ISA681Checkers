var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const _ = require('lodash');

const models = require('../models');


router.get('/', (req, res) => {
    res.render('register', { title: 'New player registration' })
})

router.post('/', async (req, res) => {
    console.log(req.body);
    const newPlayer = {
        lastName: req.body.lastName,
        firstName: req.body.firstName,
        email: req.body.email,
        password: req.body.password

    }

    const { error } = models.Player.validate(newPlayer);
    if (error) return res.status(400).send(error.details[0].message);

    let player = await models.Player.findOne({ where: { email: req.body.email } });
    if (player) return res.status(400).send('User already registered.');

    player = new models.Player(_.pick(req.body, ['firstName', 'lastName', 'email', 'password']));
    const salt = await bcrypt.genSalt(11);
    player.password = await bcrypt.hash(player.password, salt);
    await player.save();

    res.redirect('login');
})

module.exports = router;
