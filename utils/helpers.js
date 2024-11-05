const fs = require('fs'); // Importing the file system module
const path = require('path'); // Importing the path module
const sanitizeHtml = require('sanitize-html'); // Importing sanitize-html for XSS protection
const validator = require('validator'); // Importing validator for input validation

module.exports = {
    // A sample function that formats a status with secure HTML
    getStatus: function (status) {
        if (status === 1) {
            return '<span class="status badge success">Active</span>';
        } else {
            return '<span class="status badge danger">InActive</span>';
        }
    },
    
    getVerifiedStatus: function (status) {
        if (status === 1) {
            return '<span class="status badge success">Verified</span>';
        } else {
            return '<span class="status badge danger">UnVerified</span>';
        }
    },

    // Function to capitalize text
    capitalize: function (text) {
        return validator.isString(text) ? text.charAt(0).toUpperCase() + text.slice(1) : text;
    },

    // Function to get an image URL or return a default image if none is provided
    getImage: function (imageName, defaultImage = '/uploads/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.avif') {
        if (!imageName) {
            return defaultImage;
        }

        // Sanitize and remove any unsafe characters
        imageName = sanitizeHtml(imageName.replace(/^\/+|^uploads\//, ''), { allowedTags: [], allowedAttributes: {} });

        // Construct the full image path
        const imagePath = path.join(__dirname, '..', 'uploads', imageName);

        // Check if the image exists
        if (fs.existsSync(imagePath)) {
            return `/uploads/${imageName}`;
        } else {
            console.log('Image does not exist, returning default image');
            return defaultImage;
        }
    },

    // Function to sanitize individual input
    sanitizeInput: function (input) {
        if (typeof input === 'string') {
            // Allow limited HTML tags if input is expected to have HTML (e.g., from rich text editors)
            return sanitizeHtml(input, {
                allowedTags: ['p', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
                allowedAttributes: { 'a': ['href'] },
                allowedSchemes: ['http', 'https', 'mailto']
            }).trim();
        }
        return input;
    },

    // Function to validate and sanitize data (recursive for nested objects)
    sanitizeData: function (input) {
        if (typeof input === 'string') {
            return input
                .trim();
        }
        return input;
    },

    // Function to validate commonly required types
    validateInput: function (input, type) {
        switch (type) {
            case 'email':
                return validator.isEmail(input) ? input : null;
            case 'url':
                return validator.isURL(input, { protocols: ['http', 'https'], require_protocol: true }) ? input : null;
            case 'integer':
                return validator.isInt(input.toString()) ? parseInt(input, 10) : null;
            case 'float':
                return validator.isFloat(input.toString()) ? parseFloat(input) : null;
            case 'boolean':
                return typeof input === 'boolean' ? input : validator.toBoolean(input.toString());
            case 'text':
                return validator.isString(input) ? validator.escape(input) : null;
            default:
                return input;
        }
    },

    // Function to sanitize and validate all fields in an object based on type
    sanitizeAndValidateData: function (data, schema) {
        const validatedData = {};
        Object.keys(schema).forEach(key => {
            const type = schema[key];
            validatedData[key] = this.validateInput(this.sanitizeInput(data[key]), type);
        });
        return validatedData;
    }
};