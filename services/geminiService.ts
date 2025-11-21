
import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

const API_KEY = process.env.API_KEY || '';

// Helper to convert file to base64
export const fileToGenerativePart = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // remove data:image/xxx;base64, or data:application/pdf;base64, prefix
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeInvoiceImage = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  if (!API_KEY) {
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      type: 'maintenance',
      title: "Document Analysé (Simulé)",
      date: new Date().toISOString().split('T')[0],
      km: 125000,
      price: 150.00,
      volume: 0,
      specs: { tireDimensions: "205/55 R16", oilViscosity: "5W30" } // Mock specs
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          {
            text: `Analyse ce document (Facture entretien ou Ticket carburant). 
            Extrais les informations classiques (Type, Date, Prix, Km).
            
            SURTOUT, analyse le contenu des lignes de facturation pour trouver des CARACTÉRISTIQUES TECHNIQUES du véhicule si elles apparaissent :
            - Dimensions des pneus (ex: 205/55 R16 91V) -> 'tireDimensions'
            - Viscosité huile moteur (ex: 5W30, 10W40) -> 'oilViscosity'
            - Référence Batterie -> 'batteryRef'
            - Référence Essuie-glaces -> 'wiperRef'
            
            Retourne le tout en JSON.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['maintenance', 'fuel'] },
            title: { type: Type.STRING },
            date: { type: Type.STRING },
            km: { type: Type.NUMBER },
            price: { type: Type.NUMBER },
            volume: { type: Type.NUMBER },
            specs: {
              type: Type.OBJECT,
              properties: {
                tireDimensions: { type: Type.STRING, nullable: true },
                oilViscosity: { type: Type.STRING, nullable: true },
                batteryRef: { type: Type.STRING, nullable: true },
                wiperRef: { type: Type.STRING, nullable: true },
              },
              nullable: true
            }
          }
        }
      }
    });

    if (response.text) return JSON.parse(response.text);
    throw new Error("No response");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Retour par défaut en cas d'erreur ou quota
    return { 
      type: 'maintenance',
      title: "Document non reconnu", 
      date: new Date().toISOString().split('T')[0], 
      km: 0, 
      price: 0,
      volume: 0
    };
  }
};

// Fonction pour générer les préconisations constructeurs personnalisées
export const getPersonalizedMaintenance = async (car: Car, currentKm: number): Promise<ManufacturerSpecs> => {
  if (!API_KEY) {
    return {
      tirePressure: "AV: 2.4 bar / AR: 2.4 bar",
      oilType: car.specs?.oilViscosity || "5W30 Synthétique", // Utilise la mémoire si dispo
      checkPoints: ["Vérification Niveaux", "Usure Plaquettes", "Pression Pneus"]
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    // Prompt traduit en français pour garantir une réponse en français
    const prompt = `
      Agis comme un mécanicien expert automobile disposant des données constructeurs.
      Véhicule : Immatriculation commençant par ${car.plate.substring(0,2)}, Carburant : ${car.fuelType}.
      Données connues : Huile=${car.specs?.oilViscosity || 'Inconnue'}, Pneus=${car.specs?.tireDimensions || 'Inconnus'}.
      Kilométrage actuel : ${currentKm} km.
      État signalé : Pneus=${car.initialState.tires}, Freins=${car.initialState.brakes}, Carrosserie=${car.initialState.body}.

      Fournis des recommandations de maintenance précises en FRANÇAIS basées sur les standards constructeurs pour ce type de véhicule à ce kilométrage.
      
      1. Pression des pneus recommandée (plage en bar).
      2. Type d'huile recommandé (viscosité).
      3. Liste de 3 points de vigilance (checkPoints) spécifiques à vérifier MAINTENANT vu le kilométrage et l'état déclaré.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tirePressure: { type: Type.STRING, description: "Pression recommandée ex: '2.4 bar'" },
            oilType: { type: Type.STRING, description: "Type huile ex: '5W30'" },
            checkPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste de 3 points de vigilance en Français" }
          }
        }
      }
    });

    if (response.text) return JSON.parse(response.text);
    throw new Error("No specs generated");
  } catch (e) {
    return {
      tirePressure: "2.5 bar (Standard)",
      oilType: "Voir carnet",
      checkPoints: ["Pression Pneus", "Niveau Huile", "Liquide Frein"]
    };
  }
};
