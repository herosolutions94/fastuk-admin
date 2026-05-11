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

    const amount = parseFloat(adjusted_amount || 0);

    // 👉 CASE 1: Only update amount (NO action selected)
    if (!action) {
      await RequestQuote.updatePendingPaymentByRequestId(request_id, amount, false);

      return this.sendSuccess(
        res,
        {},
        "Amount updated only",
        200,
        "/admin/pending-payment-quotes"
      );
    }

    // 👉 CASE 2: Mark as Paid or Force Complete
    if (action === "mark_paid" || action === "force_complete") {
      await RequestQuote.updatePendingPaymentByRequestId(request_id, amount, true);

      // ✅ Only here we update request/job status
      await helpers.updateRequestQuoteJobStatus(request_id, true);
    }

    const updated = await RequestQuote.getRequestQuoteById(request_id);
    console.log("UPDATED STATUS:", updated[0]?.status);

    this.sendSuccess(
      res,
      {},
      "Pending payment resolved",
      200,
      "/admin/pending-payment-quotes"
    );

  } catch (error) {
    console.error("Pending payment error:", error);
    return res.json({ status: 0, msg: "Server error" });
  }
}


}

module.exports = PendingPaymentQuoteController;
