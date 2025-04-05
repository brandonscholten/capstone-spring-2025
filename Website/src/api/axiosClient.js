import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://127.0.0.1:5000/', // Change to your API base URL
  timeout: 10000, // Set timeout in milliseconds
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
	'Access-Control-Allow-Origin': '*', // Not needed for frontend but useful for debugging
  },
});

// Optional: Interceptor for handling errors globally
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API error:', error);
    return Promise.reject(error);
  }
);

export default api;
