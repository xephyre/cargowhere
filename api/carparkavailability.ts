/**
 * Serverless function: LTA DataMall CarParkAvailabilityv2 Proxy
 * Endpoint: GET /api/carparkavailability
 *
 * Pulls real-time lot availability for HDB, LTA, and URA carparks
 * from Singapore LTA DataMall OData Service:
 * https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
 */

export interface LtaCarparkRecord {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // e.g. "1.2935 103.8572" (Latitude Longitude)
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y' | string;
  Agency: 'HDB' | 'LTA' | 'URA' | string;
}

export interface LtaApiResponse {
  'odata.metadata'?: string;
  value: LtaCarparkRecord[];
}

const LTA_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export default async function handler(req: any, res?: any) {
  // CORS & Methods check
  const method = req.method || 'GET';
  if (method === 'OPTIONS') {
    return handleCors(res);
  }

  // Extract account key from environment or headers
  const accountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    getHeader(req, 'accountkey') ||
    getHeader(req, 'x-account-key') ||
    getQueryParam(req, 'accountKey');

  // Verify that an AccountKey is provided
  if (!accountKey) {
    const errorResponse = {
      success: false,
      error: 'MISSING_LTA_ACCOUNT_KEY',
      message:
        'LTA_ACCOUNT_KEY is not configured. Please set the LTA_ACCOUNT_KEY environment variable or pass an AccountKey header.',
      targetEndpoint: LTA_ENDPOINT,
      documentation:
        'Request an AccountKey at https://datamall.lta.gov.sg/ and set LTA_ACCOUNT_KEY in your serverless deployment environment or .env file.',
    };
    return sendJson(res, 401, errorResponse);
  }

  // Parse query parameters
  const skip = parseInt(getQueryParam(req, 'skip') || '0', 10);
  const fetchAll = getQueryParam(req, 'all') === 'true';

  try {
    if (fetchAll) {
      // Loop with $skip to retrieve all batches (each page is 500 records)
      let allRecords: LtaCarparkRecord[] = [];
      let currentSkip = 0;
      let hasMore = true;
      let iterations = 0;
      const MAX_PAGES = 10; // Safety guard: up to 5,000 records

      while (hasMore && iterations < MAX_PAGES) {
        iterations++;
        const url = `${LTA_ENDPOINT}?$skip=${currentSkip}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            AccountKey: accountKey,
            accept: 'application/json',
          },
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(
            `LTA DataMall API responded with HTTP ${response.status}: ${errText}`
          );
        }

        const data = (await response.json()) as LtaApiResponse;
        const records = data.value || [];
        allRecords = allRecords.concat(records);

        if (records.length < 500) {
          hasMore = false;
        } else {
          currentSkip += 500;
        }
      }

      return sendJson(res, 200, {
        success: true,
        source: 'Singapore LTA DataMall (CarParkAvailabilityv2)',
        totalRecords: allRecords.length,
        timestamp: new Date().toISOString(),
        value: allRecords,
      });
    } else {
      // Single page fetch using $skip
      const url = skip > 0 ? `${LTA_ENDPOINT}?$skip=${skip}` : LTA_ENDPOINT;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          AccountKey: accountKey,
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        return sendJson(res, response.status, {
          success: false,
          error: 'LTA_DATAMALL_ERROR',
          statusCode: response.status,
          message: `LTA DataMall rejected the request: ${errText}`,
        });
      }

      const data = (await response.json()) as LtaApiResponse;
      return sendJson(res, 200, {
        success: true,
        source: 'Singapore LTA DataMall (CarParkAvailabilityv2)',
        skip,
        totalRecords: data.value ? data.value.length : 0,
        timestamp: new Date().toISOString(),
        value: data.value || [],
      });
    }
  } catch (error: any) {
    return sendJson(res, 502, {
      success: false,
      error: 'GATEWAY_ERROR',
      message: error?.message || 'Failed to connect to LTA DataMall API',
      targetEndpoint: LTA_ENDPOINT,
    });
  }
}

// Helper: Extract header regardless of Node/Express or Web Request
function getHeader(req: any, headerName: string): string | null {
  if (!req) return null;
  const name = headerName.toLowerCase();
  if (req.headers) {
    if (typeof req.headers.get === 'function') {
      return req.headers.get(name);
    }
    return req.headers[name] || req.headers[headerName] || null;
  }
  return null;
}

// Helper: Extract query parameter
function getQueryParam(req: any, paramName: string): string | null {
  if (!req) return null;
  if (req.query && req.query[paramName] !== undefined) {
    return String(req.query[paramName]);
  }
  if (req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      return parsedUrl.searchParams.get(paramName);
    } catch {
      return null;
    }
  }
  return null;
}

// Helper: Handle CORS preflight
function handleCors(res?: any) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'AccountKey, x-account-key, Content-Type',
  };

  if (!res && typeof Response !== 'undefined') {
    return new Response(null, { status: 204, headers });
  }

  if (res && typeof res.setHeader === 'function') {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    if (typeof res.status === 'function') return res.status(204).end();
    if (typeof res.writeHead === 'function') {
      res.writeHead(204);
      res.end();
      return;
    }
  }
}

// Helper: Send JSON response across Vercel, Node, and Web runtimes
function sendJson(res: any, status: number, body: Record<string, any>) {
  // Support Web Edge / Fetch runtime (no res passed)
  if (!res && typeof Response !== 'undefined') {
    return new Response(JSON.stringify(body, null, 2), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Standard Express / Vercel Serverless Function
  if (res && typeof res.status === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(status).json(body);
  }

  // Node http ServerResponse
  if (res && typeof res.writeHead === 'function') {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(JSON.stringify(body, null, 2));
    return;
  }

  return body;
}
