import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ТВОЙ КЛЮЧ ГЕМИНИ
const GEMINI_KEY = "AIzaSyBihmxHE3_FsIVNGSi5LWi3UOyGihwCgMs";

// 1. Gemini с включённым Google Search
async function callGeminiWithSearch(question) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`;

  const body = {
    systemInstruction: `
      Ты — эксперт по смартфонам.
      Используй интернет-поиск GoogleSearch для получения реальных данных.
      Дай краткий и точный ответ.
    `,
    contents: [
      {
        role: "user",
        parts: [{ text: question }]
      }
    ],
    tools: [
      { googleSearch: {} }   // ВОТ ЭТО ВАЖНО — интернет ВКЛЮЧЁН
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
    "Google дал пустой ответ."
  );
}

// API
app.post("/search", async (req, res) => {
  const query = req.body.query;

  const reply = await callGeminiWithSearch(query);

  res.json({ reply });
});

// Render
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
