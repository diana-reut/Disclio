import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

const createStorageMock = () => {
    let store = {};

    return {
        getItem: vi.fn((key) => (key in store ? store[key] : null)),
        setItem: vi.fn((key, value) => {
            store[key] = String(value);
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn((index) => Object.keys(store)[index] ?? null),
        get length() {
            return Object.keys(store).length;
        }
    };
};

const localStorageMock = createStorageMock();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true
});

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true
});

beforeEach(() => {
    window.localStorage.clear();
    document.cookie = '';
});
