import { Page } from '@playwright/test';

export async function mockAuthenticatedUser(page: Page) {
  const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItMTIzIiwiZXhwIjoyMTAyNTA4MzE1LCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.mocksignature';

  await page.addInitScript((jwt) => {
    const mockSession = {
      access_token: jwt,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-123',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'developer@example.com',
        app_metadata: { provider: 'github', providers: ['github'] },
        user_metadata: {
          name: 'Jeremy Bourdier',
          full_name: 'Jeremy Bourdier',
          avatar_url: 'https://github.com/JeremyBourdier.png',
        },
      },
    };

    const keys = [
      'sb-rchvwzvrnnulmfzwmozc-auth-token',
      'supabase.auth.token',
      'sb-auth-token',
    ];

    keys.forEach((key) => {
      try {
        localStorage.setItem(key, JSON.stringify(mockSession));
      } catch (e) {}
    });
  }, mockJwt);
}
