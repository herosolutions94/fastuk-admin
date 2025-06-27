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
        res.render("admin/add-category", {mainCategories,rider_id});
    } catch (error) {
      console.error("Error rendering add Category page:", error);
      return this.sendError(res, "Failed to load add Category page");
    }
  }

  async fetchSubCategories(req, res) {
  const parentId = req.body.parent_id;

  try {
    const subCategories = await Category.getSubCategoriesByParentId(parentId);
    res.json(subCategories);
  } catch (error) {
    console.error("Error fetching Vehicle Categories:", error); 
    this.sendError(res, "Failed to fetch Vehicle Categories");
  }
}


  async saveCategoryForRider(req, res) {
        const { rider_id } = req.params;
  const { category_id } = req.body;
  console.log(rider_id,category_id)

  try {
    // Save in subtable
    await Category.saveRiderCategory(rider_id, category_id);
this.sendSuccess(
        res,
        {},
        "Vehicle category assigned to rider!",
        200,
        `/admin/rider/category/selected-categories/${rider_id}`
      );  } catch (error) {
    console.error("Error saving rider category:", error);
    this.sendError(res, "Failed to save category.");
  }
}

async getRiderCategories(req, res) {
        const { rider_id } = req.params;

  try {
    const categories = await Category.getCategoriesByRiderId(rider_id);
    console.log("categories:",categories)
      res.render("admin/categories", { categories, rider_id });
  } catch (error) {
    console.error("Error fetching rider's categories:", error);
    this.sendError(res, "Failed to fetch rider's categories");
  }
}

async renderEditAssignedCategory(req, res) {
  const { rider_id, category_id } = req.params;

  try {
    // Get subcategory info to determine main category (parent_id)
    const subCategory = await Category.getCategoryById(category_id);
    if (!subCategory) return this.sendError(res, "Invalid subcategory ID");

    const parentCategoryId = subCategory.parent_id;

    const mainCategories = await Category.getMainCategories();
    const subCategories = await Category.getSubCategoriesByParentId(parentCategoryId);

    res.render("admin/edit-category", {
      mainCategories,
      subCategories,
      selectedId: parseInt(category_id),
      rider_id,
      category_id,
      parentCategoryId
    });
  } catch (error) {
    console.error("Error rendering assigned category edit:", error);
    this.sendError(res, "Failed to load category edit page");
  }
}



async updateAssignedCategory(req, res) {
  const { rider_id, category_id } = req.params;
  const { new_category_id } = req.body;

  try {
    // Update category assignment for this rider + category
    await Category.updateRiderCategory(rider_id, category_id, new_category_id);
    this.sendSuccess(res,
        {},
        "Document updated successfully!",
        200,
        `/admin/rider/category/selected-categories/${rider_id}`);
  } catch (error) {
    console.error("Error updating assigned category:", error);
    this.sendError(res, "Failed to update rider category.");
  }
}

async deleteRiderCategory(req, res) {
  const { rider_id, category_id } = req.params;

  try {
    await Category.deleteRiderCategory(rider_id, category_id);
    this.sendSuccess(res,
        {},
        "Document deleted successfully!",
        200,
        `/admin/rider/category/selected-categories/${rider_id}`);
  } catch (error) {
    console.error("Error deleting rider category:", error);
    this.sendError(res, "Failed to delete rider category.");
  }
}







  

  

  
}

module.exports = CategoriesController;
