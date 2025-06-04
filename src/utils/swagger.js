const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const prodUrl = 'https://secure-group-api.onrender.com'; // your actual production URL
const localUrl = `http://localhost:${process.env.PORT || 5000}`; // dev URL

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
        url: prodUrl,
        description: 'Production server',
      },
      {
        url: localUrl,
        description: 'Development server',
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
