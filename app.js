require('dotenv').config();

const cors = require('cors');


const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { Server } = require('socket.io');


 const sslOptions = {
   key: fs.readFileSync('/var/www/html/fastuk-admin/ssl/private.key'), // Replace with the path to your private key
   cert: fs.readFileSync('/var/www/html/fastuk-admin/ssl/certificate.crt'), // Replace with the path to your certificate
   ca: fs.readFileSync('/var/www/html/fastuk-admin/ssl/ca_bundle.crt') // Optional: Add this if you have a CA bundle
 };

const app = express();
const socketServer = https.createServer(sslOptions,app);
const io = new Server(socketServer, {
  cors: {
    origin: 'https://18.133.79.26:4000', // Allow connection from this frontend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization','accept'],
  }
});

const users=[]
// Handle socket connection
io.on('connection', (socket) => {
    console.log('A user connected:', users);

    socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
  });

  socket.on("registerUser", async(data) => {
    console.log(users)
    token = data?.token;
    memType = data?.memType;
    try {
      // Call the helper function to get user_id from token
      const userId = await getUserIdFromToken(token, memType);
      
      if (userId) {
        // If user_id is found, register the user and associate the socket with this user_id
        const user = {
          user_id: userId,
          socket: socket.id,
          mem_type: memType,
        };
  
        // Store user socket in users array
        users.push(user);
        
        // Optionally, you can emit a confirmation event back to the client
  
      } else {
        console.log('User registration failed: Invalid token or memType');
      }
    } catch (error) {
      console.error('Decryption or registration failed:', error.message);
    }
    
  });
    // Emit data to the client
    socket.emit('message', { text: 'Hello from Node.js server!' });
  
    // Listen for events from the client
    socket.on('clientEvent', (data) => {
      console.log('Data from client:', data);
    });
  
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
  module.exports = { io, users };

app.use(express.json());


const PORT = process.env.PORT || 4000;

socketServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const helpers = require('./utils/helpers');
app.use((req, res, next) => {
    res.locals.helpers = helpers;
    next();
});

// Configure CORS to allow requests from http://localhost:3000
const allowedOrigins = ['http://localhost:3000', 'http://localhost:4000','https://18.133.79.26:4000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Allows cookies and other credentials
}));
const bodyParser = require('body-parser');
app.use(bodyParser.json()); // Use body-parser for parsing JSON

const session = require('express-session');

const expressLayouts = require('express-ejs-layouts');

const path = require('path');


app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret key
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    cookie: {
        secure: false, // Should be true if you're using HTTPS in production
        httpOnly: true, // Helps prevent cross-site scripting attacks
        maxAge: 1000 * 60 * 60 * 24 // Set session to expire after 1 day (24 hours)
    }
}));


const accountRoutes = require('./routes/admin/account')
const riderRoutes = require('./routes/api/riderRoutes')
const memberRoutes = require('./routes/api/memberRoutes');
const messageRoutes = require('./routes/api/messageRoutes');
const apiPagesRoutes = require('./routes/api/pages');

const authRoutes = require('./routes/admin/authRoutes');
const authApiRoutes = require('./routes/api/authRoutes');
const adminRiderRoutes = require('./routes/admin/rider');
const adminMemberRoutes = require('./routes/admin/member');
const adminMessageRoutes = require('./routes/admin/message');
const testimonialRoutes = require('./routes/admin/testimonial');
const teamMemberRoutes = require('./routes/admin/team');
const serviceRoutes = require('./routes/admin/service');
const faqRoutes = require('./routes/admin/faq');
const vehicleRoutes = require('./routes/admin/vehicle');
const remotePostCodeRoutes = require('./routes/admin/remote-post-code');
const pagesRoutes = require('./routes/admin/pages');
const requestQuoteRoutes = require('./routes/admin/request-quote');

const authMiddleware = require('./middleware/authMiddleware');
const authenticationMiddleware = require('./middleware/authentication');
const siteInfoMiddleware = require('./middleware/siteInfoMiddleware');
const { getUserIdFromToken } = require('./utils/sockets');






app.set('layout', 'admin/layout');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.json());
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



app.use(siteInfoMiddleware)
app.use(authenticationMiddleware)
app.use('/api', riderRoutes);
app.use('/api', memberRoutes);
app.use('/api', messageRoutes);
app.use('/api', apiPagesRoutes);
app.use('/api', authApiRoutes);
app.use('/admin', accountRoutes);
app.use('/admin', authRoutes);
app.use('/admin', adminRiderRoutes);
app.use('/admin', adminMemberRoutes);
app.use('/admin', adminMessageRoutes);
app.use('/admin', testimonialRoutes);
app.use('/admin', teamMemberRoutes);
app.use('/admin', serviceRoutes);
app.use('/admin', faqRoutes);
app.use('/admin', vehicleRoutes);
app.use('/admin', remotePostCodeRoutes);
app.use('/admin', pagesRoutes);
app.use('/admin', requestQuoteRoutes);








