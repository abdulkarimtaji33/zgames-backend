import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('api'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().default('root'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().default('cgagames'),
  // Required (no fallback) in production — booting with a hardcoded, source-visible default
  // secret would let anyone who reads this file forge valid JWTs. Dev/test keep a convenience
  // default so local setup isn't blocked.
  JWT_SECRET: Joi.string().min(16).when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().default('dev-only-insecure-default-do-not-use-in-production'),
  }),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  AWS_REGION: Joi.string().default('me-south-1'),
  AWS_S3_BUCKET: Joi.string().allow('').default(''),
  AWS_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  STRIPE_SECRET_KEY: Joi.string().allow('').default(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').default(''),
  RESEND_API_KEY: Joi.string().allow('').default(''),
  RESEND_FROM_EMAIL: Joi.string().default('noreply@cgagames.com'),
  TWILIO_ACCOUNT_SID: Joi.string().allow('').default(''),
  TWILIO_AUTH_TOKEN: Joi.string().allow('').default(''),
  TWILIO_FROM_NUMBER: Joi.string().allow('').default(''),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  API_URL: Joi.string().default('http://localhost:3001/api'),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').default(''),
  FACEBOOK_APP_ID: Joi.string().allow('').default(''),
  FACEBOOK_APP_SECRET: Joi.string().allow('').default(''),
});
