// models/RiderModel.js
const pool = require("../config/db-connection");
const BaseModel = require("./baseModel");

class ReviewsModel extends BaseModel {
  constructor() {
    super("request_reviews"); // Pass the table name to the BaseModel constructor
  }

  static tableName = "request_reviews";

  static async getReviewsWithMembers() {
    try {
      const result = await pool.query(`
            SELECT
              request_reviews.id,
              request_reviews.review,
              request_reviews.rating,
              request_reviews.created_at,
              request_reviews.request_id,
              members.full_name AS member_name,
              members.mem_image AS member_dp
            FROM
              request_reviews
            JOIN
              members ON request_reviews.user_id = members.id;
          `);
      console.log("Raw Query Result:", result);
      const rows = result[0];
      if (!rows || rows.length === 0) {
        // console.log("No reviews found");
        return [];
      }

      // console.log("Reviews Found:", rows);
      return rows;
    } catch (err) {
      console.error("Error fetching reviews:", err);
      throw err;
    }
  }

  static async getReviewDetailsById(id) {
    try {
      const query = `
                SELECT 
                    rr.*, 
                    m.id AS user_id, 
                    m.full_name AS member_name, 
                    m.mem_image AS member_dp
                FROM request_reviews rr
                LEFT JOIN members m ON rr.user_id = m.id
                WHERE rr.id = ?;
            `;

      const [rows] = await pool.query(query, [id]);
      // console.log("rows:", rows);



      // Check if a review exists for the given orderId
      if (rows.length === 0) {
        return null; // No review found for the given orderId
      }

      return rows[0]; // Return the first review for the given orderId
    } catch (error) {
      console.error("Error fetching review details:", error);
      throw error; // Re-throw the error after logging it
    }
  }

  static async getReviewsById(id) {
    const [review] = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return review; // This should be an object, not an array
  }

  static async deleteReviewById(id) {
    try {
      const [result] = await pool.query(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0; // Returns true if a row was deleted
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Failed to delete Review");
    }
  }
}

module.exports = ReviewsModel;
