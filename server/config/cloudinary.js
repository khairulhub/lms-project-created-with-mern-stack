const cloudinary = require("cloudinary").v2;

// CLOUDINARY_URL env var (format: cloudinary://<key>:<secret>@<cloud_name>)
// auto-configures the SDK if present. Otherwise fall back to 3 separate vars.
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

module.exports = cloudinary;
