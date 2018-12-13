'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('GameMoves', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      gameId: {
        type: Sequelize.INTEGER
      },
      moveNum: {
        type: Sequelize.INTEGER
      },
      player: {
        type: Sequelize.STRING
      },
      src: {
        type: Sequelize.STRING
      },
      dest: {
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
    }).then(() => {
      queryInterface.addConstraint('GameMove',['gameId','moveNum','player'],{
        type: 'primary key',
        name: 'game_move_primary_key'
      })
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('GameMoves');
  }
};