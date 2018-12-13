'use strict';
const Joi = require('joi');
module.exports = (sequelize, DataTypes) => {
  const GameMove = sequelize.define('GameMove', {
    gameId:{
      type:DataTypes.INTEGER,
      primaryKey: true
    } ,
    moveNum: {
      type:DataTypes.INTEGER,
      primaryKey: true
    },
    player: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    src: DataTypes.STRING,
    dest: DataTypes.STRING
  }, {
    timestamps:false
  });
  GameMove.removeAttribute('id');
  GameMove.associate = function(models) {
    // associations can be defined here
  };

  GameMove.validate = function(move){
    var schema={
      gameId:Joi.number().required(),
      moveNum:Joi.number().required(),
      player:Joi.string().email().required(),
      src:Joi.array().items(Joi.number(),Joi.number()).length(2).required(),
      dest:Joi.array().items(Joi.number(),Joi.number()).length(2).required()
    }
    return Joi.validate(move,schema);
  }
  return GameMove;
};