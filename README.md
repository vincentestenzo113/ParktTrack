ParkTrack
Prerequisites
Node.js (v18.0.0 or higher)

npm (v9.0.0 or higher)

Installation
Clone the repository
git clone <repository-url>
cd ParktTrack-main

Install dependencies
npm install

Set up configuration in supabaseClient.js:

const supabaseUrl = "your_supabase_url";
const supabaseKey = "your_supabase_anon_key";

Set up your Resend API key in your email handling logic:

const resendApiKey = "your_resend_api_key";


Required Services
Supabase
Create a Supabase account at https://supabase.com


Resend Email Service
Create a Resend account at https://resend.com

Generate an API key

Configure your transactional email templates as needed

Development
Start the development server:
npm start

Production Build
Create a production-ready build:
npm run build

Deployment
This project can be deployed using any static hosting platform (e.g., Vercel, Netlify). Ensure your API keys and environment-specific configurations are handled securely.

Technology Stack
React – frontend framework

React Router DOM – page navigation

Supabase – backend/database services

CSS – styling

Axios – API requests

Resend – email services

Formik & Yup – form handling and validation

GSAP & Lottie React – animations

React Calendar & React DatePicker – date/time inputs

React Toastify – notifications

