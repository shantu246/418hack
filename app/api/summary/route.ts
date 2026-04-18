import { NextRequest } from 'next/server';
import { readUserSession } from '@/lib/user-session';
import { createServerSupabase } from '@/lib/supabase-server';
import OpenAI from 'openai';

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
});

export async function GET(req: NextRequest) {
  const session = readUserSession(req);
  if (!session) {
    return new Response(JSON.stringify({ error: '请先登录' }), { status: 401 });
  }

  const supabase = createServerSupabase();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: pings, error } = await supabase
    .from('messages')
    .select('content, ping_type, lat, lng, created_at')
    .eq('nickname', session.username)
    .gte('created_at', weekAgo)
    .order('created_at', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!pings || pings.length === 0) {
    return new Response(JSON.stringify({ empty: true }), { status: 200 });
  }

  const pingList = pings.map((p, i) => {
    const time = new Date(p.created_at).toLocaleString('zh-CN', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    return `${i + 1}. [${time}] 类型:${p.ping_type} 位置:(${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}) 内容:「${p.content}」`;
  }).join('\n');

  const prompt = `你是一个温暖有趣的AI助手，正在帮用户回顾他们在过去一周的足迹和心情。

以下是用户 ${session.username} 在过去一周内留下的所有 Ping（地理位置留言）：

${pingList}

请根据这些 Ping 的时间、地点和内容，生成一份温暖有趣的一周总结报告。要求：
- 总结用户这一周去了哪些地方、做了什么
- 分析他/她这一周的情绪状态和心情轨迹
- 找出最有意思或最有意义的时刻，加以点评
- 用轻松、温暖、略带文艺的语气
- 结尾给出一句有意义的话作为本周寄语
- 报告长度适中，分段清晰，可以用 emoji 点缀
- 用中文回复`;

  const stream = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
    max_tokens: 1000,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
