// controllers/api/RiderController.js
const fs = require("fs"); // Import the file system module
const path = require("path"); // For handling file paths

const BaseController = require("../baseController");
const SubAdmin = require("../../models/sub-admin");
const { validateRequiredFields } = require("../../utils/validators");
const bcrypt = require("bcrypt");

class SubAdminController extends BaseController {
  constructor() {
    super();
    this.subAdmin = new SubAdmin();
  }

  renderAddSubAdminPage(req, res) {
    try {
      res.render("admin/add-sub-admin"); // Render the add-testimonial.ejs file
    } catch (error) {
      console.error("Error rendering add sub admin page:", error);
      return this.sendError(res, "Failed to load add sub admin page");
    }
  }

  async addSubAdmin(req, res) {
    try {
      const { name, user_name, password, status, type } = req.body;
      console.log("req.body", req.body); // To check if name and description are being sent

      // Clean and trim data
      const cleanedData = {
        name: typeof name === "string" ? name.trim() : "",
        user_name: typeof user_name === "string" ? user_name.trim() : "",
        password: typeof password === "string" ? password.trim() : "",
        status: status || 0,
        type: "sub_admin" || 0
      };

      cleanedData.password = await bcrypt.hash(cleanedData.password, 10);

      // Validation for empty fields
      if (!validateRequiredFields(cleanedData)) {
        return res
          .status(200)
          .json({ success: false, message: "All fields are required." });
      }
      // Create the rider
      const subAdminId = await this.subAdmin.createSubAdmin(cleanedData);
      console.log("Created SubAdmin ID:", subAdminId); // Log the created rider ID

      // Verify OTP was stored properly
      const createdSubAdmin = await this.subAdmin.findById(subAdminId);
      console.log("Created Service:", createdSubAdmin); // Log the created rider
      res.json({
        status: 1,
        message: "SubAdmin added successfully!",
        redirect_url: "/admin/sub-admins"
      });
    } catch (error) {
      return res.status(200).json({
        // Changed to status 500 for server errors
        status: 0,
        message: "An error occurred while adding sub admin.",
        error: error.message
      });
    }
  }

  async getSubAdmins(req, res) {
    try {
      const subAdmins = await SubAdmin.getAllSubAdmins();
      // console.log('Fetched Riders:', riders); // Log the fetched riders

      res.render("admin/sub-admins", { subAdmins: subAdmins || [] });
    } catch (error) {
      console.error("Error fetching sub-admins:", error); // Log the error for debugging
      this.sendError(res, "Failed to fetch sub-admins");
    }
  }

  async editSubAdmin(req, res) {
    try {
      const subAdminId = req.params.id; // Get the rider ID from the request parameters
      console.log("Fetching service with ID:", subAdminId); // Log the ID

      // Fetch the rider by ID
      const subAdmin = (
        await SubAdmin.getSubAdminById(subAdminId, "sub_admin")
      )[0]; // Extract the first rider if it's returned as an array
      console.log("Fetched sub admin:", subAdmin); // Log fetched rider data

      console.log("sub admin data before rendering:", subAdmin); // Log the rider data

      // Check if rider exists
      if (subAdmin) {
        // Assuming `result` is defined properly, or you should use rider.rider_image
        res.render("admin/edit-sub-admin", {
          subAdmin,
          editSubAdminId: subAdminId,
          status: subAdmin.status // Pass the status to the view
        });
      } else {
        this.sendError(res, "sub admin not found");
      }
    } catch (error) {
      console.error("Error fetching sub admin:", error); // Log the error for debugging
      this.sendError(res, "Failed to fetch sub admin");
    }
  }

  async updateSubAdmin(req, res) {
    try {
      const subAdminId = req.params.id;
      const subAdminData = req.body;

      // Fetch the current testimonial details
      const currentSubAdmin = (
        await SubAdmin.getSubAdminById(subAdminId, "sub_admin")
      )[0];

      // Debugging output
      console.log("Current SubAdmin:", currentSubAdmin);

      // Update the service in the database
      await SubAdmin.updateSubAdmin(subAdminId, subAdminData);

      // Respond with success
      res.json({
        status: 1,
        message: "SubAdmin updated successfully!",
        redirect_url: "/admin/sub-admins"
      });
    } catch (error) {
      console.error("Failed to update sub-admins:", error);
      res.status(500).json({
        status: 0,
        message: "Failed to update sub-admins"
      });
    }
  }

  async deleteSubAdmin(req, res) {
    const subAdminId = req.params.id;
    try {
      // Step 1: Fetch the rider details to get the associated image filename
      const currentSubAdmin = (
        await SubAdmin.getSubAdminById(subAdminId, "sub_admin")
      )[0]; // Fetch current rider details
      if (!currentSubAdmin) {
        return this.sendError(res, "Sub admin not found");
      }

      // Step 3: Delete the rider from the database
      const result = await SubAdmin.deleteSubAdminById(subAdminId);
      if (result) {
        // Redirect to the riders list after deletion
        res.json({
          status: 1,
          message: "Sub Admin deleted successfully!",
          redirect_url: "/admin/sub-admins"
        });
      } else {
        this.sendError(res, "Failed to delete Sub Admin");
      }
    } catch (error) {
      return res.status(200).json({
        // Changed to status 500 for server errors
        status: 0,
        message: "An error occurred while deleting Sub Admin.",
        error: error.message
      });
    }
  }

  async getPermissionsPage(req, res) {
    try {
      const { sub_admin_id } = req.params;

      if (!sub_admin_id) {
        return this.errorResponse(res, "Sub admin ID is required.", 400);
      }

      // Fetch all permissions
      const permissions = await SubAdmin.getAllPermissions();

      // Fetch assigned permissions for the sub-admin
      const assignedPermissions = await SubAdmin.getPermissions(sub_admin_id);
      console.log("assignedPermissions:", assignedPermissions);

      // Render the permissions page
      res.render("admin/permissions", {
        subAdminId: sub_admin_id,
        permissions: permissions,
        assignedPermissions: assignedPermissions
      });
    } catch (error) {
      console.error("Failed to load permissions page:", error);
      return this.errorResponse(
        res,
        "An error occurred while loading permissions.",
        500,
        error
      );
    }
  }

  async manageSubAdminPermissions(req, res) {
    try {
      console.log("🛠️ Full Request Body:", req.body);

      const { permission, sub_admin_id } = req.body;
      console.log("Received permissions:", req.body.permission);
      console.log("Sub Admin ID:", req.body.sub_admin_id);

      if (!sub_admin_id) {
        return this.sendError(res, "Sub admin ID is required.", 400);
      }

      const permissions = Array.isArray(req.body.permission)
        ? req.body.permission
        : [req.body.permission];

      console.log("🚀 Incoming Permissions:", permissions); // Debugging

      // Step 1: Delete Previous Permissions
      const deleteResult = await SubAdmin.deletePermissions(sub_admin_id);
      console.log(
        `✅ Deleted old permissions for SubAdmin ID: ${sub_admin_id}`
      );
      console.log("Deleted permissions result:", deleteResult);

      // Step 2: Insert New Permissions
      if (permissions.length > 0) {
        await SubAdmin.assignPermissions(sub_admin_id, permissions);
        console.log(
          `✅ Assigned new permissions: ${permissions} for SubAdmin ID: ${sub_admin_id}`
        );
      }

      // Step 3: Fetch All Permissions
      const assignedPermissions = await SubAdmin.getPermissions(sub_admin_id);
      console.log("🎯 Assigned Permissions:", assignedPermissions); // Debug log

      
      res.json({
        status: 1,
        message: "Permissions updated successfully!",
        redirect_url:  "/admin/subadmin-permissions/"+sub_admin_id
    });
    } catch (error) {
      console.error("❌ Failed to manage permissions:", error);
      return this.sendError(
        res,
        "An error occurred while managing permissions.",
        500
      );
    }
  }
}

module.exports = SubAdminController;
