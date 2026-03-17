// lgd-monday-proxy — Cloudflare Worker
// Proxies form submissions from letsgrowdigital.ai to Monday.com API v2
// API token stored as Cloudflare Secret: MONDAY_API_TOKEN

const BOARD_ID = 18404299545; // ← confirm this matches your board URL
const ALLOWED_ORIGIN = 'https://letsgrowdigital.ai';

const cors = (origin) => ({
  'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : 'null',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    // ── GET /columns ─────────────────────────────────────────────
    // Helper endpoint: visit in browser to see all column IDs on your board.
    // Remove or restrict this once you've mapped your columns.
    if (request.method === 'GET' && url.pathname === '/columns') {
      const query = `query {
        boards(ids: [${BOARD_ID}]) {
          name
          columns { id title type }
        }
      }`;

      const res = await mondayRequest(query, env.MONDAY_API_TOKEN);
      const data = await res.json();
      return new Response(JSON.stringify(data, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── POST / — form submission ──────────────────────────────────
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid request body' }, 400, cors(origin));
    }

    const { firstName, lastName, email, company, goal, budget, description } = body;

    if (!firstName || !lastName || !email || !company) {
      return json({ error: 'Missing required fields' }, 422, cors(origin));
    }

    const itemName = `${firstName} ${lastName} — ${company}`;

    const columnValues = {
      text_mm1h9h2n:   email,
      text_mm1hmpav:   company,
      dropdown_mm1h6zpz: goal   ? { labels: [goal] }            : undefined,
      text_mm1hvcfh:   description || '',
      numeric_mm1hmrqe: budget  ? String(budget)                : undefined,
    };

    const mutation = `mutation {
      create_item(
        board_id: ${BOARD_ID},
        item_name: ${JSON.stringify(itemName)},
        column_values: ${JSON.stringify(JSON.stringify(columnValues))}
      ) { id }
    }`;

    let res, data;
    try {
      res  = await mondayRequest(mutation, env.MONDAY_API_TOKEN);
      data = await res.json();
    } catch (err) {
      return json({ error: 'Failed to reach Monday.com' }, 502, cors(origin));
    }

    if (data.errors?.length) {
      console.error('Monday API error:', JSON.stringify(data.errors));
      return json({ error: data.errors[0].message }, 500, cors(origin));
    }

    return json({ success: true, id: data.data?.create_item?.id }, 200, cors(origin));
  },
};

// ── Helpers ───────────────────────────────────────────────────────

function mondayRequest(query, token) {
  return fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': token,
      'API-Version':   '2025-01',
    },
    body: JSON.stringify({ query }),
  });
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}
