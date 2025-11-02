
import { GoogleGenAI, Type } from "@google/genai";
import { WeatherData } from '../types';

// IMPORTANT: This is a placeholder for the API key.
// In a real application, this should be handled securely and not hardcoded.
// The instructions specify to use process.env.API_KEY.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Using a mock response.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getAiResponse = async (prompt: string, language: 'en' | 'ur'): Promise<string> => {
  const systemInstruction = `You are an agriculture assistant for Pakistani farmers and buyers. Respond in ${language === 'ur' ? 'Urdu' : 'English'}. Provide simple, relevant, and accurate information. Keep your answers concise and to the point, typically 2-4 sentences, unless the user asks for more detail. Your tone should be helpful and encouraging. Use simple language.`;

  if (!ai) {
    // Mock response if API key is not available
    return new Promise(resolve => setTimeout(() => {
      if (language === 'ur') {
        resolve("معذرت، میں اس وقت دستیاب نہیں ہوں۔ براہ کرم بعد میں دوبارہ کوشش کریں۔");
      } else {
        resolve("I am currently unavailable. Please try again later.");
      }
    }, 1000));
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      // FIX: The `contents` field for a single text prompt should be a string.
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching from Gemini API:", error);
    if (language === 'ur') {
        return "ایک خرابی پیش آگئی۔ براہ کرم اپنی API کلید چیک کریں اور دوبارہ کوشش کریں۔";
    }
    return "An error occurred. Please check your API key and try again.";
  }
};

export const getWeatherTip = async (weather: WeatherData, language: 'en' | 'ur'): Promise<string> => {
  const prompt = `Based on the following weather conditions for a farmer in Pakistan (${weather.description}, temperature: ${weather.temp}°C, humidity: ${weather.humidity}%), provide a short, actionable tip (2-3 sentences) to help them save resources like water/fertilizer or protect their crops. The forecast for the next few days is: ${weather.forecast.map(f => `${f.day}: ${f.temp}°C`).join(', ')}.`;

  const systemInstruction = `You are an agriculture expert providing concise, practical advice. Respond in ${language === 'ur' ? 'Urdu' : 'English'}.`;

  if (!ai) {
    return language === 'ur' ? "موسم کی تجویز اس وقت دستیاب نہیں ہے۔" : "Weather tip is unavailable right now.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching weather tip from Gemini API:", error);
    return language === 'ur' ? "مشورہ حاصل کرنے میں ایک خرابی پیش آگئی۔" : "An error occurred while getting the tip.";
  }
};

export const getPlantDiseaseInfo = async (
  base64Image: string,
  mimeType: string,
  diseaseName: string,
  language: 'en' | 'ur'
): Promise<{ description: string; solution: string }> => {
  if (!ai) {
    return new Promise(resolve => setTimeout(() => {
      if (language === 'ur') {
        resolve({
          description: "یہ ایک فرضی تفصیل ہے۔ بیماری کے بارے میں مزید تفصیلات یہاں ظاہر ہوں گی۔",
          solution: "یہ ایک فرضی حل ہے۔ علاج اور روک تھام کے لیے تجاویز یہاں فراہم کی جائیں گی۔"
        });
      } else {
        resolve({
          description: "This is a mock description. More details about the disease would appear here.",
          solution: "This is a mock solution. Suggestions for treatment and prevention would be provided here."
        });
      }
    }, 1500));
  }
  
  let prompt = '';
  if (language === 'ur') {
    prompt = `منسلکہ تصویر اور "${diseaseName}" کی ابتدائی تشخیص کی بنیاد پر، فراہم کریں:
1. تصویر اور آپ کے ماہرانہ علم کی بنیاد پر بیماری کی تفصیلی وضاحت۔
2. حل کا ایک جامع مجموعہ (حیاتیاتی، کیمیائی، احتیاطی) جو کسان کے لیے سمجھنے میں آسان ہو۔`;
  } else {
    prompt = `Based on the attached image and the initial diagnosis of "${diseaseName}", provide:
1. A detailed description of the disease, based on the image and your expert knowledge.
2. A comprehensive set of solutions (biological, chemical, preventative) that are easy for a farmer to understand.`;
  }
  
  const systemInstruction = `You are an expert plant pathologist. Your response must be in ${language === 'ur' ? 'Urdu' : 'English'}. Provide the output in a JSON object with two keys: "description" and "solution".`;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };
  
  const textPart = { text: prompt };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: 'Detailed description of the plant disease.'
            },
            solution: {
              type: Type.STRING,
              description: 'Comprehensive solutions for treating and preventing the disease, formatted clearly for a farmer.'
            }
          },
          required: ['description', 'solution']
        }
      }
    });

    const jsonString = response.text.trim();
    const parsedResponse = JSON.parse(jsonString);
    return parsedResponse;

  } catch (error) {
    console.error("Error fetching plant disease info from Gemini API:", error);
    if (language === 'ur') {
      return {
        description: "تفصیلی معلومات حاصل کرنے میں ایک خرابی پیش آگئی۔",
        solution: "براہ کرم بعد میں دوبارہ کوشش کریں۔"
      };
    }
    return {
      description: "An error occurred while fetching detailed information.",
      solution: "Please try again later."
    };
  }
};
