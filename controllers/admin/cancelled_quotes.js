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

class CancelledQuoteController extends BaseController {
  constructor() {
    super();
    this.member = new Member();
    this.rider = new Rider();
    this.requestQuote = new RequestQuote();
    this.paymentMethodModel = new PaymentMethodModel();
  }

  async getCancelledQuotes(req, res) {
    try {
      const requestQuotesWithMembers =
        await RequestQuote.getRequestQuotesWithMembers([
          "rq.is_cancelled IN ('requested', 'approved')"
        ]);

      res.render("admin/cancelled-quotes", {
        requestQuotes: requestQuotesWithMembers,
        pageHeading: "Cancelled Request Quotes"
      });

    } catch (error) {
      console.error("Error fetching cancelled quotes:", error);
      this.sendError(res, "Failed to fetch cancelled request quotes");
    }
  }



  async handleCancellation(req, res) {
    try {
      const { request_id, cancellation_payment_charges, action } = req.body;

      if (!["approved", "rejected"].includes(action)) {
        return this.sendError(res, "Invalid action selected");
      }

      const statusText = action;
      const updateData = { is_cancelled: action };

      if (action === "approved" && cancellation_payment_charges) {
        updateData.cancellation_payment_charges = cancellation_payment_charges;
      }

      // 1️⃣ Fetch order before refund
let [order] = await RequestQuote.getRequestQuoteById(request_id);
if (!order) return this.sendError(res, "Order not found");

const userRow = await this.member.findById(order.user_id);
      if (!userRow) {
        return res.status(200).json({ status: 0, msg: "Error fetching user" });
      }
const viasCount = await this.rider.countViasBySourceCompleted(order.id);
    const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
    const vias = await this.rider.getViasByQuoteId(order.id);
    const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
    const reviews = await this.rider.getOrderReviews(order.id);
    const order_stages_arr = await this.rider.getRequestOrderStages(order.id);

    // ---------- MERGE DATA INTO ORDER ----------
    order = {
      ...order,
      formatted_start_date: helpers.formatDateToUK(order?.start_date),
      parcels,
      vias,
      invoices,
      viasCount,
      reviews,
      order_stages: order_stages_arr,
    };

// 2️⃣ Only attempt refund if approved and credit-card payment exists
let refundSucceeded = false;

if (
  action !== "pending" &&
  action !== "cancelled" && 
  order.payment_method === "credit-card" &&
  order.payment_intent &&
  parseFloat(cancellation_payment_charges) > 0
) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(order.payment_intent);
    const latestChargeId = paymentIntent.latest_charge;
    // console.log("Latest charge ID:", latestChargeId);

    if (!latestChargeId) {
      console.log("No charge found. Cannot refund.");
    } else {
      const charge = await stripe.charges.retrieve(latestChargeId);
      // console.log("Charge details:", charge);
      const unrefundedAmount = charge.amount - (charge.amount_refunded || 0);
      // console.log("Unrefunded amount:", unrefundedAmount);

      if (unrefundedAmount > 0) {
        const refundAmount = Math.min(Math.round(cancellation_payment_charges * 100), unrefundedAmount);

        const refundResponse = await stripe.refunds.create({
          charge: latestChargeId,
          amount: refundAmount,
        });
        // console.log("Refund response:", refundResponse);

        if (refundResponse.status === "succeeded") {
          refundSucceeded = true;

          // 3️⃣ Update is_refunded
          updateData.is_refunded = 1;

          // 4️⃣ Insert transaction
          await helpers.storeTransaction({
            user_id: order.user_id,
            amount: refundResponse.amount / 100,
            payment_method: "refund",
            type: "credit",
            transaction_id: request_id,
            payment_intent: refundResponse.payment_intent,
            created_time: helpers.getUtcTimeInSeconds(),
            status: "refunded",
            stripe_refund_id: refundResponse.id || null
          });

          // console.log("Refund succeeded: is_refunded updated and transaction inserted");
        }
      } else {
        console.log("Charge already fully refunded. No update or transaction inserted.");
      }
    }
  } catch (err) {
    console.error("Stripe refund error:", err);
  }
}

// 5️⃣ Update request quote (is_refunded will only be set if refundSucceeded)
await this.member.updateRequestQuoteData(request_id, updateData);
// console.log("Request quote updated successfully", updateData);

      console.log("Request quote updated successfully");

      const adminData = res.locals.adminData;

      // Send notification email
      await helpers.sendEmail(
        userRow.email,
        `Cancellation Request ${statusText} - FastUK`,
        "cancel-request",
        {
          adminData,
          order,
          requestedBy: null,
          reason: null,
          statusText,
          cancellation_payment_charges,
          refundSucceeded,
        }
      );
      // this.sendSuccess(res, {}, 'Cancel request approved and amount refunded successfully!', 200, '/admin/cancelled-quotes')
      // Send toaster message based on action
    if (action === "approved") {
      this.sendSuccess(
        res,
        {},
        "Cancel request approved and amount refunded successfully!",
        200,
        "/admin/cancelled-quotes"
      );
    } else if (action === "rejected") {
      this.sendSuccess(
        res,
        {},
        "Cancellation request rejected.",
        200,
        "/admin/cancelled-quotes"
      );
    }



      // res.redirect(`/admin/cancelled-quotes`);
    } catch (error) {
      console.error("Error handling cancellation:", error);
      this.sendError(res, "Failed to process cancellation request");
    }
  }























}

module.exports = CancelledQuoteController;
