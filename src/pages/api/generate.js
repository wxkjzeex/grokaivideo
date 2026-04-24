// Только серверная часть, ключ не утечет
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API ключ не настроен на сервере' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  try {
    // 1. Запускаем генерацию
    const initResponse = await fetch('https://api.x.ai/v1/videos/generations', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'grok-imagine-video',
        prompt: prompt,
        duration: 10,
        aspect_ratio: '16:9',
        resolution: '720p',
      }),
    });

    if (!initResponse.ok) {
      const errorData = await initResponse.json();
      throw new Error(errorData.message || 'Ошибка создания запроса');
    }

    const { request_id } = await initResponse.json();
    console.log('Request ID:', request_id);

    // 2. Цикл ожидания результата
    let videoUrl = null;
    const maxAttempts = 60; // До 5 минут ожидания
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000)); // Пауза 5 сек

      const checkResponse = await fetch(`https://api.x.ai/v1/videos/${request_id}`, { headers });
      const checkData = await checkResponse.json();

      console.log(`Попытка ${i + 1}: ${checkData.status}`);

      if (checkData.status === 'done') {
        videoUrl = checkData.video.url;
        break;
      } else if (checkData.status === 'failed' || checkData.status === 'expired') {
        throw new Error(`Генерация не удалась: ${checkData.status}`);
      }
    }

    if (!videoUrl) {
      throw new Error('Тайм-аут ожидания видео');
    }

    // Возвращаем готовый URL на фронтенд
    return res.status(200).json({ url: videoUrl });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
