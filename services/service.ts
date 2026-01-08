
import { BASE_URL, ENDPOINTS } from '../config/api';

export { ENDPOINTS };

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any, params?: Record<string, string>) => {
  // Construct URL with Query Params
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = { 
    'Accept': 'application/json'
  };
  
  // Only set Content-Type to application/json if body is NOT FormData
  // If it IS FormData, the browser will automatically set Content-Type with the boundary
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const token = localStorage.getItem('token');
  if (token) {
      headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
    });

    if (response.status === 401) {
      window.dispatchEvent(new Event('auth:logout'));
      throw new Error('Unauthorized: Session expired');
    }

    const json = await response.json();

    if (!response.ok) {
        let errorMessage = json.message || json.error || `Request failed with status ${response.status}`;
        
        // Handle Validation Errors (common Laravel structure)
        if (response.status === 422 && json.errors) {
            // Flatten the array of error strings
            const validationMessages = Object.values(json.errors).flat().join(', ');
            errorMessage = validationMessages || errorMessage;
        }
        
        throw new Error(errorMessage);
    }
    
    return json;
  } catch (error) {
    console.error(`API Request failed: ${url}`, error);
    throw error;
  }
};
