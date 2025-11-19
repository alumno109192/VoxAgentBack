import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Rutas a los archivos mock
const MOCK_DIR = path.join(__dirname, '../../data/mock');
const CONFIG_FILE = path.join(MOCK_DIR, 'widget-config-demo.json');
const INTERACTIONS_FILE = path.join(MOCK_DIR, 'voxagentai-demo.json');

/**
 * @swagger
 * /widget-mock/config:
 *   get:
 *     summary: Obtener configuración mock del widget (sin autenticación)
 *     description: Endpoint de prueba que devuelve configuración mock del widget para desarrollo rápido
 *     tags: [Widget Mock]
 *     responses:
 *       200:
 *         description: Configuración del widget
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                   example: demo
 *                 theme:
 *                   type: string
 *                   example: light
 *                 language:
 *                   type: string
 *                   example: es-ES
 *                 voice:
 *                   type: string
 *                   example: female
 *                 position:
 *                   type: string
 *                   example: bottom-right
 *                 brandLogo:
 *                   type: string
 *                   example: https://cdn.voxagent.ai/logo.png
 */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configData);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer configuración mock' });
  }
});

/**
 * @swagger
 * /widget-mock/query:
 *   post:
 *     summary: Procesar consulta mock (sin validación de API Key)
 *     description: Endpoint de prueba que simula respuestas de VoxAgentAI sin autenticación
 *     tags: [Widget Mock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: ¿Qué servicios ofrecen?
 *               mode:
 *                 type: string
 *                 enum: [text, voice]
 *                 default: text
 *               sessionId:
 *                 type: string
 *                 example: demo-session-123
 *     responses:
 *       200:
 *         description: Respuesta generada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                   example: demo
 *                 query:
 *                   type: string
 *                 response:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 mode:
 *                   type: string
 *                 metadata:
 *                   type: object
 */
router.post('/query', async (req: Request, res: Response): Promise<any> => {
  try {
    const { query, mode = 'text', sessionId = 'demo-session' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query es requerido' });
    }

    // Generar respuesta mock contextual
    const response = generateMockResponse(query);

    // Crear interacción
    const interaction = {
      id: `demo-interaction-${Date.now()}`,
      tenantId: 'demo',
      sessionId,
      query,
      response,
      mode,
      metadata: {
        tokens: Math.floor(Math.random() * 20) + 15,
        cost: 0.0003,
        duration: Math.floor(Math.random() * 300) + 300,
        userAgent: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || '127.0.0.1'
      },
      timestamp: new Date().toISOString()
    };

    // Guardar en archivo (opcional)
    try {
      const interactionsData = await fs.readFile(INTERACTIONS_FILE, 'utf-8');
      const interactions = JSON.parse(interactionsData);
      interactions.push(interaction);
      
      // Mantener solo las últimas 100 interacciones
      if (interactions.length > 100) {
        interactions.shift();
      }
      
      await fs.writeFile(INTERACTIONS_FILE, JSON.stringify(interactions, null, 2));
    } catch (error) {
      console.warn('No se pudo guardar la interacción mock:', error);
    }

    res.json(interaction);
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar consulta mock' });
  }
});

/**
 * @swagger
 * /widget-mock/interactions:
 *   get:
 *     summary: Obtener historial de interacciones mock
 *     description: Devuelve las interacciones almacenadas en el archivo mock
 *     tags: [Widget Mock]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de interacciones a devolver
 *     responses:
 *       200:
 *         description: Lista de interacciones
 */
router.get('/interactions', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const interactionsData = await fs.readFile(INTERACTIONS_FILE, 'utf-8');
    const interactions = JSON.parse(interactionsData);
    
    // Devolver las últimas N interacciones
    const result = interactions.slice(-limit).reverse();
    
    res.json({
      total: interactions.length,
      limit,
      interactions: result
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al leer interacciones mock' });
  }
});

/**
 * @swagger
 * /widget-mock/stats:
 *   get:
 *     summary: Obtener estadísticas mock
 *     description: Devuelve estadísticas agregadas de las interacciones mock
 *     tags: [Widget Mock]
 *     responses:
 *       200:
 *         description: Estadísticas del widget
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const interactionsData = await fs.readFile(INTERACTIONS_FILE, 'utf-8');
    const interactions = JSON.parse(interactionsData);
    
    // Calcular estadísticas
    const totalCost = interactions.reduce((sum: number, i: any) => sum + (i.metadata?.cost || 0), 0);
    const totalTokens = interactions.reduce((sum: number, i: any) => sum + (i.metadata?.tokens || 0), 0);
    const avgDuration = interactions.reduce((sum: number, i: any) => sum + (i.metadata?.duration || 0), 0) / interactions.length;
    
    // Contar por modo
    const byMode = interactions.reduce((acc: any, i: any) => {
      acc[i.mode] = (acc[i.mode] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      total: interactions.length,
      totalCost: parseFloat(totalCost.toFixed(4)),
      totalTokens,
      averageDuration: Math.round(avgDuration),
      byMode,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular estadísticas mock' });
  }
});

// Función auxiliar para generar respuestas contextuales
function generateMockResponse(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Respuestas contextuales
  if (lowerQuery.includes('hola') || lowerQuery.includes('buenos') || lowerQuery.includes('buenas')) {
    return '¡Hola! Soy VoxAgentAI, tu asistente virtual. ¿En qué puedo ayudarte hoy?';
  }
  
  if (lowerQuery.includes('horario') || lowerQuery.includes('hora')) {
    return 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 horas.';
  }
  
  if (lowerQuery.includes('precio') || lowerQuery.includes('costo') || lowerQuery.includes('plan')) {
    return 'Ofrecemos varios planes adaptados a tus necesidades. Contáctanos para una cotización personalizada.';
  }
  
  if (lowerQuery.includes('contacto') || lowerQuery.includes('correo') || lowerQuery.includes('email')) {
    return 'Puedes contactarnos en info@voxagent.ai o llamar al 900-123-456.';
  }
  
  if (lowerQuery.includes('soporte') || lowerQuery.includes('ayuda') || lowerQuery.includes('problema')) {
    return 'Nuestro equipo de soporte está disponible en soporte@voxagent.ai. Te responderemos en menos de 24 horas.';
  }
  
  // Respuesta genérica
  return `Gracias por tu consulta sobre "${query}". Nuestro equipo está procesando tu solicitud. ¿Hay algo más en lo que pueda ayudarte?`;
}

export default router;
