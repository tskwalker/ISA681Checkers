var express = require('express');
var gameRouter = express.Router();
var models= require('./../models');
const Op= models.Sequelize.Op;


/* GET checkers game page. */
gameRouter.get('/', async (req, res) =>{
    
    var email = req.session.email;
    var name=req.session.name;

    var gameExist= await models.Game.findOne({
        where:{
            status:'ready',
            [Op.or]:[{player1_id:email},{player2_id:email}]
        }   
    });

    if(gameExist){
        
        var player1 = gameExist.dataValues.player1_id;
        var player2 = gameExist.dataValues.player2_id;
        var roomId = gameExist.dataValues.gameId;
        res.render('checkersGame', { 
            title: 'Lets Play Checkers', 
            player1: player1, 
            player2: player2, 
            gameRoom: roomId,
            my_name:name,
            my_email:email
        });
    }else{
        res.redirect('/login');
    }
  
})
module.exports = gameRouter;

