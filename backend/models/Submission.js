const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Submission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        Submission.belongsTo(models.Category, {
            foreignKey: 'category_id',
            as: 'category'
        });
        Submission.belongsTo(models.Agency, {
            foreignKey: 'agency_id',
            as: 'agency'
        });
    }
  }

  Submission.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ticket_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'categories', key: 'id' }, // Changed to lowercase
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    agency_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'agencies', key: 'id' }, // Changed to lowercase
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    subject: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    citizen_contact: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    language_preference: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'english'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Received',
        validate: {
            isIn: [['Received', 'In Progress', 'Resolved', 'Closed']]
        }
    },
    admin_response: {
        type: DataTypes.TEXT
    }
  }, {
    sequelize, // sequelize instance is now passed by models/index.js
    modelName: 'Submission',
    tableName: 'submissions', // Changed to lowercase
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Submission;
};
