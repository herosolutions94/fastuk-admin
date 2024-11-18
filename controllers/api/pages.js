// controllers/HomeController.js
const axios = require('axios');

const BaseController = require('../baseController');
const PageModel = require('../../models/api/pages'); // Assuming you have this model
const MemberModel = require('../../models/memberModel');
const Token = require('../../models/tokenModel');

const TestimonialModel = require('../../models/api/testimonialModel');
const TeamModel = require('../../models/api/teamModel');
const FaqModel = require('../../models/api/faqModel');
const VehicleModel = require('../../models/api/vehicleModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const jwt = require('jsonwebtoken'); // Make sure to require the jwt package


const HERE_API_KEY = process.env.HERE_API_KEY;
const express = require('express');
const router = express.Router();

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Use your actual API key


const pool = require('../../config/db-connection');
const { validateFields } = require('../../utils/validators');
const helpers = require('../../utils/helpers')

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
        const faqModel = new FaqModel();


        try {
            const siteSettings = res.locals.adminData;

            // Get the main page content
            const pageContent = await this.pageModel.findByKey('faq');
            const formData = pageContent ? JSON.parse(pageContent.content || '{}') : {};

            const faqsData = await faqModel.findFeatured();




            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                content: formData,
                faqs: faqsData
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

    async multiStepForm(req, res) {
        const vehicleModel = new VehicleModel();


        try {
            const siteSettings = res.locals.adminData;

            // Get the main page content
            const vehiclesData = await vehicleModel.findFeatured();

            // Combine the content and multi_text data
            const jsonResponse = {
                siteSettings,
                vehicles: vehiclesData
            };

            // Return data in JSON format
            res.json(jsonResponse);
        } catch (err) {
            console.error('Error:', err);
            res.status(200).json({ error: 'Internal Server Error' });
        }
    }

    async getAddress(req, res) {
        console.log(req.body); // Log the body to check if it's coming through correctly

        const { zip_code } = req.body;

        if (!zip_code) {
            return res.status(200).json({ error: 'Zip code is required' });
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
            console.error('Error fetching data from HERE API:', error.message);
            res.status(200).json({ error: 'An error occurred while fetching addresses' });
        }
    }


    // router.post('/create-payment-intent', async (req, res) => {
    //     async paymentIntent(req, res) {

    //     const { payment_method_id, amount } = req.body;
    //     console.log("req.body:",req.body)

    //     try {
    //         // Validate and parse amount
    //         const amount = parseFloat(req.body.amount);
    //         if (isNaN(amount) || amount <= 0) {
    //             return res.status(400).json({ error: "Invalid amount provided" });
    //         }

    //         const amountInCents = Math.round(amount * 100);

    //         // Create a PaymentIntent with the specified amount and payment method
    //         const paymentIntent = await stripe.paymentIntents.create({
    //             amount: amountInCents, // Amount in smallest currency unit (e.g., cents for USD)
    //             currency: 'usd',
    //             payment_method: payment_method_id,
    //             confirmation_method: 'manual',
    //         });
    //         console.log("paymentIntent:",paymentIntent);return

    //         res.status(200).json({ status: 1, payment_intent_id:paymentIntent.id,  client_secret: paymentIntent.client_secret  });
    //     } catch (error) {
    //         console.error('Error creating payment intent:', error);
    //         res.status(400).json({ status: 0, msg: 'Failed to create payment intent', error: error.message });
    //     }
    // };

    generatePseudoFingerprint(req) {
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || '';
        const acceptHeader = req.headers['accept'] || '';
        const combined = `${userAgent}:${ipAddress}:${acceptHeader}`;

        // Create a hash of the combined string for uniqueness
        return crypto.createHash('sha256').update(combined).digest('hex');
    }

    async paymentIntent(req, res) {
        this.memberModel = new MemberModel();  // Create an instance of MemberModel
        this.tokenModel = new Token();


        const { selectedVehicle,
            vehiclePrice,
            source_postcode,
            source_address,
            source_name,
            source_phone_number,
            source_city,
            dest_postcode,
            dest_address,
            dest_name,
            dest_phone_number,
            dest_city,
            source_full_address,
            dest_full_address,
            charge_agreement,
            full_name,
            email,
            password,
            confirm_password,
            card_holder_name,
            confirm,
            totalAmount,
            payment_method,
            payment_method_id,
            fingerprint
        } = req.body;
        // console.log(req.body); return;

        // Fields to validate
        const requiredFields = ['selectedVehicle',
            'vehiclePrice',
            'source_postcode',
            'source_address',
            'source_name',
            'source_phone_number',
            'source_city',
            'dest_postcode',
            'dest_address',
            'dest_name',
            'dest_phone_number',
            'dest_city',
            'source_full_address',
            'dest_full_address',
            'charge_agreement',
            'full_name',
            'email',
            'password',
            'confirm_password',
            'card_holder_name',
            'confirm',
            'totalAmount',
            'payment_method',
            'payment_method_id',];

        // Use validateFields function to check if required fields are provided
        const { isValid, errors } = validateFields(req.body, requiredFields);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Additional specific validations
        try {
            // Validate Email format
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format.' });
            }

            // Validate Amount
            const parsedAmount = parseFloat(totalAmount);  // Ensure the variable name matches
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({ error: 'Amount must be a positive number.' });
            }

            // Validate Payment Method ID
            if (!payment_method_id || payment_method_id.trim().length === 0) {
                return res.status(400).json({ error: 'Payment Method ID is required.' });
            }

            let user_exist = await this.memberModel.emailExists(email);
            // console.log(user_exist); return;
            if (user_exist) {
                return res.status(200).json({ error: 'User already exists! Please login to continue!' });
            }

            if (password !== confirm_password) {
                return res.status(200).json({ success: false, message: 'Passwords do not match.' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const otp = Math.floor(100000 + Math.random() * 900000);



            // 2. Create the user (No check for email, assume they are new or pre-existing)
            const userId = await this.memberModel.createMember({ full_name: full_name, email: email, mem_type: 'user', password: hashedPassword, mem_status: 1, created_at: helpers.create_current_date(), otp: otp }); // Directly create the user
            // console.log(userId); return;

            // Store token in the database
            let actualFingerprint = fingerprint || this.generatePseudoFingerprint(req);

            // Generate token
            const randomNum = crypto.randomBytes(16).toString('hex');
            const tokenType = 'user';
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);

            const token = crypto.createHash('sha256').update(`${randomNum}-${tokenType}-${userId}`).digest('hex');

            const tokenId = await this.tokenModel.storeToken(userId, token, 'user', expiryDate, actualFingerprint, 'user');
            console.log('Token stored with ID:', tokenId);
            // 3. Create a customer on Stripe
            const stripeCustomer = await stripe.customers.create({
                name: full_name,  // Replace 'name' with 'full_name'
                email: email,
            });

            // 4. Create Payment Intent
            const amountInCents = Math.round(parsedAmount * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents, // Amount in cents
                currency: 'usd',
                payment_method: payment_method_id,
                customer: stripeCustomer.id,
                // confirmation_method: 'manual',
                'setup_future_usage': 'off_session',
            });

            // 5. Respond with payment details
            res.status(200).json({
                status: 1,
                user_id: userId,
                customer_id: stripeCustomer.id,
                payment_intent_id: paymentIntent.id,
                client_secret: paymentIntent.client_secret,
                authToken: token,
                mem_type: 'user'
            });
        } catch (error) {
            console.error('Error creating payment intent:', error);
            res.status(200).json({ status: 0, msg: 'Failed to create payment intent', error: error.message });
        }
    }


    async createRequestQuote(req, res) {
        this.tokenModel = new Token();

        try {
            // Destructure necessary fields from req.body
            const {
                token,
                payment_intent_customer_id,
                selectedVehicle,
                vehiclePrice,
                totalAmount,
                parcels,
                source_postcode,
                source_full_address,
                source_name,
                source_phone_number,
                source_city,
                dest_postcode,
                dest_full_address,
                dest_name,
                dest_phone_number,
                dest_city,
                payment_method,
                payment_method_id,
            } = req.body;

            // Validate token and find the user
            const user = await this.tokenModel.findByToken(token);
            if (!user) {
                return res.status(400).json({ error: 'Invalid token, user not found' });
            }
            let parcels_arr = []
            if (parcels !== '' && parcels !== undefined && parcels !== null) {
                parcels_arr = JSON.parse(parcels);
            }
            // Validate parcels
            if (!Array.isArray(parcels_arr)) {
                return res.status(400).json({ error: "'parcels' must be an array" });
            }

            // Create Request Quote record
            const requestQuoteId = await this.pageModel.createRequestQuote({
                user_id: user.id,
                selected_vehicle: selectedVehicle,
                vehicle_price: vehiclePrice,
                total_amount: totalAmount,
                payment_intent: payment_intent_customer_id,
                customer_id: payment_intent_customer_id,
                source_postcode,
                source_address: source_full_address,
                source_name,
                source_phone_number,
                source_city,
                dest_postcode,
                dest_address: dest_full_address,
                dest_name,
                dest_phone_number,
                dest_city,
                payment_method,
                payment_method_id,
            });

            // Create Parcels records for the request
            const parcelRecords = parcels_arr.map(parcel => ({
                request_id: requestQuoteId,
                length: parcel.length,
                width: parcel.width,
                height: parcel.height,
                weight: parcel.weight,
                destination: parcel.destination,
                source: parcel.source,
                parcelNumber: parcel.parcelNumber,
                distance: parcel.distance,
                parcelType: parcel.parcelType,
            }));
            console.log(parcelRecords, 'parcelRecords');
            // Insert parcels into the database
            await this.pageModel.insertParcels(parcelRecords);

            // Send success response
            res.status(200).json({ status: 1, msg: 'Request Quote and Parcels created successfully' });
        } catch (error) {
            console.error('Error in createRequestQuote:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }


}


module.exports = PagesController;
