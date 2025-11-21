// controllers/api/RiderController.js
const fs = require("fs"); // Import the file system module
const path = require("path"); // For handling file paths

const BaseController = require("../baseController");
const VehicleCategories = require("../../models/vehicle-categories");
const { validateRequiredFields } = require("../../utils/validators");
const helpers = require("../../utils/helpers");

class VehicleCategoriesController extends BaseController {
  constructor() {
    super();
    this.vehicleCategories = new VehicleCategories();
  }

  async renderAddVehicleCategoryPage(req, res) {
    try {
      res.render("admin/add-vehicle-category", {}); // Render the add-testimonial.ejs file
    } catch (error) {
      console.error("Error rendering add Vehicle Category page:", error);
      return this.sendError(res, "Failed to load add Vehicle Category page");
    }
  }

  async addVehicleCategory(req, res) {
    try {
      const { vehicle_name, status } = req.body;
      // console.log("req.body", req.body); // To check if name and description are being sent

      const vehicleCategoryImage =
        req.files && req.files["vehicle_category_image"]
          ? req.files["vehicle_category_image"][0].filename
          : "";

      if (vehicleCategoryImage) {
        const sourceDir = path.join(__dirname, '../../uploads');
        const thumbFolder = 'thumbnails';
        const width = 300;
        const height = 300;

        // ✅ Generate the thumbnail using your helper
        await helpers.generateThumbnail(vehicleCategoryImage, sourceDir, thumbFolder, width, height);
        console.log('Thumbnail created for:', vehicleCategoryImage);

      }

      // Clean and trim data
      const cleanedData = {
        vehicle_name:
          typeof vehicle_name === "string" ? vehicle_name.trim() : "",
        status: status || 0,
        vehicle_category_image: vehicleCategoryImage
      };

      // Validation for empty fields
      if (!validateRequiredFields(cleanedData)) {
        return res
          .status(200)
          .json({ success: false, message: "All fields are required." });
      }
      // Create the rider
      const vehicleCategoryId =
        await this.vehicleCategories.createVehicleCategory(cleanedData);
      // console.log("Created Post Code ID:", vehicleCategoryId); // Log the created rider ID

      // Verify OTP was stored properly
      const createdVehicleCategory = await this.vehicleCategories.findById(
        vehicleCategoryId
      );
      // console.log("Created Vehicle Category:", createdVehicleCategory); // Log the created rider
      res.json({
        status: 1,
        message: "Vehicle Category added successfully!",
        redirect_url: "/admin/vehicle-categories-list"
      });
    } catch (error) {
      return res.status(200).json({
        // Changed to status 500 for server errors
        status: 0,
        message: "An error occurred while adding Vehicle Category.",
        error: error.message
      });
    }
  }
  async getVehicleCategories(req, res) {
    try {
      const vehicleCategories =
        await VehicleCategories.getAllVehicleCategories();
      // console.log('Fetched Riders:', riders); // Log the fetched riders

      res.render("admin/vehicle-categories", {
        vehicleCategories: vehicleCategories || []
      });
    } catch (error) {
      console.error("Error fetching Vehicle Categories:", error); // Log the error for debugging
      this.sendError(res, "Failed to fetch Vehicle Categories");
    }
  }

  async editVehicleCategory(req, res) {
    try {
      const vehicleCategoryId = req.params.id; // Get the rider ID from the request parameters
      // console.log('Fetching vehicle with ID:', promoCodeId); // Log the ID

      // Fetch the rider by ID
      const vehicleCategory = (
        await VehicleCategories.getVehicleCategoriesById(vehicleCategoryId)
      )[0]; // Extract the first rider if it's returned as an array

      // Check if rider exists
      if (vehicleCategory) {
        // Assuming `result` is defined properly, or you should use rider.rider_image
        res.render("admin/edit-vehicle-category", {
          vehicleCategory,
          editVehicleCategoryId: vehicleCategoryId,
          status: vehicleCategory.status, // Pass the status to the view
          imageFilenames: [vehicleCategory.vehicle_category_image] // Make sure to access the rider image correctly
        });
      } else {
        this.sendError(res, "Vehicle Category not found");
      }
    } catch (error) {
      console.error("Error fetching Vehicle Category:", error); // Log the error for debugging
      this.sendError(res, "Failed to fetch Vehicle Category");
    }
  }

  async updateVehicleCategory(req, res) {
    try {
      const vehicleCategoryId = req.params.id;
      const vehicleCategoryData = req.body;

      // Fetch the current testimonial details
      const currentVehicleCategory = (
        await VehicleCategories.getVehicleCategoriesById(vehicleCategoryId)
      )[0];
      const vehicleCategoryImage =
        req.files && req.files["vehicle_category_image"]
          ? req.files["vehicle_category_image"][0].filename
          : null;

      // console.log("Current Remote Post Code:", currentVehicleCategory);

      if (vehicleCategoryImage) {
        // If there is an old image, delete it
        if (currentVehicleCategory.vehicle_category_image) {
          const oldImagePath = path.join(
            __dirname,
            "../../uploads/",
            currentVehicleCategory.vehicle_category_image
          );
          const oldThumbPath = path.join(__dirname, '../../uploads/thumbnails/', currentVehicleCategory.vehicle_category_image);


          // Check if the old image file exists before trying to delete
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err) {
                console.error("Error deleting old image:", err);
              } else {
                console.log("Old image deleted successfully");
              }
            });
          } else {
            console.log("Old image file not found:", oldImagePath);
          }

          if (fs.existsSync(oldThumbPath)) {
            fs.unlink(oldThumbPath, (err) => {
              if (err) console.error('Error deleting old thumbnail:', err);
              else console.log('Old thumbnail deleted successfully');
            });
          } else {
            console.log('Old thumbnail file not found:', oldThumbPath);
          }
        }

        // Update the testimonial data with the new image filename
        vehicleCategoryData.vehicle_category_image = vehicleCategoryImage;
      } else {
        // If no new image is uploaded, retain the old image
        vehicleCategoryData.vehicle_category_image =
          currentVehicleCategory.vehicle_category_image;
      }

      // If a new image is uploaded, generate a thumbnail
      if (vehicleCategoryImage) {
        const sourceDir = path.join(__dirname, '../../uploads');
        const thumbFolder = 'thumbnails';
        const width = 300;
        const height = 300;

        // ✅ Generate the thumbnail using your helper
        await helpers.generateThumbnail(vehicleCategoryImage, sourceDir, thumbFolder, width, height);
        console.log('Thumbnail created for:', vehicleCategoryImage);

        // Update with new image
        vehicleCategoryData.vehicle_category_image = vehicleCategoryImage;
      } else {
        // Retain old image
        vehicleCategoryData.vehicle_category_image = currentVehicleCategory.vehicle_category_image;
      }

      // Update the service in the database
      await VehicleCategories.updateVehicleCategory(
        vehicleCategoryId,
        vehicleCategoryData
      );

      // Respond with success
      res.json({
        status: 1,
        message: "Vehicle Category updated successfully!",
        redirect_url: "/admin/vehicle-categories-list"
      });
    } catch (error) {
      console.error("Failed to update Vehicle Category:", error);
      res.status(200).json({
        status: 0,
        message: "Failed to update Vehicle Category"
      });
    }
  }

  async deleteVehicleCategory(req, res) {
    const vehicleCategoryId = req.params.id;
    // console.log(vehicleCategoryId);
    try {
      // Step 1: Fetch the rider details to get the associated image filename
      const currentVehicleCategory = (
        await VehicleCategories.getVehicleCategoriesById(vehicleCategoryId)
      )[0]; // Fetch current rider details
      if (!currentVehicleCategory) {
        return this.sendError(res, "Promo Code not found");
      }
      // console.log(currentVehicleCategory);

      const vehicleCategoryImage = currentVehicleCategory.vehicle_category_image; // Get the image filename
      // console.log('vehicle to delete:', currentVehicle); // Log rider details for debugging

      // Step 2: Check if the rider has an associated image
      if (vehicleCategoryImage) {
        const imagePath = path.join(__dirname, '../../uploads/', vehicleCategoryImage);
        const thumbPath = path.join(__dirname, '../../uploads/thumbnails/', vehicleCategoryImage);

        // console.log('Image Path:', imagePath); // Log the image path

        // Check if the image file exists before trying to delete
        if (fs.existsSync(imagePath)) {
          console.log('Image found. Deleting now...');
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error('Error deleting vehicle image:', err); // Log the error if deletion fails
            } else {
              console.log('Vehicle image deleted successfully');
            }
          });
        } else {
          console.log('Image file not found:', imagePath); // Log if the image file doesn't exist
        }
        if (fs.existsSync(thumbPath)) {
          fs.unlink(thumbPath, (err) => {
            if (err) console.error('Error deleting thumbnail:', err);
            else console.log('Thumbnail deleted successfully');
          });
        } else {
          console.log('Thumbnail file not found:', thumbPath);
        }
      }

      // Step 3: Delete the rider from the database
      const result = await VehicleCategories.deleteVehicleCategoryById(
        vehicleCategoryId
      );
      if (result) {
        // Redirect to the riders list after deletion
        res.json({
          status: 1,
          message: "Vehicle Category deleted successfully!",
          redirect_url: "/admin/vehicle-categories-list"
        });
      } else {
        this.sendError(res, "Failed to delete Vehicle Category");
      }
    } catch (error) {
      return res.status(200).json({
        // Changed to status 500 for server errors
        status: 0,
        message: "An error occurred while deleting Vehicle Category.",
        error: error.message
      });
    }
  }
}

module.exports = VehicleCategoriesController;
