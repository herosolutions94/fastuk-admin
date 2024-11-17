// utils/validators.js

// Ensure no fields are empty
const validateRequiredFields = (fields) => {
    console.log(fields)
    return Object.values(fields).every(field => field !== '');
};

// Email validation
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// UK Phone Number validation
const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;  // UK mobile format
    return phoneRegex.test(phone);
};
function validateFields(body, requiredFields) {
    const errors = [];

    requiredFields.forEach((field) => {
        if (!body[field] || body[field].toString().trim() === '') {
            errors.push(`${field} is required.`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
    };
}


module.exports = {
    validateRequiredFields,
    validateEmail,
    validatePhoneNumber,
    validateFields
};



