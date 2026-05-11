// controllers/api/RiderController.js
const fs = require("fs"); // Import the file system module
const path = require("path"); // For handling file paths

const BaseController = require("../baseController");
const Vehicle = require('../../models/vehicle');
const Category = require("../../models/categoryModel");

const { validateRequiredFields } = require("../../utils/validators");
const helpers = require("../../utils/helpers");

class AssignedVehiclesController extends BaseController {
    constructor() {
        super();
        this.vehicle = new Vehicle();
        this.category = new Category();
    }

    async renderAssignVehiclePage(req, res) {
        const { rider_id } = req.params;

        try {
            const vehicles = await Vehicle.getAdminVehiclesArr();
            //   console.log(vehicles);
            res.render("admin/add-assigned-vehicle", { vehicles, rider_id });
        } catch (error) {
            console.error("Error rendering add Category page:", error);
            return this.sendError(res, "Failed to load add Category page");
        }
    }


    async assignVehicleToRider(req, res) {
        const { rider_id } = req.params;
        const { vehicle_id, vehicle_rent } = req.body;
        //     console.log(rider_id, category_id);
        //     console.log("Incoming category_id:", category_id);
        // console.log("Rider ID:", rider_id);

        try {

            await Vehicle.assignRiderVehicle(rider_id, vehicle_id, vehicle_rent);
            await Category.saveRiderCategory(rider_id, vehicle_id);
            return res.redirect(`/admin/rider/vehicles/assigned-vehicles/${rider_id}`);

        } catch (error) {
            console.error("Error saving rider category:", error);
            this.sendError(res, "Failed to save category.");
        }
    }

    async getRiderAssignedVehicles(req, res) {
        const { rider_id } = req.params;

        try {
            const vehicles = await Vehicle.getAssignedVehicleByRiderId(rider_id);
            // console.log("Vehicles:", vehicles);
            res.render("admin/assigned-vehicles", { vehicles, rider_id });
        } catch (error) {
            console.error("Error fetching rider's assigned vehicles:", error);
            this.sendError(res, "Failed to fetch rider's assigned vehicles");
        }
    }
async renderEditAssignedVehicle(req, res) {
    const { rider_id } = req.params;

    try {
        // 1. assigned vehicle (selected one)
        const assignedRows = await Vehicle.getAssignedVehicleByRiderId(rider_id);

        if (!assignedRows.length) {
            return this.sendError(res, "No assigned vehicle found");
        }

        const assigned = assignedRows[0];
        // console.log("Assigned Vehicle:", assigned);

        // 2. all vehicles (for dropdown)
        const vehicles = await Vehicle.getAdminVehiclesArr();

        res.render("admin/edit-assigned-vehicle", {
            vehicles,
            rider_id,
            vehicle_id: assigned.vehicle_id,
            vehicleRent: assigned.vehicle_rent
        });

    } catch (error) {
        console.error(error);
        this.sendError(res, "Failed to load edit page");
    }
}


    async updateAssignedVehicle(req, res) {
    const { riderId } = req.params;
    const { vehicle_id, vehicle_rent } = req.body;

    if (!vehicle_id && vehicle_rent === undefined) {
        return res.json({ status: 0, msg: "Nothing to update." });
    }

    try {
        await Vehicle.assignRiderVehicle(
            riderId,
            vehicle_id,
            vehicle_rent
        );

        await Category.updateRiderCategoryByRiderId(riderId, vehicle_id);

        return res.redirect(`/admin/rider/vehicles/assigned-vehicles/${riderId}`);

    } catch (error) {
        console.error("Error updating rider vehicle:", error);
        return this.sendError(res, "Failed to update rider vehicle.");
    }
}



    async deleteRiderAssignedVehicle(req, res) {
        const { rider_id, vehicle_id } = req.params;
        // console.log("Attempting to delete row with ID:", id);

        try {
            // console.log("ID received:", id);
            const result = await Vehicle.removeAssignedVehicle(rider_id);


            this.sendSuccess(
                res,
                {},
                "Vehicle removed successfully!",
                200,
                req.get('referer') || '/'
            );
        } catch (error) {
            console.error("Error deleting rider vehicle:", error);
            this.sendError(res, "Failed to delete rider vehicle.");
        }
    }

}

module.exports = AssignedVehiclesController;
