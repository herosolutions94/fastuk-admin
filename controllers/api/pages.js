// controllers/HomeController.js
const BaseController = require('../baseController');
const PageModel = require('../../models/api/pages'); // Assuming you have this model
const TestimonialModel = require('../../models/api/testimonialModel');
const TeamModel = require('../../models/api/teamModel');

const pool  = require('../../config/db-connection');

class PagesController extends BaseController {
    constructor() {
        super();
        this.pageModel = new PageModel();
    }
    async getHomeData(req, res) {
        const testimonialModel = new TestimonialModel();


        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('home');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
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
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    async getAboutData(req, res) {
        const teamModel = new TeamModel();

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('about');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
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
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getContactData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('contact');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }

    async getPrivacyPolicyData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('privacy-policy');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }

    async getTermsConditionsData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('terms-conditions');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }

    async getHelpSupportData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('help-support');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }

    async getFaqData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('faq');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }

    async getLoginData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('login');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }

    async getForgotPasswordData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('forgot-password');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }
    async getSignUpData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('sign-up');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }
    async getResetPasswordData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('reset-password');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }
    async getBusinessData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('business');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }
    async getRiderData(req, res) {

        try {
            const siteSettings = res.locals.adminData;
    
            // Get the main page content
            const pageContent = await this.pageModel.findByKey('rider');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};
    
    
    
            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
            };
    
            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = PagesController;