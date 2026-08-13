const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuração do Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/avatars");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});

// Filtro de tipos
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Apenas imagens SVG, PNG ou JPG são permitidas"));
};

// Limite 2MB
const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = uploadAvatar;
