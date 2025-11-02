import { PlantIdHealthAssessment } from '../types';

const API_KEY = '5PYmozrN4SBtNv5pIZvedl2En1nP5lZrJZ5m8AlW9abtI3B9FD';
const API_URL = 'https://plant.id/api/v3/health_assessment';

const toBase64 = (file: File): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]); // remove data:image/... part
      } else {
        reject('Failed to convert file to base64');
      }
    };
    reader.onerror = error => reject(error);
});

export const checkCropHealth = async (imageFile: File): Promise<PlantIdHealthAssessment> => {
    const base64Image = await toBase64(imageFile);

    const requestBody = {
        images: [base64Image],
        // The health_assessment endpoint is simple and doesn't need extra modifiers.
        // Details are returned by default.
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': API_KEY,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorText;
        } catch (e) {
            // It's not JSON, so we use the text directly.
        }
        console.error("Plant.id API Error:", errorMessage);
        throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // The health assessment is nested inside the 'result' object
    const result = data.result;

    if (!result || !result.is_plant?.binary) {
        throw new Error("The uploaded image could not be identified as a plant.");
    }
    
    if (!result.is_healthy || !result.disease) {
        console.error("API response missing required health objects:", data);
        throw new Error("The API did not return a valid health assessment. The image might be unclear.");
    }
    
    const isHealthy = result.is_healthy.binary;
    const suggestions = result.disease.suggestions || [];

    const formattedResult: PlantIdHealthAssessment = {
        is_healthy: isHealthy,
        disease_suggestions: suggestions.map((suggestion: any) => ({
            id: suggestion.id,
            name: suggestion.name,
            probability: suggestion.probability,
            // FIX: Access description and treatment from the nested `details` object.
            details: suggestion.details ? {
                description: suggestion.details.description || 'No description available.',
                treatment: suggestion.details.treatment || undefined,
            } : {
                description: 'No details available.'
            }
        })),
    };
    
    return formattedResult;
};