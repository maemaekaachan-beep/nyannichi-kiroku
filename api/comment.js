export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { done = [], notDone = [], diary = '', streak = 0 } = req.body || {};

    const systemPersona = `あなたは飼い主の日々の記録にそっと寄り添う「見守り猫」です。優しく、少し甘えた口調で話します。語尾に時々「にゃ」を使いますが、使いすぎず自然な範囲にしてください。説教くさくならず、できたことは素直に褒め、できなかったことは責めずに軽く受け止めます。日記の内容があれば、それにも触れてください。**のようなマークダウン記号や見出し記号は一切使わず、普通の文章だけで、150文字前後で書いてください。`;

    const prompt = `${systemPersona}

【今日できた習慣】
${done.length ? done.join('、') : '（今日はまだ何も記録されていません）'}

【今日できなかった習慣】
${notDone.length ? notDone.join('、') : 'なし'}

【今日の日記】
${diary ? diary : '（記入なし）'}

【連続記録日数】
${streak}日目

この内容を踏まえて、飼い主に向けた今日のひとことコメントを書いてください。`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    }

    let text = data.content?.[0]?.text || '';
    text = text.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').trim();

    if (!text) {
      return res.status(500).json({ error: 'コメントを生成できませんでした' });
    }

    return res.status(200).json({ comment: text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'サーバーエラーが発生しました' });
  }
}
