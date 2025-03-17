

const WithdrawaRequestModel = require('../../models/withdraw-requests');
const RiderModel = require('../../models/riderModel');
const BaseController = require('../baseController');
const helpers = require('../../utils/helpers');

class WithdrawaRequestController extends BaseController {
    constructor() {
        super();
        this.riderModel = new RiderModel();
      }
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
          // console.log('Withdrawal Request ID:', withdrawalRequestId);
      
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
            // console.log('Deleting withdrawal request with ID:', withdrawalRequestId);
    
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
            const withdrawalRequest = await WithdrawaRequestModel.getWithdrawalRequestById(withdrawalRequestId);
            let adminData = res.locals.adminData;
          if (withdrawalRequest) {
            const result = await WithdrawaRequestModel.updateWithdrawalStatus(withdrawalRequestId);
                // console.log('withdrawalRequest',withdrawalRequest)
              if (result) {
                const userRow = await this.riderModel.findById(withdrawalRequest?.rider_id);
                // console.log('userRow',userRow)
                  if (userRow) {
                      await helpers.sendEmail(
                          userRow.email,
                          `Your Withdrawal Has Been Processed Successfully`,
                          "withraw-user",
                          {
                              username: userRow?.full_name,
                              adminData,
                              account_details:withdrawalRequest?.account_details ? withdrawalRequest?.account_details : withdrawalRequest?.paypal_details,
                              amount:withdrawalRequest?.amount,
                          }
                      );
                  }
                // Redirect back to the withdrawal requests list after approving
                res.redirect('/admin/withdraw-requests-list');
              } else {
                this.sendError(res, 'Failed to approve withdrawal request');
              }
          } else {
            res.status(200).send('Withdrawal Request not found');
          }
          // Update the status of the withdrawal request
          
        } catch (error) {
          console.error('Error approving withdrawal request:', error);
          res.status(200).send('Failed to approve withdrawal request');
        }
      }
      
    

}


module.exports = new WithdrawaRequestController();
