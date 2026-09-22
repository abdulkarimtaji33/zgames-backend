export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'cgagames',
  },
  jwt: {
    // Joi validation (validation.schema.ts) requires JWT_SECRET in production and boots the app
    // if it's missing there — this fallback only ever applies in dev/test, matching Joi's own
    // dev-only default, since Joi's default() doesn't mutate process.env for this factory to read.
    secret: process.env.JWT_SECRET ?? 'dev-only-insecure-default-do-not-use-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },
  aws: {
    region: process.env.AWS_REGION ?? 'me-south-1',
    bucket: process.env.AWS_S3_BUCKET ?? '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  },
  likecardCrypto: {
    // Confirmed against LikeCard's own API docs worked example (Create Order / Order Details 200
    // response sections) — separate from hashKey/securityCode, used only to AES-256-CBC decrypt
    // serialCode into the actual redeemable code.
    secretKey: process.env.LIKECARD_SECRET_KEY ?? '',
    secretIv: process.env.LIKECARD_SECRET_IV ?? '',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    fromEmail: process.env.RESEND_FROM_EMAIL ?? 'noreply@cgagames.com',
  },
  smtp: {
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    fromNumber: process.env.TWILIO_FROM_NUMBER ?? '',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },
  apiUrl: process.env.API_URL ?? 'http://localhost:3001/api',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  oauth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    facebookAppId: process.env.FACEBOOK_APP_ID ?? '',
    facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? '',
  },
  likecard: {
    apiUrl: process.env.LIKECARD_API_URL ?? 'https://taxes.like4app.com',
    deviceId: process.env.LIKECARD_DEVICE_ID ?? '',
    email: process.env.LIKECARD_EMAIL ?? '',
    securityCode: process.env.LIKECARD_SECURITY_CODE ?? '',
    langId: parseInt(process.env.LIKECARD_LANG_ID ?? '1', 10),
    hashPhone: process.env.LIKECARD_HASH_PHONE ?? '',
    hashKey: process.env.LIKECARD_HASH_KEY ?? '',
    markupPercent: parseFloat(process.env.LIKECARD_MARKUP_PERCENT ?? '0'),
  },
});
