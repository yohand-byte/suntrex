const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');

// CORS for Vercel frontend
fastify.register(cors, {
  origin: ['https://suntrex.vercel.app', 'http://localhost:5173'],
});

// Routes
fastify.register(require('./routes/stripe-webhook'), { prefix: '/api' });
fastify.register(require('./routes/stripe-checkout'), { prefix: '/api' });
fastify.register(require('./routes/stripe-connect'), { prefix: '/api' });
fastify.register(require('./routes/support-chat-ai'), { prefix: '/api' });
fastify.register(require('./routes/verify-vat'), { prefix: '/api' });
fastify.register(require('./routes/admin-stats'), { prefix: '/api' });
fastify.register(require('./routes/blog-ai-generate'), { prefix: '/api' });
fastify.register(require('./routes/blog-rss'), { prefix: '/api' });
fastify.register(require('./routes/blog-sitemap'), { prefix: '/api' });
fastify.register(require('./routes/escrow'), { prefix: '/api' });
fastify.register(require('./routes/whatsapp-webhook'), { prefix: '/api' });
fastify.register(require('./routes/delivery'), { prefix: '/api' });
fastify.register(require('./routes/fraud-detection'), { prefix: '/api' });

// Health check (Cloud Run)
fastify.get('/health', async () => ({ status: 'ok', version: '1.0.0' }));

const PORT = process.env.PORT || 8080;
fastify.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  console.log('SUNTREX API on port ' + PORT);
});
