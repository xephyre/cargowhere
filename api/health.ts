/**
 * Health check serverless endpoint
 * GET /api/health
 */

export interface HealthResponse {
  status: 'ok';
  service: string;
  hasLtaKey: boolean;
  ltaEndpoint: string;
  timestamp: string;
}

export default async function handler(req: any, res?: any) {
  const hasLtaKey = Boolean(
    process.env.LTA_ACCOUNT_KEY ||
    process.env.DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_ACCOUNT_KEY
  );

  const payload: HealthResponse = {
    status: 'ok',
    service: 'Singapore LTA DataMall Carpark Availability Gateway',
    hasLtaKey,
    ltaEndpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
    timestamp: new Date().toISOString(),
  };

  // Support Web Fetch / Edge API (if res is undefined and req is Request)
  if (!res && typeof Response !== 'undefined') {
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Standard Node.js / Express / Vercel Serverless Function
  if (res && typeof res.status === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).json(payload);
  }

  // Node http ServerResponse
  if (res && typeof res.writeHead === 'function') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(JSON.stringify(payload, null, 2));
    return;
  }

  return payload;
}
