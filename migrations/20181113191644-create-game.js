'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Games', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      gameId: {
        type: Sequelize.INTEGER,
        primaryKey:true
      },
      player1_id: {
        type: Sequelize.STRING
      },
      player2_id: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      result:{
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }).then(()=>{
      queryInterface.addConstraint('Games', ['gameId'], {
        type: 'primary key',
        name: 'game_primary_key'
     });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Games');
  }
};