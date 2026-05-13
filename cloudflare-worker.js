// lgd-monday-proxy — Cloudflare Worker
// Proxies form submissions from letsgrowdigital.ai to Monday.com API v2
// API token stored as Cloudflare Secret: MONDAY_API_TOKEN

const BOARD_ID = 18406534251; // bryanboutins-team.monday.com/boards/18406534251

// Allowed origins regex — matches LGD, LGC, LGP, InsureMyBiz123 on either .com or .ai
// with optional www. The "daven-insurance" name is deprecated; current brand is InsureMyBiz123.
const ALLOWED_ORIGIN_RE = /^https:\/\/(www\.)?(letsgrowdigital|letsgrowclients|letsgrowpatients|insuremybiz123)\.(com|ai)$/;

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
  if (/insuremybiz123/.test(origin)) return 'InsureMyBiz123';
  if (/letsgrowdigital/.test(origin)) return 'Lets Grow Digital';
  return 'Unknown';
}

// Short site slug for Sentry filtering ("lgd", "lgc", etc.)
function deriveSiteSlug(origin) {
  if (/letsgrowclients/.test(origin)) return 'lgc';
  if (/letsgrowpatients/.test(origin)) return 'lgp';
  if (/insuremybiz123/.test(origin)) return 'imb123';
  if (/letsgrowdigital/.test(origin)) return 'lgd';
  return 'unknown';
}

// Direct-fetch Sentry reporter. Fails silently so lead capture is never blocked.
// To enable: add SENTRY_DSN secret in CF dashboard (Settings → Variables and Secrets).
async function reportToSentry(err, env, context = {}, origin = '') {
  if (!env.SENTRY_DSN) return;
  try {
    const dsn = new URL(env.SENTRY_DSN);
    const projectId = dsn.pathname.slice(1);
    const publicKey = dsn.username;
    const envelopeUrl = `${dsn.protocol}//${dsn.host}/api/${projectId}/envelope/`;

    const eventId = crypto.randomUUID().replace(/-/g, '');
    const timestamp = Date.now() / 1000;

    const event = {
      event_id: eventId,
      timestamp,
      platform: 'javascript',
      level: 'error',
      logger: 'kb-leads-proxy-worker',
      exception: {
        values: [{
          type: err.name || 'Error',
          value: err.message || String(err),
          stacktrace: err.stack ? {
            frames: err.stack.split('\n').slice(1, 10).map(line => ({
              filename: 'cloudflare-worker.js',
              function: line.trim(),
            })),
          } : undefined,
        }],
      },
      tags: {
        worker: 'kb-leads-proxy',
        site: deriveSiteSlug(origin),
      },
      extra: { ...context, origin },
    };

    const envelopeHeader = JSON.stringify({
      event_id: eventId,
      sent_at: new Date().toISOString(),
      dsn: env.SENTRY_DSN,
    });
    const itemHeader = JSON.stringify({ type: 'event' });
    const envelope = `${envelopeHeader}\n${itemHeader}\n${JSON.stringify(event)}`;

    await fetch(envelopeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=kb-leads-proxy/1.0`,
      },
      body: envelope,
    });
  } catch (sentryErr) {
    console.error('Sentry report failed:', sentryErr);
  }
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
    //   LGD/agency:           { firstName, lastName, email, company, goal, budget, description, ... }
    //   LGC/LGP/InsureMyBiz:  { name, email, phone, message, company?, ... }
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

    // Lead Source for the Monday status column must match one of the predefined labels
    // ("Lets Grow Digital", "Lets Grow Clients", "Lets Grow Patients", "InsureMyBiz123").
    // Always derive from the request Origin — clients can send freeform `source` in the
    // payload (e.g., "Lets Grow Digital Website - Contact Form") but that won't match a
    // status label and would 500 the Monday API. Use the client `source` only as a hint
    // in the description for entry-point tracking.
    const detectedSource = deriveSource(origin);
    const entryPoint = source || '';
    const itemName = company ? `${fullName} — ${company}` : `${fullName} — ${detectedSource}`;

    // Combine description/message/goal/budget/entry-point into the long-text Description column.
    // (Monday board has no dedicated goal/budget columns; fold them into description.)
    const descriptionParts = [];
    if (description) descriptionParts.push(description);
    if (message && message !== description) descriptionParts.push(message);
    if (goal) descriptionParts.push(`Goal: ${goal}`);
    if (budget) descriptionParts.push(`Budget: ${budget}`);
    if (entryPoint && !/^(Lets Grow|InsureMyBiz|Daven)/.test(entryPoint)) descriptionParts.push(`Entry point: ${entryPoint}`);
    const descriptionText = descriptionParts.join('\n\n').trim();

    // Build column values matching the current Monday board structure (board 18406534251).
    // Email/phone/status columns have special formats per Monday API docs.
    const columnValuesRaw = {
      lead_email:           { email: email, text: email },
      lead_company:         company || undefined,
      lead_phone:           phone ? { phone: phone, countryShortName: 'US' } : undefined,
      color_mkyb8krc:       { label: detectedSource },                     // Lead Source (status)
      long_text_mm226ey8:   descriptionText ? { text: descriptionText } : undefined,
    };

    // Strip undefined values so we don't send empty keys to Monday
    const columnValues = Object.fromEntries(
      Object.entries(columnValuesRaw).filter(([, v]) => v !== undefined)
    );

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
      await reportToSentry(err, env, { stage: 'monday_fetch', itemName, columnValues }, origin);
      return json({ error: 'Failed to reach Monday.com' }, 502, cors(origin));
    }

    if (data.errors?.length) {
      console.error('Monday API error:', JSON.stringify(data.errors));
      await reportToSentry(new Error(`Monday API error: ${data.errors[0].message}`), env, {
        stage: 'monday_response',
        mondayErrors: data.errors,
        itemName,
        columnValues,
      }, origin);
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
