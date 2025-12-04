import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Ключи из Environment Variables
const GEMINI_KEY = process.env.GEMINI_KEY;
const VALUE_SERP_KEY = process.env.VALUE_SERP_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SERPWOW_KEY = process.env.SERPWOW_KEY;

// ---------------------------
// 1) ValueSerp основной
// ---------------------------
async function searchValueSerp(query) {
  try {
    const url = `https://api.valueserp.com/search?api_key=${VALUE_SERP_KEY}&q=${encodeURIComponent(query)}`;
    const r = await fetch(url);
    const json = await r.json();

    if (json.organic_results?.length > 0) return json.organic_results;

    return null;
  } catch {
    return null;
  }
}

// ---------------------------
// 2) SerpAPI fallback
// ---------------------------
async function searchSerpApi(query) {
  try {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
      query
    )}&api_key=${SERPAPI_KEY}`;

    const r = await fetch(url);
    const json = await r.json();

    if (json.organic_results?.length > 0) return json.organic_results;

    return null;
  } catch {
    return null;
  }
}

// ---------------------------
// 3) SerpWow fallback #2
// ---------------------------
async function searchSerpWow(query) {
  try {
    const url = `https://api.serpwow.com/search?api_key=${SERPWOW_KEY}&q=${encodeURIComponent(
      query
    )}&gl=us`;

    const r = await fetch(url);
    const json = await r.json();

    if (json.organic_results?.length > 0) return json.organic_results;

    return null;
  } catch {
    return null;
  }
}

// ---------------------------
// 4) Gemini ответ
// ---------------------------
async function callGemini(facts, question) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`;

  const body = {
    systemInstruction: `Используй реальные факты из интернета: ${facts}. Дай короткий, точный, НЕВЫДУМАННЫЙ ответ.`,
    contents: [
      {
        role: "user",
        parts: [{ text: question }]
      }
    ]
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const json = await r.json();

  return (
    json.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Ответ невозможен."
  );
}

// ---------------------------
// 5) Внешний API /search
// ---------------------------
app.post("/search", async (req, res) => {
  const query = req.body.query;
  let results = null;

  // 1) пробуем ValueSerp
  results = await searchValueSerp(query);

  // 2) если пусто → SerpAPI
  if (!results) results = await searchSerpApi(query);

  // 3) если пусто → SerpWow
  if (!results) results = await searchSerpWow(query);

  // 4) если всё пусто → фейл
  if (!results) {
    return res.json({
      reply: "Интернет дал пустой ответ."
    });
  }

  // 5) Берём первые 5 результатов
  const facts = JSON.stringify(results.slice(0, 5));

  // 6) Готовим ответ через Gemini
  const reply = await callGemini(facts, query);

  res.json({ reply });
});

// ---------------------------
// PORT для Render
// ---------------------------
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
