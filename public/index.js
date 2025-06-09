import { db, ref, push } from '/firebase.js';

const questionInput = document.getElementById('question');
const submitBtn = document.getElementById('submit');
const chatArea = document.getElementById('chatArea');

// Fungsi untuk menambahkan bubble chat
function addChat(role, text) {
  const bubble = document.createElement('div');
  bubble.className =
    role === 'user'
      ? 'bg-gptGreen text-white p-3 rounded-lg self-end max-w-[80%] ml-auto'
      : 'bg-gray-700 text-white p-3 rounded-lg self-start max-w-[80%] mr-auto';
  bubble.innerText = text;
  chatArea.appendChild(bubble);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Fungsi hitung skor dummy (penilaian sederhana)
function evaluateAnswer(question, answer) {
  if (!question || !answer) return 0;
  const score = Math.min(100, Math.floor((answer.length / question.length) * 20 + 70)); // simulasi 70-100
  return score;
}

submitBtn.addEventListener('click', async () => {
  const question = questionInput.value.trim();
  if (!question) return;

  // Tampilkan pertanyaan user
  addChat('user', question);
  questionInput.value = '';
  submitBtn.disabled = true;
  submitBtn.innerText = 'Memproses...';

  try {
    // Panggil API ke OpenAI
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    const answer = data.answer || '[Jawaban tidak tersedia]';

    // Tampilkan jawaban AI
    addChat('assistant', answer);

    // Penilaian otomatis
    const score = evaluateAnswer(question, answer);

    // Simpan ke Firebase
    const logRef = ref(db, 'log_jawaban');
    await push(logRef, {
      question,
      answer,
      timestamp: Date.now(),
      score
    });

  } catch (err) {
    console.error('Gagal:', err);
    addChat('assistant', '[Terjadi kesalahan saat memproses pertanyaan]');
  }

  submitBtn.disabled = false;
  submitBtn.innerText = 'Kirim';
});
