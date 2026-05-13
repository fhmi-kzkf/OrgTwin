import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({});
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "hello"
    });
    console.log("SUCCESS");
  } catch (err: any) {
    console.error("ERROR", err.message);
  }
}
test();
