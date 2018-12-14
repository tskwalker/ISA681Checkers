'use strict';
var Joi = require('joi');
module.exports = (sequelize, DataTypes) => {
  const Player = sequelize.define('Player', {
    firstName: {
      type:DataTypes.STRING,
      minlength:5
    },
    lastName: {
      type:DataTypes.STRING,
      minlength:5
    },
    email: {
      type: DataTypes.STRING,
      primaryKey: true,
      min:5,
      max:255
    },
    password: {
      type:DataTypes.STRING,
      min:8,
      max:15
    }
  }, {
    timestamps:false
  });
  Player.associate = function(models) {
    // associations can be defined here
  };
  Player.removeAttribute('id');

  Player.validate = function(player){
    var schema ={
      firstName:Joi.string().required(),
      lastName:Joi.string().required(),
      email:Joi.string().min(5).max(255).email({minDomainAtoms:2}).required(),
      password:Joi.string().required().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/)
    }
    return Joi.validate(player,schema);

  }

  Player.validateLogin= function(login){

    var schema ={
      email:Joi.string().min(5).max(255).email().required(),
      password:Joi.string().required()
    }
    return Joi.validate(login,schema);
  }
  return Player;
};