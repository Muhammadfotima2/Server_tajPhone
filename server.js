import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Ключи
const VALUE_SERP_KEY = "6087667CEB3446B0888E718CA534A3E6";
const GEMINI_KEY     = "AIzaSyBihmxHE3_FsIVNGSi5LWi3UOyGihwCgMs";

// 1. Поиск через ValueSERP
async function realGoogleSearch(query) {
  const url =
    `https://api.valueserp.com/search?api_key=${VALUE_SERP_KEY}&q=${encodeURIComponent(query)}`;

  const r = await fetch(url);
  const json = await r.json();
  return json;
}

// 2. Генерация ответа через Gemini
async function callGemini(system, user) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`;

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

  const response = await r.json();
  return (
    response.candidates?.[0]?.content?.parts?.[0]?.text ||
    "По запросу нет точных данных."
  );
}

// 3. Основной API
app.post("/search", async (req, res) => {
  try {
    const query = req.body.query;

    // Получаем реальные данные Google
    const googleData = await realGoogleSearch(query);

    // Вытаскиваем только важные блоки (даже если пустые)
    const facts = JSON.stringify({
      top_stories: googleData.top_stories,
      answer_box: googleData.answer_box,
      knowledge_graph: googleData.knowledge_graph,
      organic_results: googleData.organic_results
    });

    // Gemini формирует ответ
    const reply = await callGemini(
      `
      Вот реальные данные из Google Search (могут быть частично пустыми):
      ${facts}

      Если данных мало — используй то, что есть.
      Если данных нет — скажи: "По запросу нет точных данных."
      Дай максимально точный и короткий ответ.
      `,
      query
    );

    res.json({ reply });

  } catch (error) {
    res.json({ reply: "Ошибка сервера. Проверь API ключи или запрос." });
  }
});

// Render порт
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
