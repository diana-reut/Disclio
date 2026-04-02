import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display the main logo and description text', async ({ page }) => {
        const description = page.locator('.description');
        await expect(description).toContainText('Disclio is a digital archive');

        const logo = page.locator('.main-logo');
        await expect(logo).toBeVisible();
        await expect(logo).toHaveAttribute('src', '/name.png');
    });

    test('should navigate to /auth with signup state when clicking Sign Up', async ({ page }) => {
        const signupBtn = page.getByRole('button', { name: /sign up/i });

        await signupBtn.click();

        await expect(page).toHaveURL(/\/auth/);

    });

    test('should navigate to /auth with login state when clicking Log In', async ({ page }) => {
        const loginBtn = page.getByRole('button', { name: /log in/i });

        await loginBtn.click();

        await expect(page).toHaveURL(/\/auth/);
    });

    test('should show the promotional overlay text', async ({ page }) => {
        const overlayText = page.locator('.image-overlay-text');
        await expect(overlayText).toHaveText('Organisation in one click!');
    });

});
