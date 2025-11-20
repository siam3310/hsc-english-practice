import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PracticeQuestion, EvaluationResult, TopicId, PracticeModeType, DifficultyLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

// Optimized Schema: Includes 'answers' with 'rule' for local validation
const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questionText: {
      type: Type.STRING,
      description: "The content. For gap-fills like Right Form of Verbs, the format is '...(verb)...'. Do not include numbers in the question text's gaps. For Transformation/Voice, provide ONLY the sentence to change.",
    },
    instruction: {
      type: Type.STRING,
      description: "Short instruction (e.g. 'Change to Passive', 'Make it Compound').",
    },
    gaps: {
      type: Type.ARRAY,
      items: { type: Type.INTEGER },
      description: "List of gap numbers e.g. [1, 2, 3].",
    },
    answers: {
        type: Type.ARRAY,
        description: "List of correct answers and rules.",
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: "The gap number (e.g. '1') or 'main'." },
                value: { type: Type.STRING, description: "The correct answer string." },
                rule: { type: Type.STRING, description: "Grammar rule in mixed Bangla and English." }
            },
            required: ["id", "value", "rule"]
        }
    }
  },
  required: ["questionText", "instruction", "answers"],
};

export const generateQuestion = async (topicId: TopicId, mode: PracticeModeType, difficulty: DifficultyLevel): Promise<PracticeQuestion> => {
  const promptContext = getPromptForTopicAndMode(topicId, mode);
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a ${difficulty} level ${mode} practice question.
      
      CONTEXT: You are an expert database of **Bangladesh HSC Board Exams** and **University Admission Tests**.
      
      CRITICAL INSTRUCTION:
      1. Do NOT just generate generic sentences about Bangladesh.
      2. You MUST retrieve or simulate **ACTUAL QUESTIONS** that appeared in past HSC Board Exams (e.g., Dhaka Board, Rajshahi Board, Comilla Board, etc.) or University Admission Tests (Dhaka University, Chittagong University, etc.).
      3. The language, structure, and complexity must match these exams exactly.
      4. If exact questions are not available, create high-quality simulations that look exactly like Board Questions.
      
      Topic: ${topicId}.
      
      ${promptContext}
      
      IMPORTANT: 
      1. You MUST provide the 'answers' array.
      2. For EACH answer, the 'rule' property MUST be written in **mixed Bangla and English** (e.g., "Sentence টি Past tense এ থাকায় verb এর Past form হবে"). Explain clearly WHY the answer is correct according to grammar rules.
      3. For Verbs/Articles/Prepositions, the answer must be the exact word(s).
      Return JSON matching the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 25500, 
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      
      // Transform array of answers to Record lookup
      const answerKey: Record<string, string> = {};
      
      data.answers.forEach((a: any) => {
          answerKey[a.id] = a.value;
          answerKey[`${a.id}_rule`] = a.rule; // Storing rule with a suffix key
      });

      return { 
          ...data, 
          topicId, 
          mode, 
          difficulty,
          answerKey 
      };
    }
    throw new Error("No data");
  } catch (error) {
    console.error("Gen Error", error);
    return {
      topicId,
      mode,
      difficulty,
      questionText: "Error, Refresh!",
      instruction: "Error",
      gaps: [],
      answerKey: {}
    };
  }
};

export const checkAnswer = async (
  question: PracticeQuestion,
  userAnswers: Record<string, string>
): Promise<EvaluationResult> => {
  
  const isDeterministic = [TopicId.VERBS, TopicId.ARTICLES, TopicId.PREPOSITION].includes(question.topicId);
  
  if (isDeterministic && question.answerKey && Object.keys(question.answerKey).length > 0) {
    return evaluateLocally(question, userAnswers);
  }

  return evaluateWithAI(question, userAnswers);
};

const evaluateLocally = (question: PracticeQuestion, userAnswers: Record<string, string>): EvaluationResult => {
    const details: Record<string, any> = {};
    let correctCount = 0;
    const total = question.gaps ? question.gaphs.length : 1;
    const key = question.answerKey || {};

    const keysToCheck = question.gaps ? question.gaps.map(String) : ['main'];

    keysToCheck.forEach(id => {
        const userVal = (userAnswers[id] || "").trim().toLowerCase();
        const correctVal = (key[id] || "").trim().toLowerCase();
        const rule = key[`${id}_rule`] || "Follow the grammar rules.";

        // Simple normalization for common variations (e.g. x vs none)
        const normalize = (s: string) => s.replace(/[^\w]/g, '');
        const isCorrect = userVal === correctVal || normalize(userVal) === normalize(correctVal);

        if (isCorrect) correctCount++;

        details[id] = {
            isCorrect,
            correctAnswer: key[id] || "N/A",
            explanation: `Rule: ${rule}`
        };
    });

    const score = Math.round((correctCount / total) * 100);

    let feedback = "Keep practicing!";
    if (score === 100) feedback = "Excellent! You mastered this rule.";
    else if (score >= 80) feedback = "Very good! Just a few mistakes.";
    else if (score >= 50) feedback = "Good attempt. Review the rules below.";
    else feedback = "Study the rules and try again.";

    return {
        overallScore: score,
        overallFeedback: feedback,
        details
    };
};

const evaluateWithAI = async (question: PracticeQuestion, userAnswers: Record<string, string>): Promise<EvaluationResult> => {
    try {
        const prompt = `
          Act as a strict HSC English Teacher (Bangladeshi).
          Question: "${question.questionText}"
          Instruction: "${question.instruction}"
          Topic: ${question.topicId}
          Student Input: ${JSON.stringify(userAnswers)}
          Correct Answer Key: ${JSON.stringify(question.answerKey)}
    
          Evaluate the student input.
          IMPORTANT: For EVERY answer (correct or wrong), you MUST provide the Specific Grammar Rule in the explanation.
          LANGUAGE: The explanation MUST be in **mixed Bangla and English** (e.g. "Sentence টি Past tense এ থাকায় verb এর Past form হবে").
          
          Return JSON:
          {
            "overallScore": number,
            "overallFeedback": "Short encouraging feedback",
            "details": {
               "key_id": { "isCorrect": boolean, "correctAnswer": "Correct Answer", "explanation": "Rule: ..." }
            }
          }
        `;
    
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
            maxOutputTokens: 1500,
          },
        });
    
        if (response.text) {
          return JSON.parse(response.text) as EvaluationResult;
        }
        throw new Error("No evaluation");
      } catch (e) {
        console.error(e);
        return {
            overallScore: 0,
            overallFeedback: "Error checking answer.",
            details: {}
        };
      }
}

export const askGrammarQuestion = async (query: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        Act as a friendly and expert English Teacher for HSC students in Bangladesh.
        The student asks: "${query}"

        Explain the answer clearly in **Mixed Bangla and English**.
        - Use simple language.
        - Provide clear examples (Sentences).
        - Explain the grammar rule behind it.
        - Break down complex concepts into bullet points.
        - If the student asks about "Right form of verbs", "Modifiers", or any HSC topic, give specific rules relevant to the syllabus.

        Make it engaging and easy to understand.
      `,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 2000,
      },
    });

    return response.text || "Sorry, I could not generate an explanation.";
  } catch (error) {
    console.error("Learn Error", error);
    return "Something went wrong. Please try asking again.";
  }
};

function getPromptForTopicAndMode(topicId: TopicId, mode: PracticeModeType): string {
  const isPassage = mode === PracticeModeType.PASSAGE;

  switch (topicId) {
    case TopicId.VERBS:
      return isPassage
        ? "Provide a complete 'Right Form of Verbs' passage from a past **HSC Board Exam** (e.g., Dhaka Board 2019, Rajshahi Board 2022) or other from internet. Format: '...word (verb)...'. It must be a narrative text or factual report."
        : "Provide a single challenging sentence question from a **University Admission Test** (Unit B/C) regarding Right Form of Verbs. Format: '...(base-verb)...'.";
    
    case TopicId.ARTICLES:
      return isPassage
        ? "Provide a standard **HSC Board Question** passage with 6-10 article gaps. Format: '...__...'. Answer 'x' if none."
        : "Provide a tricky sentence from an **Admission Test** with one article gap '...__...'.";
    
    case TopicId.PREPOSITION:
      return isPassage
        ? "Provide a passage on Appropriate Prepositions from a past **HSC Board Exam**. Format: '...word __...'. This is Question No. 2 in HSC exams."
        : "Provide a single sentence with a challenging Appropriate Preposition gap '__...' typical of **University Admission Tests**.";

    case TopicId.COMPLETING:
      return "Provide a standard **HSC Completing Sentence** question (Question No. 4 style). Start with a clause, leave the rest blank marked as '[1]'. Example: 'Had I been a king, [1].' The completion must follow strict grammar rules.";

    case TopicId.TRANSFORMATION:
       return "Provide a **Transformation of Sentence** question from a past **HSC Board Exam** (Question No. 6). 'questionText' MUST be the sentence ONLY. 'instruction' MUST be the target type (e.g. 'Make it Compound', 'Make it Positive').";
    
    case TopicId.NARRATION:
       return isPassage 
        ? "Provide a **Narration (Passage)** question from a past **HSC Board Exam** (Question No. 5). It must be a dialogue or narrative text in Direct Speech to be changed to Indirect."
        : "Provide a single Direct Speech sentence to change to Indirect, typical of Admission Tests.";

    case TopicId.VOICE:
        return "Provide a **Voice Change** question from a past Board or Admission exam. 'questionText' MUST be the sentence ONLY. 'instruction' MUST be the target direction.";

    default:
       return "Provide an HSC standard grammar question.";
  }
}
