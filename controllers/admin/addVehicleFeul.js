// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const helpers = require('../../utils/helpers');

const BaseController = require('../baseController');
const vehicleFuelModel = require('../../models/VehicleFuelModel');
const { validateRequiredFields } = require('../../utils/validators');
const message = require('./message');
const VehicleCategories = require('../../models/vehicle-categories');



class vehicleFuelController extends BaseController {
   constructor() {
    super();
    this.vehicleFuelModel = vehicleFuelModel; // ✅ no "new"
}

    async renderAddFuelPage(req, res) {
        const { rider_id } = req.params;
        try {
            // Get previous fuel records
        const fuelLogs = await this.vehicleFuelModel.getFuelByRiderId(rider_id);

            res.render('admin/add-vehicle-fuel', {rider_id, fuelLogs: fuelLogs || []}); // Render the add-testimonial.ejs file
        } catch (error) {
            console.error('Error rendering add vehicle page:', error);
            return this.sendError(res, 'Failed to load add vehicle page');
        }
    }

async addVehicleFuel(req, res) {
    try {
        // ✅ get rider_id from params
        const { rider_id } = req.params;

        const {
            litres,
            price_per_litre,
            status,
        } = req.body;

        console.log("req.body:",req.body)

        // ✅ Clean data
        const cleanedData = {
            rider_id: rider_id ? parseInt(rider_id) : null,
            litres: litres ? parseFloat(litres) : null,
            price_per_litre: price_per_litre ? parseFloat(price_per_litre) : null,
            status: status || 0,
        };

        // ✅ Validation
        // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ status: 0, msg: 'All fields are required!', message: "All fields are required!" });
            }

        // ✅ Extra validation (important)
        if (
            isNaN(cleanedData.litres) ||
            isNaN(cleanedData.price_per_litre)
        ) {
            return res.json({
                status: 0,
                msg: "Invalid number values!",
            });
        }

        // ✅ Calculate total
        const total_amount =
            cleanedData.litres * cleanedData.price_per_litre;

        // ✅ Save
        await this.vehicleFuelModel.createVehicleFuel({
            rider_id: cleanedData.rider_id,
            litres: cleanedData.litres,
            price_per_litre: cleanedData.price_per_litre,
            total_amount,
            status: cleanedData.status,
        });

        return res.json({
            status: 1,
            message: 'Fuel added successfully!',
            redirect_url: `/admin/vehicle-fuel-list/${rider_id}`
        });

    } catch (error) {
        console.error("Fuel Error:", error);

        return res.status(500).json({
            status: 0,
            message: "Error adding fuel",
            error: error.message,
        });
    }
}
    async getVehicleFuel(req, res) {
    const { rider_id } = req.params;

    try {
        const vehicleFuels =
            await this.vehicleFuelModel.getFuelByRiderId(rider_id);

        res.render('admin/fuel-list', {
            vehicleFuels: vehicleFuels || [],
            rider_id
        });

    } catch (error) {
        console.error('Error fetching vehicle fuels:', error);
        this.sendError(res, 'Failed to fetch vehicle fuels');
    }
}

    async editVehicleFuel(req, res) {
    try {
        const fuel_id = req.params.fuel_id; // ✅ fuel row id
        // console.log("fuel_id:",fuel_id)

        // ✅ Fetch fuel record
        const fuelData = (await this.vehicleFuelModel.getVehicleFuelById(fuel_id))[0];
        // console.log("fuelData:",fuelData)

        // ✅ Check if exists
        if (!fuelData) {
            return res.redirect(`/admin/vehicle-fuel-list/${fuelData?.rider_id}`);
        }

        // ✅ Render edit page
        res.render('admin/edit-vehicle-fuel', {
            fuel: fuelData,
            editFuelId: fuel_id,
            status: fuelData.status
        });

    } catch (error) {
        console.error('Error fetching fuel:', error);
        this.sendError(res, 'Failed to fetch fuel data');
    }
}

    async updateVehicleFuel(req, res) {
    try {
        const fuel_id = req.params.fuel_id;
        const vehicleData = req.body;
        console.log(fuel_id,vehicleData)

        // optional: check exists
        const currentFuel = (await this.vehicleFuelModel.getVehicleFuelById(fuel_id))[0];

        if (!currentFuel) {
            return res.json({
                status: 0,
                message: "Fuel record not found"
            });
        }

        // update DB
        await this.vehicleFuelModel.updateVehicleFuel(fuel_id, vehicleData);

        return res.json({
            status: 1,
            message: 'Fuel updated successfully!',
            redirect_url: `/admin/vehicle-fuel-list/${currentFuel.rider_id}`
        });

    } catch (error) {
        console.error('Failed to update fuel:', error);
        return res.status(500).json({
            status: 0,
            message: 'Failed to update fuel'
        });
    }
}

    async deleteAdminVehicle(req, res) {
        const vehicleId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentVehicle = (await Vehicle.getAdminVehicleById(vehicleId))[0]; // Fetch current rider details
            if (!currentVehicle) {
                return this.sendError(res, 'Vehicle not found');
            }

            const vehicleImage = currentVehicle.vehicle_image; // Get the image filename
            // console.log('vehicle to delete:', currentVehicle); // Log rider details for debugging

            // Step 2: Check if the rider has an associated image
            if (vehicleImage) {
                const imagePath = path.join(__dirname, '../../uploads/', vehicleImage);
                const thumbPath = path.join(__dirname, '../../uploads/thumbnails/', vehicleImage);

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
            const result = await Vehicle.deleteAdminVehicleById(vehicleId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Vehicle deleted successfully!',
                    redirect_url: '/admin/admin-vehicles-list'
                });
            } else {
                this.sendError(res, 'Failed to delete vehicle');
            }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting vehicle.',
                error: error.message
            });
        }
    }





}



module.exports = vehicleFuelController;

