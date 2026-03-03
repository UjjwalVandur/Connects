import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Navigate up one level from 'middleware' folder, then into 'public/assets'
    cb(null, path.join(__dirname, "../public/assets"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
