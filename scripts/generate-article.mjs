#!/usr/bin/env node
/**
 * Auto-generate blog articles using Groq LLM + MITECO real price data
 * Publishes directly to NocoDB.
 *
 * Usage:
 *   GROQ_API_KEY=xxx NOCODB_API_URL=xxx NOCODB_API_TOKEN=xxx \
 *   NOCODB_TABLE_ID=xxx BLOG_TYPE=precios node scripts/generate-article.mjs
 *
 * BLOG_TYPE: "precios" | "localizaciones"
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const NOCODB_API_URL = process.env.NOCODB_API_URL;
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;
const NOCODB_TABLE_ID = process.env.NOCODB_TABLE_ID;
const BLOG_TYPE = process.env.BLOG_TYPE || 'precios';
const NOCODB_PROJECT_ID = 'p8wh8nhbbaikuv8';

if (!GROQ_API_KEY || !NOCODB_API_URL || !NOCODB_API_TOKEN || !NOCODB_TABLE_ID) {
  console.error('Missing required env vars: GROQ_API_KEY, NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_TABLE_ID');
  process.exit(1);
}

// ──── 1. Fetch real MITECO prices ────

async function fetchMitecoPrices() {
  console.log('📊 Fetching MITECO prices...');
  const res = await fetch(
    'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarworkerantes/PreciosCarworkerantes/EstacionesTerrestres/'
  );
  if (!res.ok) throw new Error(`MITECO API error: ${res.status}`);
  const data = await res.json();
  const stations = data.ListaEESSPrecio || [];

  // Calculate averages across Spain
  let g95Sum = 0, g95Count = 0;
  let dieselSum = 0, dieselCount = 0;
  const byCCAA = {};

  for (const s of stations) {
    const g95 = parseFloat((s['Precio Gasolina 95 E5'] || '').replace(',', '.'));
    const diesel = parseFloat((s['Precio Gasoleo A'] || '').replace(',', '.'));
    const ccaa = s['IDCCAA'] || 'Desconocida';
    const ccaaName = s['Provincia'] || ccaa;
    const province = s['Provincia'] || '';

    if (!isNaN(g95) && g95 > 0) { g95Sum += g95; g95Count++; }
    if (!isNaN(diesel) && diesel > 0) { dieselSum += diesel; dieselCount++; }

    if (!byCCAA[province]) byCCAA[province] = { g95: [], diesel: [], cheapest: null };
    if (!isNaN(g95) && g95 > 0) byCCAA[province].g95.push(g95);
    if (!isNaN(diesel) && diesel > 0) byCCAA[province].diesel.push(diesel);

    // Track cheapest station per province
    const price = !isNaN(g95) && g95 > 0 ? g95 : (!isNaN(diesel) && diesel > 0 ? diesel : 999);
    if (!byCCAA[province].cheapest || price < byCCAA[province].cheapest.price) {
      byCCAA[province].cheapest = {
        name: s['Rótulo'] || 'Desconocida',
        address: s['Dirección'] || '',
        locality: s['Localidad'] || '',
        price,
        municipality: s['Municipio'] || '',
      };
    }
  }

  // Get top 5 cheapest provinces
  const provinceAvgs = Object.entries(byCCAA)
    .filter(([, v]) => v.g95.length > 5)
    .map(([name, v]) => ({
      name,
      avgG95: (v.g95.reduce((a, b) => a + b, 0) / v.g95.length).toFixed(3),
      avgDiesel: v.diesel.length > 0 ? (v.diesel.reduce((a, b) => a + b, 0) / v.diesel.length).toFixed(3) : 'N/A',
      cheapest: v.cheapest,
    }))
    .sort((a, b) => parseFloat(a.avgG95) - parseFloat(b.avgG95));

  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  return {
    date: today,
    totalStations: stations.length,
    avgG95: g95Count > 0 ? (g95Sum / g95Count).toFixed(3) : 'N/A',
    avgDiesel: dieselCount > 0 ? (dieselSum / dieselCount).toFixed(3) : 'N/A',
    cheapestProvinces: provinceAvgs.slice(0, 5),
    mostExpensiveProvinces: provinceAvgs.slice(-3).reverse(),
  };
}

// ──── 2. Generate article with Groq ────

const PROMPTS = {
  precios: (data) => `Eres un periodista experto en energía y combustibles en España. Escribe un artículo de blog SEO en español sobre los precios de la gasolina HOY.

DATOS REALES de MITECO (${data.date}):
- Total gasolineras en España: ${data.totalStations}
- Precio medio Gasolina 95: ${data.avgG95} €/L
- Precio medio Diésel: ${data.avgDiesel} €/L
- Provincias más baratas: ${data.cheapestProvinces.map(p => `${p.name} (${p.avgG95}€)`).join(', ')}
- Provincias más caras: ${data.mostExpensiveProvinces.map(p => `${p.name} (${p.avgG95}€)`).join(', ')}

INSTRUCCIONES:
1. Título SEO atractivo que incluya "precio gasolina" y la fecha actual
2. Excerpt de 1-2 frases para preview
3. Contenido de 600-900 palabras en Markdown con h2 y h3
4. Incluye análisis de tendencias, comparativas por provincia, y consejos de ahorro
5. Tono profesional pero accesible
6. NO inventes datos, usa solo los proporcionados
7. Categoría: elige una de [Precios, Tendencias, Ahorro, Análisis]

Responde SOLO en JSON con esta estructura:
{
  "title": "...",
  "slug": "...",
  "excerpt": "...",
  "content": "...(markdown)...",
  "category": "..."
}`,

  localizaciones: (data) => `Eres un periodista experto en gasolineras y movilidad en España. Escribe un artículo de blog SEO en español sobre las gasolineras más baratas por localización.

DATOS REALES de MITECO (${data.date}):
- Total gasolineras en España: ${data.totalStations}
- Provincias más baratas: ${JSON.stringify(data.cheapestProvinces.map(p => ({
    provincia: p.name,
    mediaG95: p.avgG95 + '€/L',
    gasoineraMásBarata: p.cheapest?.name,
    dirección: p.cheapest?.address,
    localidad: p.cheapest?.locality,
  })), null, 2)}
- Provincias más caras: ${data.mostExpensiveProvinces.map(p => `${p.name} (${p.avgG95}€)`).join(', ')}

INSTRUCCIONES:
1. Título SEO atractivo que incluya "gasolineras baratas" y una ciudad/provincia concreta
2. Excerpt de 1-2 frases para preview
3. Contenido de 600-900 palabras en Markdown con h2 y h3
4. Incluye nombres reales de gasolineras, direcciones y precios
5. Da consejos prácticos de cómo encontrar la gasolinera más barata
6. Tono profesional pero accesible
7. Categoría: elige una de [Ciudades, Rutas, Comparativas, Guías]

Responde SOLO en JSON con esta estructura:
{
  "title": "...",
  "slug": "...",
  "excerpt": "...",
  "content": "...(markdown)...",
  "category": "..."
}`,
};

async function generateArticle(priceData) {
  console.log(`🤖 Generating ${BLOG_TYPE} article with Groq...`);

  const prompt = PROMPTS[BLOG_TYPE](priceData);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');

  return JSON.parse(content);
}

// ──── 3. Publish to NocoDB ────

async function publishToNocoDB(article) {
  console.log(`📝 Publishing "${article.title}" to NocoDB...`);

  const now = new Date().toISOString();
  const payload = {
    Title: article.title,
    Slug: article.slug,
    Excerpt: article.excerpt,
    Content: article.content,
    CoverImage: '',
    Category: article.category,
    Published: true,
    PublishedAt: now,
  };

  const res = await fetch(
    `${NOCODB_API_URL}/api/v1/db/data/noco/${NOCODB_PROJECT_ID}/${NOCODB_TABLE_ID}`,
    {
      method: 'POST',
      headers: {
        'xc-token': NOCODB_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NocoDB publish error: ${res.status} — ${err}`);
  }

  const result = await res.json();
  console.log(`✅ Published! Row ID: ${result.Id}`);
  return result;
}

// ──── Main ────

async function main() {
  try {
    const priceData = await fetchMitecoPrices();
    console.log(`📊 Spain avg: G95=${priceData.avgG95}€ Diesel=${priceData.avgDiesel}€ (${priceData.totalStations} stations)`);

    const article = await generateArticle(priceData);
    console.log(`📄 Article: "${article.title}" [${article.category}]`);

    await publishToNocoDB(article);
    console.log('🎉 Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
