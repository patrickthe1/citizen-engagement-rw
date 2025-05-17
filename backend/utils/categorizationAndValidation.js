const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const { Category } = require('../models');

// Load categorization keywords once at startup
let keywordsData = {};
try {
    const keywordsPath = path.join(__dirname, '..', 'categorization_data', 'categorization_keywords.json');
    const rawData = fs.readFileSync(keywordsPath, 'utf8');
    keywordsData = JSON.parse(rawData);
    console.log('Categorization keywords loaded successfully.');
} catch (error) {
    console.error('Error loading categorization keywords:', error);
    // In a real app, you might want to prevent the app from starting or use a fallback.
    keywordsData = { english: {}, kinyarwanda: {} }; // Default to empty keywords if loading fails
}

/**
 * Categorize a submission based on keyword matching.
 * This is a simple MVP approach and has limitations.
 * For a production system, a more sophisticated NLP approach would be recommended.
 * @param {string} description - The submission description text.
 * @param {string} language - The language of the submission ('english' or 'kinyarwanda').
 * @returns {string | null} The most likely category name or null if no strong match.
 */
function categorizeSubmission(description, language) {
    const lang = (language && (language.toLowerCase() === 'kinyarwanda' || language.toLowerCase() === 'english'))
        ? language.toLowerCase()
        : 'english'; // Default to English if language not specified or invalid

    const lowerDescription = description.toLowerCase();
    const categoryScores = {};
    let bestMatchCategory = null;
    let highestScore = 0;

    const categoriesInLanguage = keywordsData[lang];
    if (!categoriesInLanguage) {
        console.warn(`No keywords found for language: ${lang}`);
        return null; // Or a default category
    }

    for (const categoryName in categoriesInLanguage) {
        categoryScores[categoryName] = 0;
        for (const keyword of categoriesInLanguage[categoryName]) {
            const lowerKeyword = keyword.toLowerCase();
            // Simple check: if description includes keyword.
            // More advanced: count occurrences, prioritize longer keywords, use string similarity.
            if (lowerDescription.includes(lowerKeyword)) {
                // Basic scoring: give more weight to longer keywords as they are more specific
                categoryScores[categoryName] += lowerKeyword.length;
            }
        }
    }

    for (const categoryName in categoryScores) {
        if (categoryScores[categoryName] > highestScore) {
            highestScore = categoryScores[categoryName];
            bestMatchCategory = categoryName;
        }
    }
    // If no keyword matches, or score is very low, we might return a default or null
    // For MVP, if any score > 0, we take it. Otherwise, null.
    return highestScore > 0 ? bestMatchCategory : null;
}

// Define the validation schema for new submissions
const submissionSchema = Joi.object({
    subject: Joi.string().trim().min(3).max(255).optional(), // Made subject optional as per user prompt focus on description
    description: Joi.string().trim().min(10).max(5000).required()
        .messages({
            'string.base': 'Description must be a string.',
            'string.empty': 'Description is required.',
            'string.min': 'Description must be at least 10 characters long.',
            'string.max': 'Description cannot exceed 5000 characters.'
        }),
    citizen_contact: Joi.string().trim().min(5).max(255).required() // Assuming contact is a general string for MVP
        .messages({
            'string.base': 'Contact information must be a string.',
            'string.empty': 'Contact information is required.',
            'string.min': 'Contact information must be at least 5 characters long.',
            'string.max': 'Contact information cannot exceed 255 characters.'
        }),
    language_preference: Joi.string().valid('english', 'kinyarwanda').optional().default('english')
});

/**
 * Validates the submission data against the schema.
 * @param {object} submissionData - The data to validate.
 * @returns {object} Joi validation result { error, value }.
 */
function validateSubmission(submissionData) {
    return submissionSchema.validate(submissionData, { abortEarly: false, stripUnknown: true });
}

/**
 * Fetches category and associated agency ID.
 * @param {string} categoryName - The name of the category.
 * @returns {Promise<object|null>} Object with category_id and agency_id, or null if not found.
 */
async function getCategoryAndAgencyDetails(categoryName) {
    if (!categoryName) return null;
    try {
        const category = await Category.findOne({
            where: { name: categoryName },
            attributes: ['id', 'agency_id'] // Ensure agency_id is part of Category model
        });
        if (category) {
            return { category_id: category.id, agency_id: category.agency_id };
        }
        return null;
    } catch (error) {
        console.error('Error fetching category details:', error);
        return null;
    }
}

module.exports = {
    categorizeSubmission,
    validateSubmission,
    getCategoryAndAgencyDetails,
    loadKeywords: () => keywordsData // Expose for potential re-loading or inspection
};
