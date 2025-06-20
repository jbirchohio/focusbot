export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const { prompt } = await req.json();

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are FocusBot, a quiet, executive-dysfunction-aware assistant. Keep it gentle. Never overwhelm. Offer one calm next step or simple encouragement."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  const json = await completion.json();

  return new Response(JSON.stringify({
    reply: json.choices?.[0]?.message?.content || "Hmm, something went wrong."
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
