export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  jwt_key: process.env.JWT_KEY || 'default key',
  api_url: process.env.API_URL || 'https://rickandmortyapi.com/api/',
  client_url: process.env.CLIENT_URL || 'http://localhost:5000',
  server_url: process.env.SERVER_URL || 'http://localhost:3000',
  image_folder: process.env.IMAGE_FOLDER || 'public',
  stripe_key: process.env.STRIPE_KEY || '',
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || '',
});
