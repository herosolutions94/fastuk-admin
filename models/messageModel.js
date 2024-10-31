// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class MessageModel extends BaseModel {
    constructor() {
        super('messages'); // Pass the table name to the BaseModel constructor
    }


    // Method to create a new rider with validation
    async createMessage(data) {
        return this.create(data);  // Call the BaseModel's create method
    }

}

module.exports = MessageModel;
