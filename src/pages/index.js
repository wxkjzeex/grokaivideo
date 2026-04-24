import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [videoUrl, setVideoUrl] = useState('');
  const [progressMessage, setProgressMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setProgressMessage('Отправка запроса нейросети...');
    setVideoUrl('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Ошибка генерации');

      const data = await response.json();
      setVideoUrl(data.url);
      setStatus('done');
    } catch (error) {
      setStatus('error');
      setProgressMessage(error.message);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'Arial' }}>
      <h1>Генератор видео с Grok</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Опишите желаемое видео, например: Закат на марсианских дюнах..."
          rows={4}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
          required
        />
        <button type="submit" disabled={status === 'loading'}
          style={{ padding: '10px 20px', fontSize: 16 }}>
          {status === 'loading' ? 'Генерируем...' : 'Создать видео'}
        </button>
      </form>

      {status === 'loading' && <p>⏳ {progressMessage}</p>}
      {status === 'error' && <p style={{ color: 'red' }}>❌ {progressMessage}</p>}
      
      {status === 'done' && videoUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>Результат:</h3>
          <video controls width="100%" src={videoUrl} />
          <p><a href={videoUrl} target="_blank" rel="noopener noreferrer">Скачать видео</a> (ссылка действительна 1 час)</p>
        </div>
      )}
    </div>
  );
}
