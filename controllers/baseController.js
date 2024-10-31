// controllers/BaseController.js
class BaseController {
    constructor() {
        // You can initialize any common properties here if needed
    }

    // Method to send a success response
    sendSuccess(res, data = {}, message = 'Success', statusCode = 200, redirect_url = '') {
        res.status(statusCode).json({
            success: true,
            status:1,
            message: message,
            data: data,
            redirect_url: redirect_url
        });
    }

    // Method to send an error response
    sendError(res, message = 'An error occurred', statusCode = 500) {
        res.status(statusCode).json({
            success: false,
            status:0,
            message: message,
        });
    }
}

module.exports = BaseController;
