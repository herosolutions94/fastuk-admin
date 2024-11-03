// utils/helpers.js

const fs = require('fs'); // Importing the file system module
const path = require('path'); // Importing the path module

module.exports = {
    // A sample function that formats a date
    getStatus: function (status) {
        if (status === 1) {
            return '<span class="status badge success">Active</span>'
        }
        else {
            return '<span class="status badge danger">InActive</span>'
        }
    },
    getVerifiedStatus: function (status) {
        if (status === 1) {
            return '<span class="status badge success">Verified</span>'
        }
        else {
            return '<span class="status badge danger">UnVerified</span>'
        }
    },

    // Another sample function to capitalize text
    capitalize: function (text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    },

    // A function to get an image URL or return a default image if none is provided
    getImage: function (imageName, defaultImage = '/uploads/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.avif') {
        if (!imageName) {
            // If no image name is provided, return the default image path
            return defaultImage;
        }

        // Remove any leading slashes or directory paths from imageName
        imageName = imageName.replace(/^\/+|^uploads\//, ''); // Remove leading slashes and 'uploads/'
        // console.log("imageName:" , imageName)

        // Construct the full image path
        const imagePath = path.join(__dirname, '..', 'uploads', imageName);
        // console.log('Checking image path:', imagePath); // Log the constructed image path

        // Check if the image exists
        if (fs.existsSync(imagePath)) {
            // console.log('Image exists at path:', imagePath); // Log if the image exists
            return `/uploads/${imageName}`; // Return the image path accessible on the web
        } else {
            console.log('Image does not exist, returning default image'); // Log if the image doesn't exist
            return defaultImage; // Return the default image path if the file doesn't exist
        }
    },
    // Function to sanitize and trim input
    sanitizeInput: function (input) {
        if (typeof input === 'string') {
            return input
                .trim();
        }
        return input; // Return as-is for non-string types like numbers or booleans
    },

    // Function to sanitize each field in an object (recursive for nested objects)
    sanitizeData: function (data) {
        const sanitizedData = {};
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
                sanitizedData[key] = this.sanitizeData(data[key]);
            } else if (Array.isArray(data[key])) {
                sanitizedData[key] = data[key].map(item => this.sanitizeInput(item));
            } else {
                sanitizedData[key] = this.sanitizeInput(data[key]);
            }
        });
        return sanitizedData;
    }
};
