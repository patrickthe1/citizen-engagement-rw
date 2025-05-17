// User Model
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Agency, { foreignKey: 'agency_id', as: 'agency' });
    }
  }

  User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    agency_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { // Added references for foreign key integrity
            model: 'agencies', // Changed to lowercase
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Or CASCADE / RESTRICT as per requirements
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'admin'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users', // Changed to lowercase
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return User;
};
