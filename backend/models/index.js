// Index file for model associations
const Agency = require('./Agency');
const Category = require('./Category');
const Submission = require('./Submission');
const User = require('./User');

// Define associations between models
// Agency to User relationship (one-to-many)
Agency.hasMany(User, { foreignKey: 'agency_id' });
User.belongsTo(Agency, { foreignKey: 'agency_id' });

// Agency to Category relationship (one-to-many)
Agency.hasMany(Category, { foreignKey: 'agency_id' });
Category.belongsTo(Agency, { foreignKey: 'agency_id' });

// Agency to Submission relationship (one-to-many)
Agency.hasMany(Submission, { foreignKey: 'agency_id' });
Submission.belongsTo(Agency, { foreignKey: 'agency_id' });

// Category to Submission relationship (one-to-many)
Category.hasMany(Submission, { foreignKey: 'category_id' });
Submission.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = {
    Agency,
    Category,
    Submission,
    User
};
