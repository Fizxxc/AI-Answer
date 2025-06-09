import { db, ref, push } from '../../firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Soal tidak boleh kosong' });

  try {
    // Jawaban dari GPT
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Kamu adalah AI ahli pelajaran sekolah. Jawab soal ini seakurat mungkin dengan tingkat benar 90%.' },
          { role: 'user', content: question }
        ],
        temperature: 0.2
      })
    });
    const completionData = await completion.json();
    const answer = completionData.choices?.[0]?.message?.content || 'Jawaban tidak tersedia';

    // Penilaian jawaban oleh AI
    const evaluation = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Kamu adalah guru. Nilai jawaban siswa berdasarkan soal dan jawaban yang diberikan AI. Berikan nilai dari 0 sampai 100 dan beri komentar singkat.' },
          { role: 'user', content: `Soal: ${question}\nJawaban: ${answer}` }
        ],
        temperature: 0.4
      })
    });
    const evalData = await evaluation.json();
    const evaluationText = evalData.choices?.[0]?.message?.content || 'Tidak dapat menilai';

    // Simpan log ke Firebase
    await push(ref(db, 'logs'), {
      question,
      answer,
      evaluation: evaluationText,
      timestamp: Date.now()
    });

    res.status(200).json({ answer, evaluation: evaluationText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan.' });
  }
}
