import { defineConfig, devices } from '@playwright/test';

/** Porta só do preview dos testes; o dev server segue na 5173. */
const PORTA = 4190;

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  forbidOnly: true, // um test.only esquecido nunca passa despercebido
  retries: 0,
  // A página roda WebGL e scrub de rolagem: um navegador por vez evita disputa de CPU/GPU, que deixaria os tempos instáveis.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'celular',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    // Sempre um build novo: nunca testar um preview velho que tenha ficado aberto na porta.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
