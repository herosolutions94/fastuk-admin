

const Message = require('../../models/message');
const BaseController = require('../baseController');

class MessageController extends BaseController {
    // Method to get the riders and render them in the view
    async getMessages(req, res) {
        try {
            const messages = await Message.getAllMessages();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            // if (messages && messages.length > 0) {
                // Corrected res.render with only two arguments
                res.render('admin/message', { messages: messages || [] });
            // } else {
            //     this.sendError(res, 'No messages found');
            // }
        } catch (error) {
            console.error('Error fetching messages:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch messages');
        }
    }
    // Method to fetch a single rider by id and render the edit form
    async messageDetail(req, res) {
        try {
            const messageId = req.params.id;  // Get the rider ID from the request parameters
            // console.log('Fetching rider with ID:', messageId); // Log the ID
    
            // Fetch the rider by ID
            const message = (await Message.getMessageById(messageId))[0]; // Extract the first rider if it's returned as an array
            // console.log('Fetched message:', message); // Log fetched rider data

            // console.log('Message data before rendering:', message); // Log the rider data

    
            // Check if rider exists
            if (message) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/message-detail', { 
                    message, 
                    editMessageId: messageId, 
                });
            } else {
                this.sendError(res, 'Message not found');
            }
        } catch (error) {
            console.error('Error fetching message:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch message');
        }
    }
    

    // Method to handle updating rider information
    async updateMessage(req, res) {
        try {
            const messageId = req.params.id;
            const messageData = req.body; // Get the updated data from the form

            // Fetch the current rider details, including the current image
            const currentMessage = (await Message.getMessageById(messageId))[0]; // Fetch current rider details
            

            // Update the rider in the database
            await Message.updateMessage(messageId, messageData);

            // Redirect to the riders list with a success message
            this.sendSuccess(res, {}, 'Message updated successfully!', 200, '/admin/messages-list')

        } catch (error) {
            console.error('Failed to update message:', error);
            this.sendError(res, 'Failed to update message');
        }
    }

    async deleteMessage(req, res) {
        const messageId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentMessage = (await Message.getMessageById(messageId))[0]; // Fetch current rider details
            if (!currentMessage) {
                return this.sendError(res, 'Message not found');
            }

            // Step 3: Delete the rider from the database
            const result = await Message.deleteMessageById(messageId);
            if (result) {
                // Redirect to the riders list after deletion
                this.sendSuccess(res, {}, 'Message deleted successfully!', 200, '/admin/messages-list')

            } else {
                this.sendError(res, 'Failed to delete message');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            this.sendError(res, 'Failed to delete message');
        }
    }
    

}


module.exports = new MessageController();
