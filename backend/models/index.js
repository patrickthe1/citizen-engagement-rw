const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const { sequelize: sequelizeInstance } = require('../config/database'); // Import the configured instance

const basename = path.basename(__filename);
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    // Correctly load model definition functions
    const modelDefinition = require(path.join(__dirname, file));
    // Check if it's a function (our standardized way)
    if (typeof modelDefinition === 'function') {
      const model = modelDefinition(sequelizeInstance, Sequelize.DataTypes);
      db[model.name] = model;
    } else {
      // Fallback for models not yet refactored (though all should be)
      // This might be needed if some models are still directly exporting the model object
      // However, the goal is to have all models export a function.
      console.warn(`Model ${file} does not export a function. Attempting to load directly.`);
      db[modelDefinition.name] = modelDefinition; // This line might cause issues if modelDefinition is not a Sequelize model
    }
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelizeInstance;
db.Sequelize = Sequelize;

// Define associations that might have been missed by individual model files
// or to ensure they are set up correctly after all models are loaded.
// This section duplicates what's in individual model.associate methods but can be a safeguard
// or a place for more complex inter-model associations if needed.
// However, it's generally better to keep associations within the model files themselves.

// Example: (These should ideally be in the static associate methods of the respective models)
// db.Agency.hasMany(db.User, { foreignKey: 'agency_id', as: 'users' });
// db.User.belongsTo(db.Agency, { foreignKey: 'agency_id', as: 'agency' });

// db.Agency.hasMany(db.Category, { foreignKey: 'agency_id', as: 'categories' });
// db.Category.belongsTo(db.Agency, { foreignKey: 'agency_id', as: 'agency' });

// db.Agency.hasMany(db.Submission, { foreignKey: 'agency_id', as: 'submissions' });
// db.Submission.belongsTo(db.Agency, { foreignKey: 'agency_id', as: 'agency' });

// db.Category.hasMany(db.Submission, { foreignKey: 'category_id', as: 'submissions' });
// db.Submission.belongsTo(db.Category, { foreignKey: 'category_id', as: 'category' });


module.exports = db;
