import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ВСТАВЬ СВОИ КЛЮЧИ
const SERP_API_KEY = "6087667CEB3446B0888E718CA534A3E6";
const GEMINI_KEY   = "AIzaSyBihmxHE3_FsIVNGSi5LWi3UOyGihwCgMs";

// 1. Реальный Google Search через SerpAPI
async function realGoogleSearch(query) {
  const url =
    `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}`;

  const r = await fetch(url);
  const json = await r.json();
  return json;
}

// 2. Вызов Gemini
async function callGemini(system, user) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`;

  const body = {
    systemInstruction: system,
    contents: [
      {
        role: "user",
        parts: [{ text: user }]
      }
    ]
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const json = await r.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || "Нет ответа";
}

// 3. Основной API
app.post("/search", async (req, res) => {
  try {
    const query = req.body.query;

    // 1. Получаем реальные данные из Google
    const googleData = await realGoogleSearch(query);

    // 2. Берём первые результаты
    const facts = JSON.stringify(googleData.organic_results?.slice(0, 5) || []);

    // 3. Формируем ответ через Gemini
    const reply = await callGemini(
      `Вот реальные данные из Google: ${facts}. Дай краткий и точный ответ.`,
      query
    );

    res.json({ reply });
  } catch (error) {
    res.json({ reply: "Ошибка сервера." });
  }
});

// 4. Render требует указать порт
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
