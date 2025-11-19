// jest-dom adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

//(jsdom n'implémente pas toujours cette méthode)
;(Element.prototype as any).scrollIntoView = (Element.prototype as any).scrollIntoView || function () { /* no-op pour tests */ };

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});