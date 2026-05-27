const defaultApiBaseUrl = import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:8443`
    : '';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;
export const GRAPHQL_ENDPOINT = `${API_BASE_URL}/graphql`;
export const WS_ENDPOINT = `${API_BASE_URL.replace(/^http/, 'ws')}/ws`;

export async function graphqlRequest({ query, variables, signal }) {
    const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, variables }),
        signal
    });

    return response.json();
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
