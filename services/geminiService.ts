
import { GoogleGenAI, Type } from "@google/genai";
import { StudySession, StudyStyle, Flashcard, QuizQuestion, MindmapNode } from "../types";

const safeParse = (text: string, fallback: any) => {
  try {
    const cleanText = text.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e, text);
    return fallback;
  }
};

export async function processStudyMaterial(
  content: string,
  image?: { data: string; mimeType: string },
  language: string = 'English',
  style: StudyStyle = 'Cornell'
): Promise<Partial<StudySession>> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview'; 
  
  const textContext = content.substring(0, 3000);
  const parts: any[] = [{ text: image ? `Analyze this material. Language: ${language}.` : `Study material: ${textContext}` }];
  if (image) parts.push({ inlineData: image });

  // STEP 1: Core Content (Title, Concepts, Notes)
  const coreResponse = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction: `You are a study assistant. Generate a professional title, at least 5 key concepts, and comprehensive ${style} style study notes in Markdown format. Language: ${language}. Output JSON.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          concepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING },
                example: { type: Type.STRING }
              },
              required: ['term', 'definition', 'example']
            }
          },
          notes: { type: Type.STRING },
          cornell: {
            type: Type.OBJECT,
            properties: {
              cues: { type: Type.ARRAY, items: { type: Type.STRING } },
              notes: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING }
            }
          }
        },
        required: ['title', 'concepts', 'notes']
      }
    }
  });

  const baseData = safeParse(coreResponse.text, { title: "Study Session", concepts: [], notes: "" });

  // STEP 2: Structural Mindmap (Extract Central Idea, Topics, Subtopics)
  let mindmapData = { mindmap: { label: baseData.title, children: [] } };
  try {
    const structureRes = await ai.models.generateContent({
      model,
      contents: `Extract the central idea, topics, and subtopics from the following study material for a visual tree diagram. 
      
      Instructions:
      1. Root Node: The "Central Idea" (Main Concept).
      2. Level 1: "Main Topics" branching from the central idea.
      3. Level 2: "Subtopics" branching from each main topic.
      4. Level 3: Examples or specific details.
      
      Study material: ${textContext.substring(0, 2500)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mindmap: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: "Central Idea" },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING, description: "Main Topic" },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING, description: "Subtopic" },
                            children: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  label: { type: Type.STRING, description: "Detail/Example" }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    mindmapData = safeParse(structureRes.text, mindmapData);
  } catch (e) { 
    console.warn("Mindmap generation failed", e); 
  }

  // STEP 3: Engagement (Flashcards + Quiz)
  let engagementData = { flashcards: [], quiz: [] };
  try {
    const engagementRes = await ai.models.generateContent({
      model,
      contents: `Generate a full study engagement kit based on this material: ${textContext.substring(0, 2000)}.
      Language: ${language}.
      
      Requirements for Flashcards:
      - Generate at least 8 cards.
      - For Cloze Deletion cards, put the sentence on the 'front' with the keyword enclosed in {curly brackets}, e.g., "The {capital} of France is Paris."
      - The 'back' of a cloze card should be the keyword itself.
      
      Requirements for Quiz:
      - 5-question multiple choice quiz with detailed explanations.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['qa', 'cloze', 'mcq'] },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['front', 'back', 'type']
              }
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['question', 'options', 'answer', 'explanation']
              }
            }
          }
        }
      }
    });
    const parsedEngagement = safeParse(engagementRes.text, engagementData);
    engagementData.flashcards = parsedEngagement.flashcards || [];
    engagementData.quiz = parsedEngagement.quiz || [];
  } catch (e) {
    console.warn("Engagement content failed", e);
  }

  return {
    ...baseData,
    mindmap: mindmapData.mindmap,
    flashcards: engagementData.flashcards.map((c: any, i: number) => ({ ...c, id: `fc-${i}` })),
    quiz: engagementData.quiz.map((q: any, i: number) => ({ ...q, id: `q-${i}` })),
    language
  };
}

export async function askTutor(
  question: string,
  context: string,
  history: { role: 'user' | 'model', text: string }[]
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are an expert personal tutor. Use the provided study material to answer questions accurately and clearly. If you are unsure or the information isn't in the material, say so. Use Markdown for formatting.`
    }
  });

  const prompt = `Context material: ${context.substring(0, 3000)}\n\nStudent Question: ${question}`;
  const result = await chat.sendMessage({ message: prompt });
  return result.text || "I'm sorry, I encountered an issue processing your question.";
}
