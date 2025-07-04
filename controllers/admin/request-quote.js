// controllers/api/RiderController.js
const fs = require("fs"); // Import the file system module
const path = require("path"); // For handling file paths

const BaseController = require("../baseController");
const RequestQuote = require("../../models/request-quote");
const Member = require("../../models/memberModel");
const Rider = require("../../models/riderModel");
const PaymentMethodModel = require("../../models/api/paymentMethodModel"); // Assuming you have this model
const Vehicle = require("../../models/vehicle");

const { validateRequiredFields } = require("../../utils/validators");
const helpers = require("../../utils/helpers");

class RequestQuoteController extends BaseController {
  constructor() {
    super();
    this.member = new Member();
    this.rider = new Rider();
    this.requestQuote = new RequestQuote();
    this.paymentMethodModel = new PaymentMethodModel();
  }

  async getCompletedRequestQuotes(req, res) {
    try {
      // const id = req.body; // Fetch ID from route params if available

      const requestQuotesWithMembers =
        await RequestQuote.getRequestQuotesWithMembers([
          "rq.status = 'completed'"
        ]);

      // console.log('Completed Request Quotes:', requestQuotesWithMembers);

      res.render("admin/request-quotes", {
        requestQuotes: requestQuotesWithMembers,
        pageHeading: "Completed Request Quotes"
      });
    } catch (error) {
      console.error("Error fetching request quotes with members:", error);
      this.sendError(res, "Failed to fetch request quotes");
    }
  }
  async getInProgressRequestQuotes(req, res) {
    try {
      // const id = req.body; // Fetch ID from route params if available

      const requestQuotesWithMembers =
        await RequestQuote.getRequestQuotesWithMembers([
          "rq.status = 'accepted'"
        ]);

      // console.log('Request Quotes:', requestQuotesWithMembers);

      res.render("admin/request-quotes", {
        requestQuotes: requestQuotesWithMembers,
        pageHeading: "In Progress Request Quotes"
      });
    } catch (error) {
      console.error("Error fetching request quotes with members:", error);
      this.sendError(res, "Failed to fetch request quotes");
    }
  }
  async getUpcomingRequestQuotes(req, res) {
    try {
      // const id = req.body; // Fetch ID from route params if available

      const requestQuotesWithMembers =
        await RequestQuote.getRequestQuotesWithMembers([
          "rq.status = 'paid'",
          "rq.start_date > CURDATE()"
        ]);

      // console.log('Request Quotes:', requestQuotesWithMembers);

      res.render("admin/request-quotes", {
        requestQuotes: requestQuotesWithMembers,
        pageHeading: "Upcoming Request Quotes"
      });
    } catch (error) {
      console.error("Error fetching request quotes with members:", error);
      this.sendError(res, "Failed to fetch request quotes");
    }
  }

  async getOrderDetails(req, res) {
    try {
      const { id } = req.params; // Get the order ID from the route parameters

      const orderDetails = await RequestQuote.getOrderDetailsById(id);
      if (!orderDetails) {
        return this.sendError(res, "Order not found");
      }

      const parcels = await this.rider.getParcelDetailsByQuoteId(
        orderDetails.id
      );
      // const invoices = await this.rider.getInvoicesDetailsByRequestId(orderDetails.id);
      const reviews = await this.rider.getOrderReviews(orderDetails.id);

      // console.log("invoices:",invoices)
      // console.log("invoices date:",orderDetails?.invoices?.created_date)
      // console.log("reviews:",reviews)

      const encodedId = helpers.doEncode(orderDetails.id); // Encode ID properly

      const source_attachments = await helpers.getDataFromDB(
        "request_quote_attachments",
        { request_id: orderDetails.id, type: "source" }
      );
      const destination_attachments = await helpers.getDataFromDB(
        "request_quote_attachments",
        { request_id: orderDetails.id, type: "destination" }
      );

      const categoryInfo = orderDetails.selected_vehicle
                  ? await Vehicle.getCategoryAndMainCategoryById(orderDetails.selected_vehicle)
                  : null;
            
                  // console.log("categoryInfo:",categoryInfo)



      const order = {
        ...orderDetails,
        formatted_start_date: helpers.formatDateToUK(orderDetails.start_date),
        category_name: categoryInfo?.category_name || null,
        main_category_name: categoryInfo?.main_category_name || null,
        encodedId: encodedId,
        parcels: parcels,
        // invoices: invoices,
        reviews: reviews,
        source_attachments: source_attachments,
        vias: orderDetails.vias || [],
        destination_attachments: destination_attachments
      };
      //  console.log("orderDetails:",order)

      for (let via of order.vias) {
        const via_attachments = await helpers.getDataFromDB(
          "request_quote_attachments",
          {
            request_id: order.id,
            type: "via",
            via_id: via?.id
          }
        );
        via.attachments = via_attachments;
      }

      res.render("admin/order-details", {
        order
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      this.sendError(res, "Failed to fetch order details");
    }
  }

  async deleteRequestQuote(req, res) {
    const requestQuoteId = req.params.id;
    try {
      // Step 1: Fetch the rider details to get the associated image filename
      const currentRequestQuote = (
        await RequestQuote.getRequestQuoteById(requestQuoteId)
      )[0]; // Fetch current rider details
      if (!currentRequestQuote) {
        return this.sendError(res, "Request Quote not found");
      }

      // Step 3: Delete the rider from the database
      const result = await RequestQuote.deleteRequestQuoteById(requestQuoteId);
      if (result) {
        // Redirect to the riders list after deletion
        res.json({
          status: 1,
          message: "Request Quote deleted successfully!",
          redirect_url: "/admin/request-quotes-list"
        });
      } else {
        this.sendError(res, "Failed to delete request quote");
      }
    } catch (error) {
      return res.status(200).json({
        // Changed to status 500 for server errors
        status: 0,
        message: "An error occurred while deleting request quote.",
        error: error.message
      });
    }
  }
}

module.exports = RequestQuoteController;
