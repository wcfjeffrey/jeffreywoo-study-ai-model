
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
  style: StudyStyle = 'Cornell',
  flashcardCount: number = 10,
  quizCount: number = 5
): Promise<Partial<StudySession>> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview'; 
  
  const textContext = content.substring(0, 3000);
  const parts: any[] = [{ text: image ? `Analyze this material. Language: ${language}.` : `Study material: ${textContext}` }];
  if (image) parts.push({ inlineData: image });

  // STEP 1: Core Content
  const coreResponse = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction: `You are a professional study assistant. Generate a high-quality study kit based on the provided material.
      1. Create a descriptive title.
      2. Extract at least 5 key concepts with definitions and real-world examples.
      3. Generate comprehensive ${style} style notes in Markdown.
      Language: ${language}.
      Output strictly in JSON format.`,
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

  // STEP 2: Structural Mindmap - REFINED PROMPT TO PREVENT UNRELATED DATA
  let mindmapData = { mindmap: { label: baseData.title, children: [] } };
  try {
    const structureRes = await ai.models.generateContent({
      model,
      contents: `Create a logical mindmap for: ${textContext.substring(0, 2000)}`,
      config: {
        systemInstruction: `Analyze the core educational content and create a hierarchical mindmap. 
        CRITICAL: Filter out and ignore any document metadata, page numbers, author headers, website URLs, or generic platform text.
        Focus ONLY on the actual subject matter being taught.
        
        Hierarchy:
        - Root: The absolute central theme.
        - Level 1: Major sub-topics.
        - Level 2: Supporting points.
        - Level 3: Specific details.
        
        Rules:
        - Labels must be 1-5 words.
        - No special characters (brackets, parentheses).
        - Ensure every branch is directly relevant to the main educational topic.
        Output strictly as JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mindmap: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING },
                            children: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  label: { type: Type.STRING }
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

  // STEP 3: Engagement (Flashcards + Quiz) - UPDATED FOR DYNAMIC QUIZ COUNT
  let engagementData = { flashcards: [], quiz: [] };
  try {
    const engagementRes = await ai.models.generateContent({
      model,
      contents: `Process this material and generate study tools: ${textContext.substring(0, 2000)}`,
      config: {
        systemInstruction: `You MUST generate EXACTLY ${flashcardCount} flashcards and EXACTLY ${quizCount} quiz questions. 
        Language: ${language}.
        
        Flashcard Rules:
        - 'qa': Standard Q&A.
        - 'cloze': Sentence with a key word in [brackets] on the front.
        - 'mcq': Multiple choice question.
        
        Quiz Rules:
        - 4 distinct options per question.
        - High-quality explanations that help learning.
        
        You must return the requested counts (${flashcardCount} cards, ${quizCount} questions) regardless of the brevity of the source text. Break down complex sentences into multiple items if necessary.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: "Question or cloze (e.g. 'The capital of France is [Paris]')" },
                  back: { type: Type.STRING, description: "Answer" },
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
          },
          required: ['flashcards', 'quiz']
        }
      }
    });
    const parsedEngagement = safeParse(engagementRes.text, engagementData);
    engagementData.flashcards = parsedEngagement.flashcards || [];
    engagementData.quiz = parsedEngagement.quiz || [];
  } catch (e) {
    console.error("Engagement content failed to generate", e);
  }

  return {
    ...baseData,
    mindmap: mindmapData.mindmap,
    flashcards: engagementData.flashcards.length > 0 
      ? engagementData.flashcards.map((c: any, i: number) => ({ ...c, id: `fc-${i}` }))
      : [],
    quiz: engagementData.quiz.length > 0
      ? engagementData.quiz.map((q: any, i: number) => ({ ...q, id: `q-${i}` }))
      : [],
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
      systemInstruction: `You are an expert personal tutor. Use the provided study material to answer questions accurately and clearly. Use Markdown.`
    }
  });

  const prompt = `Context material: ${context.substring(0, 3000)}\n\nStudent Question: ${question}`;
  const result = await chat.sendMessage({ message: prompt });
  return result.text || "I'm sorry, I encountered an issue processing your question.";
}
