// Agency Model
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Agency extends Model {
    static associate(models) {
      // Agency to User relationship (one-to-many)
      Agency.hasMany(models.User, { foreignKey: 'agency_id', as: 'users' });
      // Agency to Category relationship (one-to-many)
      Agency.hasMany(models.Category, { foreignKey: 'agency_id', as: 'categories' });
      // Agency to Submission relationship (one-to-many)
      Agency.hasMany(models.Submission, { foreignKey: 'agency_id', as: 'submissions' });
    }
  }

  Agency.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // Assuming agency names should be unique
    },
    contact_email: {
        type: DataTypes.STRING,
        allowNull: true, // Changed to true, often contact might be via phone or other means
        validate: {
            isEmail: true
        }
    },
    contact_information: { // Added a more general contact field as per submissionController
        type: DataTypes.STRING,
        allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Agency',
    tableName: 'agencies', // Changed to lowercase
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Agency;
};
