import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Ключи из переменных окружения (правильно!)
const GEMINI_KEY = process.env.GEMINI_KEY;
const VALUE_SERP_KEY = process.env.VALUE_SERP_KEY;

// 1. Реальный Google Search — ValueSERP
async function realGoogleSearch(query) {
  const url = `https://api.valueserp.com/search?api_key=${VALUE_SERP_KEY}&q=${encodeURIComponent(query)}`;

  const r = await fetch(url);
  const data = await r.json();
  return data;
}

// 2. Gemini
async function callGemini(facts, question) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`;

  const body = {
    systemInstruction: `Используй фактические данные: ${facts}. Дай краткий и точный ответ.`,
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

  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text || "Нет ответа.";
}

// Основной API
app.post("/search", async (req, res) => {
  try {
    const query = req.body.query;

    const googleData = await realGoogleSearch(query);
    const facts = JSON.stringify(googleData.organic_results?.slice(0, 5) || []);

    const reply = await callGemini(facts, query);

    res.json({ reply });
  } catch (e) {
    res.json({ reply: "Ошибка сервера." });
  }
});

// Render порт
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

