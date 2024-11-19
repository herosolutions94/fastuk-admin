// utils/validators.js
const crypto = require('crypto');

// Ensure no fields are empty
const validateRequiredFields = (fields) => {
    console.log(fields)
    return Object.values(fields).every(field => field !== '');
};
function validateSignUPRequiredFields(data) {
    const requiredFields = ['full_name', 'email', 'password'];
    return requiredFields.every((field) => data[field] && data[field].trim() !== '');
}
function validatePassword(password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    return  passwordRegex.test(password);

}

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


// Decryption function
function decryptToken(encryptedData, key) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.alloc(16, 0)); // Initialization vector is set to 0
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}





module.exports = {
    validateRequiredFields,
    validateSignUPRequiredFields,
    validatePassword,
    validateEmail,
    validatePhoneNumber,
    validateFields,
    decryptToken,

};



