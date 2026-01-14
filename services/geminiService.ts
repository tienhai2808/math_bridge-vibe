import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateMathFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helper for a Math-to-LaTeX converter tool.
      
      TASK: Convert the user's input into clean, standard Markdown with LaTeX math.

      SCENARIO 1: The user describes a formula (e.g., "Integra of x squared").
      -> Output the corresponding LaTeX equation.

      SCENARIO 2 (IMPORTANT): The user pastes "messy" text copied from other websites or AI chats. This text might contain:
      - Unicode math symbols (e.g., 𝛽, 𝛼, 𝜃, ∑, ∫) instead of LaTeX commands.
      - Mathematical bold/italic unicode characters (e.g., 𝑃, 𝑥, 𝑦) instead of normal text.
      - Poorly formatted fractions or spacing.
      -> YOU MUST detect this and convert it to proper LaTeX syntax (e.g., change '𝛽' to '\\beta', '𝑃' to 'P').

      RULES:
      1. Use single dollar signs $...$ for inline math.
      2. Use double dollar signs $$...$$ for block math.
      3. Do NOT use \\( or \\[ syntax.
      4. Provide ONLY the final markdown code. Do not include explanations like "Here is the code".
      5. Preserve the mathematical meaning exactly.

      USER INPUT: ${prompt}`,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate math from AI.");
  }
};