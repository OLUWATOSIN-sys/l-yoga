const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const prodUrl = 'https://secure-group-api.onrender.com'; // replace with your actual production URL

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Secure Group Messaging API',
      version: '1.0.0',
      description: 'API documentation for the Secure Group Messaging System',
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? prodUrl
            : `http://localhost:${process.env.PORT || 5000}`,
        description:
          process.env.NODE_ENV === 'production'
            ? 'Production server'
            : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

console.log('NODE_ENV:', process.env.NODE_ENV); // debug log

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};