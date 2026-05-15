const fs = require("fs"); // Import the file system module
const path = require("path"); // For handling file paths

const Rider = require("../../models/rider");
const RiderModel = require("../../models/riderModel");
const VehicleModel = require("../../models/vehicle");


const RequestQuoteModel = require("../../models/request-quote"); // Assuming you have this model

const BaseController = require("../baseController");
const helpers = require("../../utils/helpers");

class PayoutsController extends BaseController {
  // Method to get the riders and render them in the view

  constructor() {
    super();
    this.riderModel = new RiderModel();
    this.vehicleModel = new VehicleModel();
  }

  async getRiders(req, res) {
    try {
      const riders = await Rider.getAllRiders();

      // Fetch earnings sequentially for each rider
      for (let rider of riders) {
        const earningsData = await this.riderModel.getRiderEarnings(rider.id);
        rider.available_balance = helpers.formatAmount(
          earningsData.availableBalance
        ); // Add balance field to each rider

        const earnings = await this.riderModel.pendingEarnings(rider.id);
        const total = earnings.reduce((sum, item) => {
          return sum + parseFloat(item.amount || 0);
        }, 0);
        rider.total = total;
      }

          

      // Render with updated riders' data
      res.render("admin/pending-payout", { riders });
    } catch (error) {
      console.error("Error fetching riders:", error);
      this.sendError(res, "Failed to fetch riders");
    }
  }

async getRiderPendingEarnings(req, res) {
  try {

    const riderId = req.params.rider_id;

    if (!riderId) {
      return res.json({
        status: 0,
        msg: "Rider ID is required"
      });
    }

    // =====================================================
    // GET FROM MODEL
    // =====================================================
    const earnings = await this.riderModel.pendingEarnings(riderId);

    // Safety check
    if (!earnings || !earnings.length) {
      return res.json({
        status: 1,
        msg: "No pending earnings found",
        data: {
          earnings: [],
          total: 0
        }
      });
    }

    // =====================================================
    // CALCULATE TOTAL
    // =====================================================
    const total = earnings.reduce((sum, item) => {
      return sum + parseFloat(item.amount || 0);
    }, 0);

    res.render("admin/pending-earnings", { earnings, total, riderId });

  } catch (error) {

    console.error("getRiderPendingEarnings error:", error);

    return res.json({
      status: 0,
      msg: "Server error"
    });
  }
}

async renderPayRiderPayoutPage(req, res) {
  try {

    const riderId = req.params.rider_id;

    if (!riderId) {
      return this.sendError(res, "Rider ID is required");
    }

    // =====================================================
    // GET PENDING EARNINGS
    // =====================================================

    const earnings =
      await this.riderModel.pendingEarnings(riderId);

    // =====================================================
    // CALCULATE TOTAL
    // =====================================================

    const totalAmount = earnings.reduce((sum, item) => {
      return sum + parseFloat(item.amount || 0);
    }, 0);

    // =====================================================
    // GET RIDER INFO
    // =====================================================

    const rider =
      await Rider.getRiderById(riderId);

    // =====================================================
    // RENDER PAGE
    // =====================================================

    return res.render(
      "admin/pay-rider",
      {
        riderId,
        rider: rider ? rider[0] : null,
        earnings,
        totalAmount
      }
    );

  } catch (error) {

    console.error(
      "renderPayRiderPayoutPage error:",
      error
    );

    return this.sendError(
      res,
      "Failed to load payout page"
    );
  }
}

async payRiderPendingEarnings(req, res) {
  try {

    const { rider_id, instructions } = req.body;

    if (!rider_id) {
      return res.json({
        status: 0,
        msg: "Rider ID is required"
      });
    }

    // =====================================================
    // GET PENDING EARNINGS
    // =====================================================

    const earnings =
      await this.riderModel.pendingEarnings(rider_id);

    if (!earnings || !earnings.length) {
      return res.json({
        status: 0,
        msg: "No pending earnings found"
      });
    }

    // =====================================================
    // TOTAL
    // =====================================================

    const totalAmount = earnings.reduce((sum, item) => {
      return sum + parseFloat(item.amount || 0);
    }, 0);

    // =====================================================
    // ATTACHMENT
    // =====================================================

    let attachment = null;

    if (req.file) {
      attachment = req.file.filename;
    }

    // =====================================================
    // INSERT PAYOUT HISTORY
    // =====================================================

    await this.riderModel.insertRiderPayout({
      rider_id,
      amount: totalAmount,
      instructions,
      attachment
    });

    // =====================================================
    // MARK EARNINGS PAID
    // =====================================================

    await this.riderModel.markRiderEarningsPaid(rider_id);

    // =====================================================
    // SUCCESS
    // =====================================================

    return this.sendSuccess(
      res,
      {},
      "Payout completed successfully",
      200,
      "/admin/pending-payout"
    );

  } catch (error) {

    console.error("payRiderPendingEarnings error:", error);

    return res.json({
      status: 0,
      msg: "Server error"
    });
  }
}

async getPaidRiderEarnings(req, res) {
  try {

    const riderId = req.params.rider_id;

    if (!riderId) {
      return res.json({
        status: 0,
        msg: "Rider ID is required"
      });
    }

    // =====================================================
    // GET PAID EARNINGS
    // =====================================================

    const earnings =
      await this.riderModel.getPaidEarnings(riderId);

    // =====================================================
    // CALCULATE TOTAL
    // =====================================================

    const totalAmount = earnings.reduce((sum, item) => {
      return sum + parseFloat(item.amount || 0);
    }, 0);

    // =====================================================
    // RENDER PAGE
    // =====================================================

    return res.render(
      "admin/paid-earnings",
      {
        earnings,
        riderId,
        totalAmount
      }
    );

  } catch (error) {

    console.error(
      "getPaidRiderEarnings error:",
      error
    );

    return this.sendError(
      res,
      "Failed to fetch paid earnings"
    );
  }
}









}

module.exports = new PayoutsController();
