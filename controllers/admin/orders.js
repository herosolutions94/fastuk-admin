

const Order = require('../../models/order');
const BaseController = require('../baseController');

class OrderController extends BaseController {
    // Method to get the riders and render them in the view
    async getAcceptedOrders(req, res) {
        try {
            const orders = await Order.getAllAcceptedOrders();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            if (orders && orders.length > 0) {
                // Corrected res.render with only two arguments
                res.render('admin/order', { orders: orders || [] });
            } else {
                this.sendError(res, 'No orders found');
            }
        } catch (error) {
            console.error('Error fetching orders:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch orders');
        }
    }
    // Method to fetch a single rider by id and render the edit form
    async orderDetail(req, res) {
        try {
            const orderId = req.params.id;  // Get the rider ID from the request parameters
            // console.log('Fetching rider with ID:', messageId); // Log the ID
    
            // Fetch the rider by ID
            const order = (await Order.getOrderById(orderId))[0]; // Extract the first rider if it's returned as an array
            // console.log('Fetched message:', message); // Log fetched rider data

            // console.log('Message data before rendering:', message); // Log the rider data

    
            // Check if rider exists
            if (order) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/order-detail', { 
                    order, 
                    editOrderId: orderId, 
                });
            } else {
                this.sendError(res, 'Order not found');
            }
        } catch (error) {
            console.error('Error fetching Order:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch Order');
        }
    }
    
    async deleteOrder(req, res) {
        const orderId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentOrder = (await Order.getOrderById(orderId))[0]; // Fetch current rider details
            if (!currentOrder) {
                return this.sendError(res, 'Order not found');
            }

            // Step 3: Delete the rider from the database
            const result = await Order.deleteOrderById(orderId);
            if (result) {
                // Redirect to the riders list after deletion
                this.sendSuccess(res, {}, 'Order deleted successfully!', 200, '/admin/orders-list')

            } else {
                this.sendError(res, 'Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            this.sendError(res, 'Failed to delete order');
        }
    }
    

}


module.exports = new OrderController();
