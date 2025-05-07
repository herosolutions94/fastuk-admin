const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const Pages = require('../../models/pages');
const helpers = require('../../utils/helpers')
// Remove unused 'upload' if it's not needed

class PagesController extends BaseController {
    constructor() {
        super();
        this.pages = new Pages();
    }

    async manage_pages(req, res, next) {
        try {
            res.render('admin/pages/manage-pages');
        } catch (error) {
            next(error);
        }
    }

    async homeView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('home');

            if (!pageData) {
                await this.pages.createPage('home');
                pageData = { key: 'home', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }
            // console.log(contentData)
            res.render('admin/pages/home', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }



    async homeForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('home');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };
            // console.log('data form', formData)
            if (req.files) {
                const imageKeys = [
                    'image1', 'sec1_image_0', 'sec1_image_1', 'sec1_image_2', 'sec1_image_3',
                    'sec2_image_0', 'sec2_image_1', 'sec2_image_2', 'sec2_image_3', 'image10', 'image11', 'video',
                    'sec5_image_0', 'sec5_image_1', 'sec5_image_2', 'sec5_image_3', 'sec6_image_0', 'sec6_image_1', 'sec6_image_2', 'sec6_image_3',
                    'sec7_image_0', 'sec7_image_1', 'sec7_image_2', 'sec7_image_3', 'image20'
                ];

                imageKeys.forEach((key) => {
                    if (req.files[key]) {
                        formData[key] = `/${req.files[key][0].filename}`;
                    }
                });
            }

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            // console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('home', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/home');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }

    async aboutView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('about');

            if (!pageData) {
                await this.pages.createPage('about');
                pageData = { key: 'about', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/about', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async aboutForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('about');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            if (req.files) {
                const imageKeys = [
                    'abt_image1', 'abt_image2', 'abt_image3', 'abt_image4', 'abt_video', 'abt_image5',
                    'sec4_abt_image_0', 'sec4_abt_image_1', 'sec4_abt_image_2', 'sec4_abt_image_3', 'abt_image10'
                ];

                imageKeys.forEach((key) => {
                    if (req.files[key]) {
                        formData[key] = `/${req.files[key][0].filename}`;
                    }
                });
            }

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            // console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('about', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/about');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }
    async contactView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('contact');

            if (!pageData) {
                await this.pages.createPage('contact');
                pageData = { key: 'contact', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/contact', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async contactForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('contact');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            // console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('contact', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/contact');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }
    async privacyPolicyView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('privacy-policy');

            if (!pageData) {
                await this.pages.createPage('privacy-policy');
                pageData = { key: 'privacy-policy', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/privacy-policy', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async privacyPolicyForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('privacy-policy');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('privacy-policy', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/privacy-policy');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }
    async termsConditionsView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('terms-conditions');

            if (!pageData) {
                await this.pages.createPage('terms-conditions');
                pageData = { key: 'terms-conditions', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/terms-conditions', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async termsConditionsForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('terms-conditions');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('terms-conditions', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/terms-conditions');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }

    async chargeAggreementView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('charge-aggreement');

            if (!pageData) {
                await this.pages.createPage('charge-aggreement');
                pageData = { key: 'charge-aggreement', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/charge-aggreement', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async chargeAggreementForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('charge-aggreement');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('charge-aggreement', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/charge-aggreement');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }


    async helpSupportView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('help-support');

            if (!pageData) {
                await this.pages.createPage('help-support');
                pageData = { key: 'help-support', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/help-support', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async helpSupportForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('help-support');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('help-support', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/help-support');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }

    async faqView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('faq');

            if (!pageData) {
                await this.pages.createPage('faq');
                pageData = { key: 'faq', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/faq', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async faqForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('faq');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('faq', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/faq');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }

    async loginView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('login');

            if (!pageData) {
                await this.pages.createPage('login');
                pageData = { key: 'login', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/login', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async loginForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('login');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('login', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/login');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }


    async forgotPasswordView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('forgot-password');

            if (!pageData) {
                await this.pages.createPage('forgot-password');
                pageData = { key: 'forgot-password', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/forgot-password', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async forgotPasswordForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('forgot-password');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('forgot-password', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/forgot-password');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }

    async signUpView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('sign-up');

            if (!pageData) {
                await this.pages.createPage('sign-up');
                pageData = { key: 'sign-up', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/sign-up', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async signUpForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('sign-up');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('sign-up', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/sign-up');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }

    async riderSignUpView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('rider-signup');

            if (!pageData) {
                await this.pages.createPage('rider-signup');
                pageData = { key: 'rider-signup', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/rider-signup', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async riderSignUpForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('rider-signup');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('rider-signup', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/rider-signup');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }

    async resetPasswordView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('reset-password');

            if (!pageData) {
                await this.pages.createPage('reset-password');
                pageData = { key: 'reset-password', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/reset-password', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async resetPasswordForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('reset-password');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('reset-password', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/reset-password');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }

    async businessView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('business');

            if (!pageData) {
                await this.pages.createPage('business');
                pageData = { key: 'business', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/business', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async businessForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('business');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            if (req.files) {
                const imageKeys = [
                    'business_image1', 'sec1_business_image_0', 'sec1_business_image_1', 'sec1_business_image_2', 'sec1_business_image_3',
                    'business_image6', 'sec3_business_image_0', 'sec3_business_image_1', 'sec3_business_image_2', 'sec3_business_image_3',
                    'business_image11'
                ];

                imageKeys.forEach((key) => {
                    if (req.files[key]) {
                        formData[key] = `/${req.files[key][0].filename}`;
                    }
                });
            }

            // Step 3: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);
            // console.log("json content", jsonContent);

            // Step 4: Update the database with the new JSON value for "home" key
            await this.pages.updatePageContent('business', jsonContent);

            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/business');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }

    async riderView(req, res, next) {
        try {
            let pageData = await this.pages.findByKey('rider');

            if (!pageData) {
                await this.pages.createPage('rider');
                pageData = { key: 'rider', content: null }; // Placeholder for new entry
            }

            let contentData = {};

            // Try parsing the content from the database
            if (pageData.content) {
                try {
                    contentData = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing JSON from database:', err);
                    // Handle error - maybe set default values
                    contentData = { error: 'Failed to load content.' };
                }
            }

            res.render('admin/pages/rider', { jsonContent: req.body, contentData });
        } catch (error) {
            next(error);
        }
    }

    async riderForm(req, res, next) {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                console.log("No data received, not executing form logic.");
                return res.status(400).json({
                    status: 0,
                    message: 'No data provided.'
                });
            }

            // Step 1: Fetch existing content to retain previous image paths
            const pageData = await this.pages.findByKey('rider');
            let existingContent = {};

            if (pageData && pageData.content) {
                try {
                    existingContent = JSON.parse(pageData.content);
                } catch (err) {
                    console.error('Error parsing existing JSON content:', err);
                }
            }

            // Step 2: Fetch current sec_text values for key 'home'
            const secTextValues = await this.pages.getSecTextValues('home');
            console.log("Fetched sec_text values:", secTextValues);

            // Log sec_text from form
            console.log("sec_text from form:", req.body.sec_text);

            // Step 3: Initialize formData with existing content
            const formData = { ...existingContent, ...helpers.sanitizeData(req.body) };

            if (req.files) {
                const imageKeys = ['rider_image1', 'rider_image2', 'rider_image3', 'sec3_rider_image_0', 'sec3_rider_image_1', 'sec3_rider_image_2', 'sec3_rider_image_3',
                    'sec4_rider_image_0', 'sec4_rider_image_1', 'sec4_rider_image_2', 'sec4_rider_image_3'
                ];

                imageKeys.forEach((key) => {
                    if (req.files[key]) {
                        formData[key] = `/${req.files[key][0].filename}`;
                    }
                });
            }
            // Step 4: Clear old sec_text values
            await this.pages.deleteSecTextValues('home');

            // Step 5: Insert new sec_text values from the form
            const newSecTextValues = req.body.sec_text || [];
            await this.pages.insertSecTextValues('home', newSecTextValues);  // Pass the new sec_text values here

            // Step 6: Add new sec_text values to formData
            formData.sec_text = newSecTextValues;

            // Step 7: Convert updated data to JSON
            const jsonContent = JSON.stringify(formData);

            // Step 8: Update the database with the new JSON value for "rider" key
            await this.pages.updatePageContent('rider', jsonContent);

            // Step 9: Send success response
            this.sendSuccess(res, {}, 'Data added successfully!', 200, '/admin/pages/rider');
        } catch (error) {
            console.error('Failed to add data:', error);
            this.sendError(res, 'Failed to add data');
            next(error);
        }
    }



}

module.exports = PagesController;
