const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create the storage folder if it doesn't exist
const storageFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(storageFolder)) {
  fs.mkdirSync(storageFolder);
}

// Set storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageFolder);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename (you may want to use a library like uuid)
    const uniqueFilename = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extname = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueFilename + extname);

  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // console.log(file)
    const allowedExtensions = ['.webp', '.ico', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.mp4', '.mov', '.avi','.mp3', '.ogg', '.wav'];
    const extname = path.extname(file.originalname).toLowerCase();
    console.log("Final Stored Filename:", extname); // Debugging

    if (allowedExtensions.includes(extname)) {
      return cb(null, true);
    } else {
      return cb(new Error('Only .jpg, .jpeg, .png, .gif, .svg, .mp4, .mov, .avi .mp3 .ogg .wav files are allowed!'));
    }
  },
  limits: {
    fileSize: 1000 * 1024 * 1024, // 10 MB limit for each file
    fieldSize: 10 * 1024 * 1024, // Increase field size limit
    fields: 100, // Maximum number of non-file fields
   
  },
}).fields([
  { name: 'driving_license', maxCount: 1 },
  { name: 'mem_image', maxCount: 1 },
  { name: 'logo_image', maxCount: 1 },
  { name: 'favicon_image', maxCount: 1 },
  { name: 'thumb_image', maxCount: 1 },
  { name: 'testi_image', maxCount: 1 },
  { name: 'team_mem_image', maxCount: 1 },
  { name: 'service_image', maxCount: 1 },
  { name: 'image1', maxCount: 1 },
  { name: 'sec1_image_0', maxCount: 1 },
  { name: 'sec1_image_1', maxCount: 1 },
  { name: 'sec1_image_2', maxCount: 1 },
  { name: 'sec1_image_3', maxCount: 1 },
  { name: 'sec2_image_0', maxCount: 1 },
  { name: 'sec2_image_1', maxCount: 1 },
  { name: 'sec2_image_2', maxCount: 1 },
  { name: 'sec2_image_3', maxCount: 1 },
  { name: 'image10', maxCount: 1 },
  { name: 'image11', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'sec5_image_0', maxCount: 1 },
  { name: 'sec5_image_1', maxCount: 1 },
  { name: 'sec5_image_2', maxCount: 1 },
  { name: 'sec5_image_3', maxCount: 1 },
  { name: 'sec6_image_0', maxCount: 1 },
  { name: 'sec6_image_1', maxCount: 1 },
  { name: 'sec6_image_2', maxCount: 1 },
  { name: 'sec6_image_3', maxCount: 1 },
  { name: 'sec7_image_0', maxCount: 1 },
  { name: 'sec7_image_1', maxCount: 1 },
  { name: 'sec7_image_2', maxCount: 1 },
  { name: 'sec7_image_3', maxCount: 1 },
  { name: 'image20', maxCount: 1 },
  { name: 'abt_image1', maxCount: 1 },
  { name: 'abt_image2', maxCount: 1 },
  { name: 'abt_image3', maxCount: 1 },
  { name: 'abt_image4', maxCount: 1 },
  { name: 'abt_video', maxCount: 1 },
  { name: 'abt_image5', maxCount: 1 },
  { name: 'sec4_abt_image_0', maxCount: 1 },
  { name: 'sec4_abt_image_1', maxCount: 1 },
  { name: 'sec4_abt_image_2', maxCount: 1 },
  { name: 'sec4_abt_image_3', maxCount: 1 },
  { name: 'abt_image10', maxCount: 1 },
  { name: 'business_image1', maxCount: 1 },
  { name: 'sec1_business_image_0', maxCount: 1 },
  { name: 'sec1_business_image_1', maxCount: 1 },
  { name: 'sec1_business_image_2', maxCount: 1 },
  { name: 'sec1_business_image_3', maxCount: 1 },
  { name: 'business_image6', maxCount: 1 },
  { name: 'sec3_business_image_0', maxCount: 1 },
  { name: 'sec3_business_image_1', maxCount: 1 },
  { name: 'sec3_business_image_2', maxCount: 1 },
  { name: 'sec3_business_image_3', maxCount: 1 },
  { name: 'business_image11', maxCount: 1 },
  { name: 'rider_image1', maxCount: 1 },
  { name: 'rider_image2', maxCount: 1 },
  { name: 'rider_image3', maxCount: 1 },
  { name: 'sec3_rider_image_0', maxCount: 1 },
  { name: 'sec3_rider_image_1', maxCount: 1 },
  { name: 'sec3_rider_image_2', maxCount: 1 },
  { name: 'sec3_rider_image_3', maxCount: 1 },
  { name: 'sec4_rider_image_0', maxCount: 1 },
  { name: 'sec4_rider_image_1', maxCount: 1 },
  { name: 'sec4_rider_image_2', maxCount: 1 },
  { name: 'sec4_rider_image_3', maxCount: 1 },
  { name: 'vehicle_image', maxCount: 1 },
  { name: 'rider_document', maxCount: 1 },
  { name: 'vehicle_category_image', maxCount: 1 },
  { name: 'rider_license', maxCount: 3 },



  

]);

module.exports = upload;
