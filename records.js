import { Redis } from '@upstash/redis';

// Vercel Marketplace経由のUpstash連携は KV_REST_API_URL / KV_REST_API_TOKEN、
// 直接Upstashで作成した場合は UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN になることがあるため両対応
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

function keyFor(code) {
  return `nyannichi:${code}`;
}

export default async function handler(req, res) {
  if (!redis) {
    return res.status(500).json({
      error: 'データベースが接続されていません。VercelでUpstash連携の設定が必要です。',
    });
  }

  if (req.method === 'GET') {
    const code = (req.query.code || '').trim();
    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }
    try {
      const data = await redis.get(keyFor(code));
      if (!data) {
        return res.status(200).json({ exists: false });
      }
      return res.status(200).json({ exists: true, data });
    } catch (err) {
      return res.status(500).json({ error: err.message || '取得に失敗しました' });
    }
  }

  if (req.method === 'POST') {
    const { code, data } = req.body || {};
    if (!code || !data) {
      return res.status(400).json({ error: 'code and data are required' });
    }
    try {
      await redis.set(keyFor(code), data);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message || '保存に失敗しました' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
