const defaultApiBaseUrl = import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:8443`
    : '';

const AUTH_TOKEN_STORAGE_KEY = 'disclio_access_token';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;
export const GRAPHQL_ENDPOINT = `${API_BASE_URL}/graphql`;
export const WS_ENDPOINT = `${API_BASE_URL.replace(/^http/, 'ws')}/ws`;

export function getAuthToken() {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token) {
    if (token) {
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
}

export function clearAuthToken() {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export async function graphqlRequest({ query, variables, signal }) {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ query, variables }),
        signal
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const message = getGraphQLErrorMessage(result) || `Request failed with status ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.result = result;
        throw error;
    }

    return result;
}

export function getGraphQLErrorMessage(result) {
    if (!result?.errors) {
        return null;
    }

    if (Array.isArray(result.errors)) {
        return result.errors.map(error => error.message).join(', ');
    }

    return result.errors.message || 'Unknown GraphQL error';
}

export function hasAuthError(result) {
    const message = getGraphQLErrorMessage(result);
    return Boolean(message && /access denied|unauth|forbidden/i.test(message));
}
