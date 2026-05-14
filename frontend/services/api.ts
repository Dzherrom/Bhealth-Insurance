import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const getHeaders = () => {
    let token = null;
    if (typeof window !== 'undefined') {
        const authData = localStorage.getItem('AuthStore');
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                token = parsed.state?.accessToken;
            } catch (e) {}
        }
    }
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        let errMessage = 'API Error';
        try {
            const errData = await response.json();
            errMessage = errData.detail || errData.message || JSON.stringify(errData);
        } catch (e) {}
        throw new Error(errMessage);
    }
    if (response.status === 204) return null;
    return response.json();
};

export const api = {
    get: async (url: string) => {
        const res = await fetch(`${API_BASE_URL}${url}`, { headers: getHeaders() });
        return { data: await handleResponse(res) };
    },
    post: async (url: string, data: any) => {
        const res = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return { data: await handleResponse(res) };
    },
    put: async (url: string, data: any) => {
        const res = await fetch(`${API_BASE_URL}${url}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return { data: await handleResponse(res) };
    },
    delete: async (url: string) => {
        const res = await fetch(`${API_BASE_URL}${url}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return { data: await handleResponse(res) };
    },
};

export default api;