var express = require('express');
var gameRouter = express.Router();


/* GET checkers game page. */
gameRouter.get('/', (req, res) =>{
    res.render('checkersgame', { title: 'Lets Play Checkers' })
})

 

module.exports = gameRouter;
