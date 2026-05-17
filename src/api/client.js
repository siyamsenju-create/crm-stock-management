const BASE_URL = 'http://localhost:5005/api/v1';

class APIClient {
    async request(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const token = localStorage.getItem('token');
        
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        let retries = 3;
        let delay = 500;

        while (retries >= 0) {
            try {
                const response = await fetch(url, config);

                if (response.status === 401) {
                    localStorage.removeItem('token');
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    throw new Error('Unauthorized');
                }

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    if (response.status >= 500 && retries > 0) {
                        throw new Error('Server Error');
                    }
                    throw data || new Error(response.statusText);
                }

                return data;
            } catch (error) {
                if (retries === 0 || error.message === 'Unauthorized' || (error.success === false)) {
                    throw error;
                }
                
                await new Promise(resolve => setTimeout(resolve, delay));
                retries--;
                delay *= 2;
            }
        }
    }

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
    }

    patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

const api = new APIClient();
export default api;
