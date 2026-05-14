// controllers/api/RiderController.js
const fs = require("fs"); // Import the file system module
const path = require("path"); // For handling file paths

const BaseController = require("../baseController");
const RequestQuote = require("../../models/request-quote");
const Member = require("../../models/memberModel");
const Rider = require("../../models/riderModel");
const PaymentMethodModel = require("../../models/api/paymentMethodModel"); // Assuming you have this model
const Vehicle = require("../../models/vehicle");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


const { validateRequiredFields } = require("../../utils/validators");
const helpers = require("../../utils/helpers");

class PendingPaymentQuoteController extends BaseController {
  constructor() {
    super();
    this.member = new Member();
    this.rider = new Rider();
    this.requestQuote = new RequestQuote();
    this.paymentMethodModel = new PaymentMethodModel();
  }

  async getPendingPaymentQuotes(req, res) {
    try {
      const requestQuotesWithMembers =
        await RequestQuote.getRequestQuotesWithMembers([
          "rq.status = 'pending_payment'"
        ]);

      res.render("admin/pending-payment-quotes", {
        requestQuotes: requestQuotesWithMembers,
        pageHeading: "Pending Payment Quotes"
      });

    } catch (error) {
      console.error("Error fetching pending payment quotes:", error);
      this.sendError(res, "Failed to fetch pending payment request quotes");
    }
  }

async handlePendingPayment(req, res) {
  try {
    const { request_id, adjusted_amount, action } = req.body;

    if (!request_id) {
      return res.json({ status: 0, msg: "Request ID required" });
    }

    // Get order/request details
    const requestDetails = await RequestQuote.getRequestQuoteById(request_id);

    if (!requestDetails || !requestDetails.length) {
      return res.json({ status: 0, msg: "Request not found" });
    }

    const order = requestDetails[0];

    const pendingPayment = await this.rider.getPendingPaymentByRequestId(order.id); // Add this method in your model
      

    // Original pending payment amount
    const originalAmount = parseFloat(pendingPayment?.amount || 0);
    console.log("Original pending payment amount:", originalAmount);

    // Admin entered amount
    const enteredAmount = adjusted_amount
      ? parseFloat(adjusted_amount)
      : null;
console.log("Admin entered adjusted amount:", enteredAmount);
    // Validation
    if (
      enteredAmount !== null &&
      (isNaN(enteredAmount) || enteredAmount < 0)
    ) {
      return res.json({
        status: 0,
        msg: "Invalid adjusted amount",
      });
    }

    // Admin cannot add more than original amount
    if (
      enteredAmount !== null &&
      enteredAmount > originalAmount
    ) {
      return res.json({
        status: 0,
        msg: `Amount cannot be greater than original amount (£${originalAmount})`,
      });
    }

    // Remaining amount
    // Example:
    // Original = 200
    // Admin entered = 150
    // adjusted_quote_amount = 50
    let adjustedQuoteAmount = 0;

    if (
      enteredAmount !== null &&
      enteredAmount < originalAmount
    ) {
      adjustedQuoteAmount = originalAmount - enteredAmount;
    }

    // =====================================================
    // CASE 1: UPDATE AMOUNT ONLY
    // =====================================================
    if (!action || action === "update_only") {

      await this.member.updateRequestQuoteData(request_id, {
        adjusted_quote_amount: adjustedQuoteAmount,
      });

      return this.sendSuccess(
        res,
        {},
        "Amount updated successfully",
        200,
        "/admin/pending-payment-quotes"
      );
    }

    // =====================================================
    // CASE 2: MARK JOB COMPLETE
    // =====================================================
    if (action === "force_complete") {

      // Save adjusted amount if admin entered anything
      await this.member.updateRequestQuoteData(request_id, {
        adjusted_quote_amount: adjustedQuoteAmount,
        admin_force_completed: 1,
        status: "completed",
      });

      // Optional helper if needed
      await helpers.updateRequestQuoteJobStatus(request_id, true);

      return this.sendSuccess(
        res,
        {},
        "Job marked as completed",
        200,
        "/admin/pending-payment-quotes"
      );
    }

    return res.json({
      status: 0,
      msg: "Invalid action selected",
    });

  } catch (error) {
    console.error("Pending payment error:", error);

    return res.json({
      status: 0,
      msg: "Server error",
    });
  }
}


}

module.exports = PendingPaymentQuoteController;
