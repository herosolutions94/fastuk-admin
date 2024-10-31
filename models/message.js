const pool = require('../config/db-connection'); // Ensure this is promise-based

class Message {
    static async getAllMessages() {
        try {
            const [rows] = await pool.query('SELECT * FROM messages'); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }
    // Add a new method to fetch a rider by id
    static async getMessageById(id) {
        const [message] = await pool.query('SELECT * FROM messages WHERE id = ?', [id]);
        if (message.length > 0) {
            // Update the status to 1 (read) if it's currently 0 (unread)
            if (message[0].status === 0) {
                await pool.query('UPDATE messages SET status = 1 WHERE id = ?', [id]);
            }
            return message;    
        } else {
            return null; // No message found
        }
    } catch (error) {
        console.error('Error fetching message:', error);
        throw error;
    }

    // Add a method to update rider info
    static async updateMessage(id, messageData) {
        const { name, email, phone_number, subject, message, created_date, status } = messageData;
        await pool.query(
            'UPDATE messages SET name = ?, email = ?, phone_number = ?, subject = ?, message = ?, created_date = NOW(), status = ? WHERE id = ?',
            [name, email, phone_number, subject, message, status, id]
        );
    }
    // models/rider.js
static async deleteMessageById(id) {
    try {
        const [result] = await pool.query('DELETE FROM messages WHERE id = ?', [id]);
        return result.affectedRows > 0; // Returns true if a row was deleted
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Failed to delete message');
    }
}


}
module.exports = Message;
