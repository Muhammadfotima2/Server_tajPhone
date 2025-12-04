import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ТВОЙ КЛЮЧ ОТ VALUE SERP
const VALUE_SERP_KEY = "6087667CEB3446B0888E718CA534A3E6";

// ТВОЙ КЛЮЧ ОТ GEMINI
const GEMINI_KEY = "AIzaSyBihmxHE3_FsIVNGSi5LWi3UOyGihwCgMs";

// 1. Реальный Google Search (ValueSERP)
async function realGoogleSearch(query) {
  const url =
    `https://api.valueserp.com/search?api_key=${VALUE_SERP_KEY}&q=${encodeURIComponent(query)}`;

  const r = await fetch(url);
  const json = await r.json();
  return json;
}

// 2. Вызов Gemini, который всегда формирует ответ
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
    "Google дал пустой ответ, но Gemini не сгенерировал текст."
  );
}

// 3. Основной API, который ВСЕГДА отдаёт данные
app.post("/search", async (req, res) => {
  try {
    const query = req.body.query;

    // Получаем реальные данные
    const googleData = await realGoogleSearch(query);

    // Передаём ВЕСЬ JSON в Gemini чтобы он точно смог ответить
    const facts = JSON.stringify(googleData);

    const reply = await callGemini(
      `Вот реальные данные из Google в JSON формате: ${facts}. 
       На основе этих данных дай максимально точный, краткий, современный и реальный ответ без фантазий.`,
      query
    );

    res.json({ reply });
  } catch (error) {
    res.json({ reply: "Ошибка сервера. Проверь запрос или API ключи." });
  }
});

// 4. Render запуск
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
