// controllers/api/RiderController.js
const BaseController = require('../baseController');
const Message = require('../../models/messageModel');
const { validateRequiredFields } = require('../../utils/validators');



class MessageController extends BaseController {
    constructor() {
        super();
        this.message = new Message();
    }

    async sendMessage(req, res) {

        try {
            const {
                name,
                email,
                phone_number,
                subject,
                message,
                status,
            } = req.body;


            // Clean and trim data
            const cleanedData = {
                name: typeof name === 'string' ? name.trim() : '',
                email: typeof email === 'string' ? email.trim().toLowerCase() : '',
                phone_number: typeof phone_number === 'string' ? phone_number.trim() : '',
                subject: typeof subject === 'string' ? subject.trim() : '',
                message: typeof message === 'string' ? message.trim() : '',                
                created_date: new Date(),
                status: status || 0,
            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ success: false, message: 'All fields are required.' });
            }

            // Create the rider
            const messageId = await this.message.createMessage(cleanedData);
            console.log('Created Message ID:', messageId); // Log the created rider ID


            this.sendSuccess(res, { messageId }, 'Message sent successfully.');
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                success: false,
                message: 'An error occurred during message sending.',
                error: error.message
            });
        }
    ;
    }
   
}



module.exports = MessageController;
