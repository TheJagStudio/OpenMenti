import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: "A list of quiz questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: {
                        type: Type.STRING,
                        description: "The question text.",
                    },
                    options: {
                        type: Type.ARRAY,
                        description: "An array of 4 possible answers.",
                        items: { type: Type.STRING },
                    },
                    correctAnswer: {
                        type: Type.STRING,
                        description: "The correct answer, which must be one of the provided options.",
                    },
                },
                required: ["question", "options", "correctAnswer"],
            },
        },
    },
    required: ["questions"],
};

export const generateQuizQuestions = async ({ topic, numQuestions, context }: { topic: string; numQuestions: number; context?: string }): Promise<QuizQuestion[]> => {
    try {
        const prompt = context
            ? `Based on the following context, generate ${numQuestions} challenging multiple-choice questions for a quiz game. The quiz title is "${topic}". The difficulty should gradually increase. Ensure each question has 4 options and one correct answer. The correct answer must exactly match one of the options.\n\nContext:\n${context}`
            : `Generate ${numQuestions} challenging multiple-choice questions for a quiz game based on the topic: "${topic}". The difficulty should gradually increase. Ensure each question has 4 options and one correct answer. The correct answer must exactly match one of the options.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
            }
        });

        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);

        if (parsedResponse && parsedResponse.questions) {
            return parsedResponse.questions;
        } else {
            console.error("Invalid JSON structure from Gemini API:", parsedResponse);
            throw new Error("Failed to parse quiz questions from the API response.");
        }
    } catch (error) {
        console.error("Error generating quiz questions:", error);
        throw new Error("Could not generate quiz questions. Please try again.");
    }
};