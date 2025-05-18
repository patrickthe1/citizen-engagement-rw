// Category Model
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Category.hasMany(models.Submission, {
        foreignKey: 'category_id',
        as: 'submissions',
      });
      Category.belongsTo(models.Agency, {
        foreignKey: 'agency_id',
        as: 'agency',
      });
    }
  }
  Category.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    agency_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'agencies', // Changed to lowercase
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'categories', // Changed to lowercase
    timestamps: true,        // Ensure timestamps are enabled
    createdAt: 'created_at', // Map createdAt to the 'created_at' column
    updatedAt: 'updated_at'  // Map updatedAt to the 'updated_at' column
  });
  return Category;
};
