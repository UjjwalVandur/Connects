// Central API configuration
// All API calls should use this base URL so it can be easily swapped between environments.
// Set REACT_APP_API_BASE_URL in .env.development or .env.production

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

export default API_BASE_URL;
