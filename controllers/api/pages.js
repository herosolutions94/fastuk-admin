// controllers/HomeController.js
const axios = require("axios");

const BaseController = require("../baseController");
const baseController = new BaseController(); // Instantiate the BaseController

const PageModel = require("../../models/api/pages"); // Assuming you have this model
const MemberModel = require("../../models/memberModel");
const MessageModel = require("../../models/messageModel");
const Token = require("../../models/tokenModel");
const helpers = require('../../utils/helpers')

const TestimonialModel = require("../../models/api/testimonialModel");
const SubscribersModel = require("../../models/api/subscribersModel");
const TeamModel = require("../../models/api/teamModel");
const FaqModel = require("../../models/api/faqModel");
const VehicleModel = require("../../models/api/vehicleModel");
const PromoCodeModel = require("../../models/promo-code");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const jwt = require("jsonwebtoken"); // Make sure to require the jwt package
const moment = require("moment");

const HERE_API_KEY = process.env.HERE_API_KEY;
const express = require("express");
const router = express.Router();

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Use your actual API key

const pool = require("../../config/db-connection");
const {
  validateFields,
  validateRequiredFields,
  validateSignUPRequiredFields,
  validateEmail,
  validatePassword,
} = require("../../utils/validators");

class PagesController extends BaseController {
  constructor() {
    super();
    this.pageModel = new PageModel();
    this.subscribers = new SubscribersModel();
    this.tokenModel = new Token();
    this.memberModel = new MemberModel(); 
    this.contact_messages = new MessageModel(); 
    this.promoCodeModel = new PromoCodeModel(); 
  }
  async getHomeData(req, res) {
    const testimonialModel = new TestimonialModel();

    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("home");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Get testimonials data
      const testimonialsData = await testimonialModel.findFeatured();

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
        testimonials: testimonialsData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async getAboutData(req, res) {
    const teamModel = new TeamModel();

    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("about");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Get testimonials data
      const teamData = await teamModel.findFeatured();

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
        teamMembers: teamData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getContactData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("contact");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getPrivacyPolicyData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("privacy-policy");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getTermsConditionsData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("terms-conditions");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getHelpSupportData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("help-support");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getFaqData(req, res) {
    const faqModel = new FaqModel();

    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("faq");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      const faqsData = await faqModel.findFeatured();

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
        faqs: faqsData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getLoginData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("login");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }
  

  async getForgotPasswordData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("forgot-password");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }z
  async getSignUpData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("sign-up");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};
        const cities = await helpers.getCities();
      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
        cities:cities
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getRiderSignUpData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("rider-signup");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};
        const cities = await helpers.getCities();  // Use await to get the cities array

      const vehicleModel = new VehicleModel();
      const vehicles = await vehicleModel.getActiveVehicles();
      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
        vehicles: vehicles,
        cities
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getRiderProfileData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      const pageContent = await this.pageModel.findByKey("rider-signup");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      
        const cities = await helpers.getCities();  // Use await to get the cities array

      const vehicleModel = new VehicleModel();
      const vehicles = await vehicleModel.getActiveVehicles();
      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        vehicles: vehicles,
        content: formData,
        cities
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }
  async getResetPasswordData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("reset-password");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }
  async getBusinessData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("business");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }
  async getRiderData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("rider");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  

  async getAddress(req, res) {
    // console.log(req.body); // Log the body to check if it's coming through correctly

    const { zip_code } = req.body;

    if (!zip_code) {
      return res.status(200).json({ error: "Zip code is required" });
    }

    try {
      // Make request to HERE API to get addresses for the given zip code
      const hereResponse = await axios.get(
        `https://geocode.search.hereapi.com/v1/geocode`,
        {
          params: {
            q: zip_code,
            apiKey: HERE_API_KEY,
          },
        }
      );

      // Extract relevant data
      const addresses = hereResponse.data.items.map((item) => ({
        address: item.address.label,
        city: item.address.city,
      }));

      res.json({ addresses });
    } catch (error) {
      console.error("Error fetching data from HERE API:", error.message);
      res
        .status(200)
        .json({ error: "An error occurred while fetching addresses" });
    }
  }

  async save_subscriber(req, res) {
      try {
        const {
          email
        } = req.body;
    
        if (!email || email=='' || email==null || email==undefined) {
          return res.status(200).json({ status: 0, msg: "Email is required!" });
        }
    
        // Email validation
        if (!validateEmail(email)) {
          return res.status(200).json({ status: 0, msg: "Invalid email format." });
        }
    
        // Check if email already exists
        const existingUser = await this.subscribers.findByEmail(email);
        if (existingUser) {
          return res.status(200).json({ status: 0, msg: "Email already exists." });
        }
    
    
        // Create the user
        await this.subscribers.createSubscriber({email:email,created_at:new Date(),status:0});
    
        return res.status(200).json({
          status: 1,
          msg: "Subscribed successfully!",
        });
      } catch (error) {
        return res.status(200).json({
          status: 0,
          msg: "An error occurred during registration.",
          error: error.message,
        });
      }
    }
    async save_contact_message(req, res) {
      try {
        const {
          name,
          email,
          phone_number,
          subject,
          message,
        } = req.body;
    
        if (!email || email=='' || email==null || email==undefined) {
          return res.status(200).json({ status: 0, msg: "Email is required!" });
        }
    
        // Email validation
        if (!validateEmail(email)) {
          return res.status(200).json({ status: 0, msg: "Invalid email format." });
        }
        await this.contact_messages.createMessage({name:name,email:email,phone_number:phone_number,subject:subject,message:message,created_date:new Date(),status:0});
    
        return res.status(200).json({
          status: 1,
          msg: "Message sent successfully!",
        });
      } catch (error) {
        return res.status(200).json({
          status: 0,
          msg: "An error occurred during registration.",
          error: error.message,
        });
      }
    }

    async getSiteSettingsData(req, res) {
      try {
        const siteSettings = res.locals.adminData;
        // console.log(siteSettings,'siteSettings')

        const cities = await helpers.getCities();

  
        // Combine the content and multi_text data
        const jsonResponse = {
          site_settings:siteSettings,
          cities:cities
        };

  
        // Return data in JSON format
        res.json(jsonResponse);
      } catch (err) {
        console.error("Error:", err);
        res.status(200).json({ error: "Internal Server Error" });
      }
    }    

    async searchCities(req, res) {
      const { query } = req.body; // Get search query from body
    
      if (!query) {
        return res.status(200).json({ status: 0, msg: "Query field is required" });
      }
    
      try {
        const result = await this.pageModel.findAllCities(query); // Pass query to model function
    
        return res.status(200).json({
          status: 1,
          msg: "Cities fetched successfully!",
          data: result, // Return result array
        });
      } catch (error) {
        console.error("Database Error:", error);
        return res.status(200).json({ status: 0, msg: "Internal Server Error" });
      }
    }


    async applyPromoCode(req, res) {
       const { promoCode, amount } = req.body;

       if (!promoCode || !amount) {
        return res.status(200).json({ error: 'Promo code and amount are required.' });
    }

        const promo = await this.promoCodeModel.findByCode(promoCode);
        console.log(promo,promoCode)

        if (!promo) {
          return res.status(200).json({ error: 'Invalid promo code.' });
      }

        const currentDate = new Date();
        if (promo.expiry_date && new Date(promo.expiry_date) < currentDate) {
          return res.status(200).json({ error: 'Promo code has expired.' });
        }

        let discount = 0;

        if (promo.promo_code_type === 'percentage') {
            discount = (amount * promo.percentage_value) / 100;
        } else if (promo.promo_code_type === 'amount') {
            discount = promo.percentage_value;
        } else {
          return res.status(200).json({ error: 'Promo code has expired.' });
        }

        // Cap discount to amount if needed
        if (discount > amount) {
            discount = amount;
        }

        const finalAmount = amount - discount;

        return res.json({
          discount: discount,
          finalAmount: finalAmount
      });

    } catch (error) {
      console.error(error);
      return res.status(200).json({ error: 'Something went wrong.' });
  }
    



    

}

module.exports = PagesController;
