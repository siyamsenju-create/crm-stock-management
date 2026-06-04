const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api/v1';

class APIClient {
    constructor() {
        this.cache = new Map();
    }

    clearCache() {
        this.cache.clear();
    }

    async request(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const token = localStorage.getItem('token');
        
        if (options.method === 'GET' && !options.noCache) {
            const cached = this.cache.get(url);
            if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) { // 5 minutes cache
                return cached.data;
            }
        }

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

                let data;
                try {
                    data = await response.json();
                } catch(e) {
                    data = {};
                }

                if (!response.ok) {
                    if (response.status >= 500 && retries > 0) {
                        throw new Error('Server Error');
                    }
                    throw new Error(data.message || response.statusText || 'Load Failed');
                }

                if (options.method === 'GET') {
                    this.cache.set(url, { data, timestamp: Date.now() });
                }

                return data;
            } catch (error) {
                if (retries === 0 || error.message === 'Unauthorized' || error.message === 'Server Error' === false) {
                    throw error instanceof Error ? error : new Error(error.message || 'Load Failed');
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
        this.clearCache();
        return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    }

    put(endpoint, body, options = {}) {
        this.clearCache();
        return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
    }

    patch(endpoint, body, options = {}) {
        this.clearCache();
        return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
    }

    delete(endpoint, options = {}) {
        this.clearCache();
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

const api = new APIClient();
export default api;
