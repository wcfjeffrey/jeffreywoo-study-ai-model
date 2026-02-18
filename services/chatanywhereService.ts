// chatanywhereService.ts

import { StudySession, StudyStyle, Flashcard, QuizQuestion, MindmapNode } from "../types";

const API_BASE_URL = 'https://api.chatanywhere.tech/v1'; // Or other URLs you use
const MODEL = 'deepseek-r1'; // Or other LLM models you use

const safeParse = (text: string, fallback: any) => {
  try {
    // Remove markdown code blocks
    const cleanText = text.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e, text);
    return fallback;
  }
};

async function callChatAnywhereAPI(messages: any[], responseFormat?: any) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error('API_KEY is not defined in environment variables');
  }

  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: 0.3,
      max_tokens: 4000,
      response_format: responseFormat ? { type: "json_object" } : undefined
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('API Response status:', response.status);
    console.error('API Error:', error);
    throw new Error(`API call failed: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function processStudyMaterial(
  content: string,
  image?: { data: string; mimeType: string },
  language: string = 'English',
  style: StudyStyle = 'Cornell',
  flashcardCount: number = 10,
  quizCount: number = 5
): Promise<Partial<StudySession>> {

  const textContext = content.substring(0, 3000);

  // STEP 1: Core Content
  const corePrompt = `You are a professional study assistant. Generate a high-quality study kit based on the provided material.

Study material: ${textContext}

Requirements:
1. Create a descriptive title.
2. Extract at least 5 key concepts with definitions and real-world examples.
3. Generate comprehensive ${style} style notes in Markdown.
Language: ${language}.

Return the response in the following JSON format:
{
  "title": "string",
  "concepts": [
    {
      "term": "string",
      "definition": "string",
      "example": "string"
    }
  ],
  "notes": "string",
  "cornell": {
    "cues": ["string"],
    "notes": ["string"],
    "summary": "string"
  }
}`;

  const coreResponse = await callChatAnywhereAPI([
    { role: "system", content: "You are a JSON-only assistant. Always respond with valid JSON." },
    { role: "user", content: corePrompt }
  ]);

  const baseData = safeParse(coreResponse, { title: "Study Session", concepts: [], notes: "" });

  // STEP 2: Structural Mindmap
  let mindmapData = { mindmap: { label: baseData.title, children: [] } };
  try {
    const mindmapPrompt = `Analyze this educational content and create a hierarchical mindmap.
Filter out document metadata, page numbers, headers, URLs, or platform text.
Focus ONLY on the actual subject matter.

Content: ${textContext.substring(0, 2000)}

Rules:
- Root: The absolute central theme
- Level 1: Major sub-topics
- Level 2: Supporting points
- Level 3: Specific details
- Labels must be 1-5 words
- No special characters

Return in this JSON format:
{
  "mindmap": {
    "label": "string",
    "children": [
      {
        "label": "string",
        "children": [
          {
            "label": "string",
            "children": [
              {
                "label": "string"
              }
            ]
          }
        ]
      }
    ]
  }
}`;

    const mindmapResponse = await callChatAnywhereAPI([
      { role: "system", content: "You are a JSON-only assistant. Create educational mindmaps." },
      { role: "user", content: mindmapPrompt }
    ]);

    mindmapData = safeParse(mindmapResponse, mindmapData);
  } catch (e) {
    console.warn("Mindmap generation failed", e);
  }

  // STEP 3: Engagement (Flashcards + Quiz)
  let engagementData = { flashcards: [], quiz: [] };
  try {
    const engagementPrompt = `You MUST generate EXACTLY ${flashcardCount} flashcards and EXACTLY ${quizCount} quiz questions from this material.
This is a strict requirement - no more, no less.

Language: ${language}.
Material: ${textContext.substring(0, 2000)}

Flashcard Types (mix them appropriately):
- 'qa': Standard Q&A format
- 'cloze': Sentence with key word in [brackets]
- 'mcq': Multiple choice question with options array

Quiz Rules:
- Each question MUST have exactly 4 distinct options
- Include helpful explanations for learning
- Make sure answers are correct based on the material

IMPORTANT: Your response MUST contain arrays with exactly ${flashcardCount} flashcards and exactly ${quizCount} quiz questions.

Return in this EXACT JSON format:
{
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "type": "qa" | "cloze" | "mcq"
    }
  ],
  "quiz": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string",
      "explanation": "string"
    }
  ]
}`;

    const engagementResponse = await callChatAnywhereAPI([
      { role: "system", content: "You are a JSON-only assistant. You must follow quantity requirements exactly." },
      { role: "user", content: engagementPrompt }
    ]);

    const parsedEngagement = safeParse(engagementResponse, { flashcards: [], quiz: [] });

    // Post-processing: Ensure correct quantity
    let flashcards = parsedEngagement.flashcards || [];
    let quiz = parsedEngagement.quiz || [];

    // Fill it with the generated content if the quantity is insufficient 
    if (flashcards.length < flashcardCount) {
      console.warn(`Flashcards count mismatch: expected ${flashcardCount}, got ${flashcards.length}. Duplicating to fill.`);
      const originalLength = flashcards.length;
      for (let i = 0; i < flashcardCount - originalLength; i++) {
        const sourceIndex = i % originalLength;
        flashcards.push({
          ...flashcards[sourceIndex],
          front: `${flashcards[sourceIndex].front} (variant ${i+1})`,
          back: flashcards[sourceIndex].back
        });
      }
    }

    // Slice if the quantity is too large
    if (flashcards.length > flashcardCount) {
      flashcards = flashcards.slice(0, flashcardCount);
    }

    if (quiz.length < quizCount) {
      console.warn(`Quiz count mismatch: expected ${quizCount}, got ${quiz.length}. Duplicating to fill.`);
      const originalLength = quiz.length;
      for (let i = 0; i < quizCount - originalLength; i++) {
        const sourceIndex = i % originalLength;
        quiz.push({
          ...quiz[sourceIndex],
          question: `${quiz[sourceIndex].question} (variant ${i+1})`,
          options: [...quiz[sourceIndex].options]
        });
      }
    }

    if (quiz.length > quizCount) {
      quiz = quiz.slice(0, quizCount);
    }

    engagementData.flashcards = flashcards;
    engagementData.quiz = quiz;

    console.log(`Final counts - Flashcards: ${engagementData.flashcards.length}/${flashcardCount}, Quiz: ${engagementData.quiz.length}/${quizCount}`);

  } catch (e) {
    console.error("Engagement content failed to generate", e);
    // Generate some basic content if it fails completely
    engagementData = generateFallbackContent(textContext, flashcardCount, quizCount);
  }

  return {
    ...baseData,
    mindmap: mindmapData.mindmap,
    flashcards: engagementData.flashcards.length > 0
      ? engagementData.flashcards.map((c: any, i: number) => ({ ...c, id: `fc-${i}` }))
      : generateFallbackFlashcards(flashcardCount).map((c, i) => ({ ...c, id: `fc-${i}` })),
    quiz: engagementData.quiz.length > 0
      ? engagementData.quiz.map((q: any, i: number) => ({ ...q, id: `q-${i}` }))
      : generateFallbackQuiz(quizCount).map((q, i) => ({ ...q, id: `q-${i}` })),
    language
  };
}

// Alternate generation function - Use when the API fails completely
function generateFallbackContent(text: string, flashcardCount: number, quizCount: number) {
  return {
    flashcards: generateFallbackFlashcards(flashcardCount),
    quiz: generateFallbackQuiz(quizCount)
  };
}

function generateFallbackFlashcards(count: number): any[] {
  const flashcards = [];
  for (let i = 0; i < count; i++) {
    const type = i % 3 === 0 ? 'qa' : i % 3 === 1 ? 'cloze' : 'mcq';
    flashcards.push({
      front: type === 'qa' ? `Sample Question ${i+1}?` :
             type === 'cloze' ? `This is a sample [cloze] deletion ${i+1}.` :
             `Sample MCQ ${i+1}?`,
      back: `Sample answer ${i+1}`,
      type: type,
      options: type === 'mcq' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined
    });
  }
  return flashcards;
}

function generateFallbackQuiz(count: number): any[] {
  const quiz = [];
  for (let i = 0; i < count; i++) {
    quiz.push({
      question: `Sample quiz question ${i+1}?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 'Option A',
      explanation: `This is a sample explanation for question ${i+1}.`
    });
  }
  return quiz;
}

export async function askTutor(
  question: string,
  context: string,
  history: { role: 'user' | 'model', text: string }[]
): Promise<string> {

  const messages = [
    { role: "system", content: "You are an expert personal tutor. Use the provided study material to answer questions accurately and clearly. Use Markdown formatting." },
    { role: "user", content: `Context material: ${context.substring(0, 3000)}\n\nStudent Question: ${question}` }
  ];

  // Add conversation history if needed
  if (history && history.length > 0) {
    const historyMessages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    messages.splice(1, 0, ...historyMessages);
  }

  const response = await callChatAnywhereAPI(messages);
  return response || "I'm sorry, I encountered an issue processing your question.";
}
