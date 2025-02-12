

const WithdrawaRequestModel = require('../../models/withdraw-requests');
const BaseController = require('../baseController');

class WithdrawaRequestController extends BaseController {
    // Method to get the riders and render them in the view
    async getWithdrawalRequests(req, res) {
        try {
            const withdrawalRequests = await WithdrawaRequestModel.getAllWithdrawalRequests();

            // if (!withdrawalRequests || withdrawalRequests.length === 0) {
            //   return res.status(200).json({
            //     status: 0,
            //     msg: "No withdrawal requests found.",
            //   });
            // }     

                // Corrected res.render with only two arguments
                res.render('admin/withdraw-request', { withdrawalRequests: withdrawalRequests || [] });
            
        } catch (error) {
            console.error('Error fetching withdrawal requests:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch withdrawal requests');
        }
    }
    // Method to fetch a single rider by id and render the edit form
    async WithdrawalRequestDetail(req, res) {
        try {
          const withdrawalRequestId = req.params.id; // Log the ID
          console.log('Withdrawal Request ID:', withdrawalRequestId);
      
          const withdrawalRequest = await WithdrawaRequestModel.getWithdrawalRequestById(withdrawalRequestId);
      
          if (withdrawalRequest) {
            res.render('admin/view-withdraw-requests', { withdrawalRequest });
          } else {
            res.status(200).send('Withdrawal Request not found');
          }
        } catch (error) {
          console.error('Error:', error);
          res.status(200).send('Server error');
        }
      }
      

    async deleteWithdrawalRequest(req, res) {
        try {
            const withdrawalRequestId = req.params.id; // Get the withdrawal request ID from the URL
            console.log('Deleting withdrawal request with ID:', withdrawalRequestId);
    
            const result = await WithdrawaRequestModel.deleteWithdrawalRequestById(withdrawalRequestId);
            if (result) {
                // Redirect to the riders list after deletion
                this.sendSuccess(res, {}, 'Withdraw request deleted successfully!', 200, '/admin/withdraw-requests-list')
           
                res.status(200).send(result.message); // Send a 404 response if the request doesn't exist
            }
        } catch (error) {
            console.error('Error deleting withdrawal request:', error);
            res.status(200).send('Failed to delete withdrawal request'); // Send a 500 response in case of an error
        }
    }

    async approveWithdrawalRequest(req, res) {
        try {
          const withdrawalRequestId = req.params.id;
    
          // Update the status of the withdrawal request
          const result = await WithdrawaRequestModel.updateWithdrawalStatus(withdrawalRequestId);
    
          if (result) {
            // Redirect back to the withdrawal requests list after approving
            res.redirect('/admin/withdraw-requests-list');
          } else {
            this.sendError(res, 'Failed to approve withdrawal request');
          }
        } catch (error) {
          console.error('Error approving withdrawal request:', error);
          res.status(200).send('Failed to approve withdrawal request');
        }
      }
      
    

}


module.exports = new WithdrawaRequestController();
