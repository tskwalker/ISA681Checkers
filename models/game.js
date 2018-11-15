'use strict';
const Joi = require('joi');
module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define('Game', {
    game_id: {
      type:DataTypes.INTEGER,
      primaryKey:true
    },
    player1_id: DataTypes.STRING,
    player2_id: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    timestamps:false
  });
  Game.removeAttribute('id');

  Game.validate = function(gameInfo){
    var schema={
      game_id:Joi.INTEGER.required(),
      player1_id:Joi.string().email(),
      player2_id:Joi.string().email(),
      status:Joi.string().required()
    }
    return Joi.validate(gameInfo,schema);

  }

  Game.validateEmail = function(email){
    var schema={
      
      player2_id:Joi.string().email(),
      
    }
    return Joi.validate(email,schema);

  }
  Game.associate = function(models) {
    // associations can be defined here
  };
  return Game;
};