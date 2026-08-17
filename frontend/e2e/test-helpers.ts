import { Page } from '@playwright/test';

export async function mockAuthenticatedUser(
  page: Page,
  options: {
    name?: string;
    email?: string;
    userName?: string;
  } = {}
) {
  const name = options.name || 'Jeremy Bourdier';
  const email = options.email || 'bourdierestrellajeremy@gmail.com';
  const userName = options.userName || 'JeremyBourdier';

  const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItMTIzIiwiZXhwIjoyMTAyNTA4MzE1LCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.mocksignature';

  await page.addInitScript(
    ({ jwt, name, email, userName }) => {
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
          email,
          app_metadata: { provider: 'github', providers: ['github'] },
          user_metadata: {
            name,
            full_name: name,
            user_name: userName,
            avatar_url: `https://github.com/${userName}.png`,
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
    },
    { jwt: mockJwt, name, email, userName }
  );
}
