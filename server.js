import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ТВОЙ КЛЮЧ ОТ VALUE SERP
const VALUE_SERP_KEY = "6087667CEB3446B0888E718CA534A3E6";

// ТВОЙ КЛЮЧ ГЕМИНИ
const GEMINI_KEY = "AIzaSyBihmxHE3_FsIVNGSi5LWi3UOyGihwCgMs";

// 1. Реальный Google Search (Value SERP)
async function realGoogleSearch(query) {
  const url =
    `https://api.valueserp.com/search?api_key=${VALUE_SERP_KEY}&q=${encodeURIComponent(query)}`;

  const r = await fetch(url);
  const json = await r.json();
  return json;
}

// 2. Gemini ответ
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

  const json = await r.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || "Нет ответа";
}

// 3. Основной API
app.post("/search", async (req, res) => {
  try {
    const query = req.body.query;

    const googleData = await realGoogleSearch(query);
    const facts = JSON.stringify(googleData.organic_results || []);

    const reply = await callGemini(
      `Вот реальные данные из Google: ${facts}. Дай точный и короткий ответ.`,
      query
    );

    res.json({ reply });
  } catch {
    res.json({ reply: "Ошибка сервера." });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
