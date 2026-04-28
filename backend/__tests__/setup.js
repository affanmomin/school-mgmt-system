// Stub the env vars the app reads on import so dotenv.config() doesn't matter.
// Anything secret here is fake — tests never make real network/DB calls.
process.env.NODE_ENV = "test";
process.env.PORT = "5007";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_ACCESS_TOKEN_SECRET = "test-access-secret";
process.env.JWT_REFRESH_TOKEN_SECRET = "test-refresh-secret";
process.env.JWT_ACCESS_TOKEN_TIME_IN_MS = "900000";
process.env.JWT_REFRESH_TOKEN_TIME_IN_MS = "28800000";
process.env.CSRF_TOKEN_SECRET = "test-csrf-secret";
process.env.CSRF_TOKEN_TIME_IN_MS = "950000";
process.env.EMAIL_VERIFICATION_TOKEN_SECRET = "test-email-secret";
process.env.EMAIL_VERIFICATION_TOKEN_TIME_IN_MS = "18000000";
process.env.PASSWORD_SETUP_TOKEN_SECRET = "test-pwd-secret";
process.env.PASSWORD_SETUP_TOKEN_TIME_IN_MS = "300000";
process.env.UI_URL = "http://localhost:5173";
process.env.API_URL = "http://localhost:5007";
process.env.COOKIE_DOMAIN = "localhost";
process.env.RESEND_API_KEY = "re_test";
process.env.MAIL_FROM_USER = "test@example.com";
