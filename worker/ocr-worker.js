// Cloudflare Worker: 영수증 이미지를 받아 Google Cloud Vision으로 텍스트 인식
// 비밀 API 키(GOOGLE_VISION_API_KEY)는 절대 프론트엔드에 노출되지 않고 이 서버에만 존재함
export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST만 허용됩니다" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      const { imageBase64 } = await request.json();
      if (!imageBase64) {
        return new Response(JSON.stringify({ error: "imageBase64 필드가 필요합니다" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const visionRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${env.GOOGLE_VISION_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: imageBase64 },
                features: [{ type: "TEXT_DETECTION" }],
                imageContext: { languageHints: ["ko"] }
              }
            ]
          })
        }
      );

      if (!visionRes.ok) {
        const errText = await visionRes.text();
        return new Response(JSON.stringify({ error: "Vision API 오류", detail: errText }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const data = await visionRes.json();
      const text = data?.responses?.[0]?.fullTextAnnotation?.text || "";

      return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
