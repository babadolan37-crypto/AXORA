import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Configure OpenAI provider to use Vercel AI Gateway
const openai = createOpenAI({
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
  });

  return result.toTextStreamResponse();
}
