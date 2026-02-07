// =============================================================================
// API Client - Fetch wrapper with auth handling
// =============================================================================

const API_BASE = '/api';

interface RequestOptions extends RequestInit {
    skipAuth?: boolean;
}

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    getToken() {
        return this.token;
    }

    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { skipAuth = false, ...fetchOptions } = options;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(fetchOptions.headers || {}),
        };

        if (!skipAuth && this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        // Add .php extension for PHP backend
        // Handle RESTful paths like /admin/suppliers/123 -> /admin/suppliers.php?id=123
        let url = `${API_BASE}${endpoint}`;

        // Check if this is a RESTful path with numeric ID at the end
        const restfulMatch = url.match(/^(.+?)\/(\d+)(\?.*)?$/);
        if (restfulMatch) {
            const [, basePath, id, queryString] = restfulMatch;
            const base = basePath.includes('.php') ? basePath : `${basePath}.php`;
            const separator = queryString ? '&' : '?';
            url = queryString
                ? `${base}${queryString}${separator}id=${id}`
                : `${base}?id=${id}`;
        } else if (!url.includes('.php') && !url.includes('?')) {
            url += '.php';
        } else if (!url.includes('.php') && url.includes('?')) {
            url = url.replace('?', '.php?');
        }

        const response = await fetch(url, {
            ...fetchOptions,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || error.message || `HTTP error ${response.status}`);
        }

        return response.json();
    }

    get<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    post<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    put<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    patch<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    delete<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();

