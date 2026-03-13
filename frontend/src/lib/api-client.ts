const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
}

export const api = {
    get: <T>(url: string) => fetchApi<T>(url, { method: 'GET' }),
    post: <T>(url: string, body: any) => fetchApi<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(url: string, body: any) => fetchApi<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
};
