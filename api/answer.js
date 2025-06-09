export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Pertanyaan tidak boleh kosong' });
    }

    // Ganti dengan API key milikmu (gunakan variabel lingkungan jika bisa)
    const apiKey = process.env.OPENAI_API_KEY || 'proj_qvqUCLgLef4gQQcNpZFT8nW7';

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah asisten AI yang membantu menjawab soal pelajaran tingkat SD hingga SMA dengan akurat.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    const result = await openaiRes.json();

    if (result.error) {
      console.error('OpenAI Error:', result.error);
      return res.status(500).json({ error: 'Gagal dari API OpenAI' });
    }

    const answer = result.choices?.[0]?.message?.content?.trim() || 'Tidak ada jawaban yang ditemukan.';

    res.status(200).json({ answer });

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server internal' });
  }
}
