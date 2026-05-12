// lgd-monday-proxy — Cloudflare Worker
// Proxies form submissions from letsgrowdigital.ai to Monday.com API v2
// API token stored as Cloudflare Secret: MONDAY_API_TOKEN

const BOARD_ID = 18404299545; // ← confirm this matches your board URL

// Allowed origins regex — matches LGD, LGC, LGP, Daven Insurance on either .com or .ai
// with optional www. Adjust the inner group when adding/removing sites.
const ALLOWED_ORIGIN_RE = /^https:\/\/(www\.)?(letsgrowdigital|letsgrowclients|letsgrowpatients|daven-insurance)\.(com|ai)$/;

const cors = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN_RE.test(origin) ? origin : 'null',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin',
});

// Map an Origin to a human-readable lead-source label
function deriveSource(origin) {
  if (/letsgrowclients/.test(origin)) return 'Lets Grow Clients';
  if (/letsgrowpatients/.test(origin)) return 'Lets Grow Patients';
  if (/daven-insurance/.test(origin)) return 'Daven Insurance';
  if (/letsgrowdigital/.test(origin)) return 'Lets Grow Digital';
  return 'Unknown';
}

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

    // Accept BOTH shapes of payload:
    //   LGD/agency:   { firstName, lastName, email, company, goal, budget, description, ... }
    //   LGC/LGP/Daven: { name, email, phone, message, company?, ... }
    const {
      firstName, lastName, name,
      email, phone, company,
      goal, budget,
      description, message,
      source,
    } = body;

    // Only email is universally required; derive a name from whatever was provided
    if (!email) {
      return json({ error: 'Email is required' }, 422, cors(origin));
    }

    let fullName = (name || '').trim();
    if (!fullName) fullName = `${firstName || ''} ${lastName || ''}`.trim();
    if (!fullName) fullName = email; // last-resort fallback

    const detectedSource = source || deriveSource(origin);
    const itemName = company ? `${fullName} — ${company}` : `${fullName} — ${detectedSource}`;

    const columnValues = {
      text_mm1h9h2n:   email,
      text_mm1hmpav:   company || '',
      dropdown_mm1h6zpz: goal ? { labels: [goal] }            : undefined,
      // description (LGD) and message (LGC/LGP/Daven) both land in the long-text column
      text_mm1hvcfh:   description || message || '',
      numeric_mm1hmrqe: budget ? String(budget)               : undefined,
      // ↓ TO ENABLE: add these columns in Monday, then plug their column IDs here:
      // <PHONE_COLUMN_ID>:  phone || '',
      // <SOURCE_COLUMN_ID>: { labels: [detectedSource] },   // for a dropdown/status column
      // OR if you want it as plain text:
      // <SOURCE_COLUMN_ID>: detectedSource,
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
