// controllers/api/RiderController.js
const fs = require("fs"); // Import the file system module
const path = require("path"); // For handling file paths

const BaseController = require("../baseController");
const Category = require("../../models/categoryModel");
const { validateRequiredFields } = require("../../utils/validators");
const helpers = require("../../utils/helpers");

class CategoriesController extends BaseController {
  constructor() {
    super();
    this.category = new Category();
  }

  async renderAddCategoryPage(req, res) {
    const { rider_id } = req.params;

    try {
      const mainCategories = await Category.getMainCategories();
      console.log("mainCategories:",mainCategories)
      res.render("admin/add-category", { mainCategories, rider_id });
    } catch (error) {
      console.error("Error rendering add Category page:", error);
      return this.sendError(res, "Failed to load add Category page");
    }
  }

  async fetchSubCategories(req, res) {
    const parentId = req.body.parent_id;
      // console.log('Fetching subcategories for parent_id:', parentId);


    try {
      const subCategories = await Category.getSubCategoriesByParentId(parentId);
          // console.log('Fetched subCategories:', subCategories);

      res.json(subCategories);
    } catch (error) {
      console.error("Error fetching Vehicle Categories:", error);
      this.sendError(res, "Failed to fetch Vehicle Categories");
    }
  }

  async saveCategoryForRider(req, res) {
    const { rider_id } = req.params;
    const { category_id } = req.body;
//     console.log(rider_id, category_id);
//     console.log("Incoming category_id:", category_id);
// console.log("Rider ID:", rider_id);

    try {
      // Save in subtable
      await Category.saveRiderCategory(rider_id, category_id);
     return res.redirect(`/admin/rider/category/selected-categories/${rider_id}`);

    } catch (error) {
      console.error("Error saving rider category:", error);
      this.sendError(res, "Failed to save category.");
    }
  }

  async getRiderCategories(req, res) {
    const { rider_id } = req.params;

    try {
      const categories = await Category.getCategoriesByRiderId(rider_id);
      console.log("categories:", categories);
      res.render("admin/categories", { categories, rider_id });
    } catch (error) {
      console.error("Error fetching rider's categories:", error);
      this.sendError(res, "Failed to fetch rider's categories");
    }
  }

  async renderEditAssignedCategory(req, res) {
  const { rider_id, category_id } = req.params; // category_id here is rider_vehicle_categories.id

  try {
    // Fetch the rider_vehicle_categories row
    const riderCategory = await Category.getRiderCategoryById(category_id);
    if (!riderCategory) {
      return this.sendError(res, "Invalid subcategory ID");
    }

const subCategory = await Category.getCategoryById(riderCategory.category_id);
// subCategory.parent_id is vehicle_id (main category)
   if (!subCategory) {
      return this.sendError(res, "Invalid subcategory ID");
    }



    const parentCategoryId = subCategory.parent_id;
    const mainCategories = await Category.getMainCategories();
    console.log("mainCategories:",mainCategories)
    const subCategories = await Category.getSubCategoriesByParentId(parentCategoryId);

    res.render("admin/edit-category", {
      mainCategories,
      subCategories,
      selectedId: parseInt(riderCategory.category_id),
      rider_id,
      category_id, // still passing rider_vehicle_categories.id
      parentCategoryId,
    });
  } catch (error) {
    console.error("Error rendering assigned category edit:", error);
    this.sendError(res, "Failed to load category edit page");
  }
}


async updateAssignedCategory(req, res) {
  const { riderId, category_id } = req.params;
  const { category_id: new_category_id } = req.body;

  // console.log("Submitted Body:", req.body);
  // console.log("New Category ID:", new_category_id);

  if (!new_category_id) {
    return res.json({ status: 0, msg: "Subcategory is required." });
  }

  try {
    await Category.updateRiderCategoryById(category_id, new_category_id);
    return res.redirect(`/admin/rider/category/selected-categories/${riderId}`);
  } catch (error) {
    console.error("Error updating rider category:", error);
    return this.sendError(res, "Failed to update rider category.");
  }
}



 async deleteRiderCategory(req, res) {
  const { id } = req.params;
  // console.log("Attempting to delete row with ID:", id);

  try {
// console.log("ID received:", id);
const result = await Category.deleteRiderCategoryById(id);

//  console.log("Delete result:", result);

    if (result.affectedRows === 0) {
      // Nothing was deleted — likely invalid ID
      return this.sendError(res, "No category found to delete.");
    }

    this.sendSuccess(
      res,
      {},
      "Category deleted successfully!",
      200,
      req.get('referer') || '/'
    );
  } catch (error) {
    console.error("Error deleting rider category:", error);
    this.sendError(res, "Failed to delete rider category.");
  }
}

}

module.exports = CategoriesController;
