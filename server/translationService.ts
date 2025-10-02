import OpenAI from 'openai';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// Make OpenAI optional - disable if API key is not provided
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface TranslationRequest {
  text: string;
  fromLanguage: 'de' | 'en';
  toLanguage: 'de' | 'en';
  context?: string;
}

export async function translateText({
  text,
  fromLanguage,
  toLanguage,
  context = 'real estate inquiry'
}: TranslationRequest): Promise<string> {
  try {
    if (fromLanguage === toLanguage) {
      return text;
    }

    // If OpenAI is not available, return original text with notice
    if (!openai) {
      console.warn('OpenAI API key not configured - translation disabled');
      return `${text} [Translation not available - OpenAI API key not configured]`;
    }

    const systemPrompt = `You are a professional translator specializing in real estate communication. 
    Translate the following text from ${fromLanguage === 'de' ? 'German' : 'English'} to ${toLanguage === 'de' ? 'German' : 'English'}.
    
    Context: ${context}
    
    Requirements:
    - Maintain professional tone
    - Keep real estate terminology accurate
    - Preserve the original meaning and intent
    - Use appropriate formality level for business communication
    - If translating customer inquiries, maintain the customer's tone but make it professional
    - For responses, use formal business language
    
    Return only the translated text without any additional comments or explanations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: 1000,
    });

    const translatedText = response.choices[0].message.content?.trim();
    
    if (!translatedText) {
      throw new Error('No translation received from OpenAI');
    }

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback for basic translations if OpenAI fails
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('Translation service not configured. Please check API key.');
    }
    
    // Return original text if translation fails
    console.warn('Translation failed, returning original text');
    return text;
  }
}

// Detect language of text
export async function detectLanguage(text: string): Promise<'de' | 'en'> {
  try {
    // If OpenAI is not available, return default language (German)
    if (!openai) {
      console.warn('OpenAI API key not configured - language detection disabled, defaulting to German');
      return 'de';
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Detect if the following text is in German (de) or English (en). Respond with only 'de' or 'en'."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const detected = response.choices[0].message.content?.trim().toLowerCase();
    
    if (detected === 'de' || detected === 'en') {
      return detected;
    }
    
    // Fallback to simple detection
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'eine', 'ich', 'sie', 'wir', 'haben', 'sind', 'für', 'mit', 'auf', 'von', 'zu', 'ein', 'es', 'wird', 'auch', 'als', 'kann', 'wenn', 'nach', 'bei', 'aus', 'ihm', 'ihr', 'was', 'oder', 'nur', 'noch', 'aber', 'dass', 'über', 'wie', 'bis', 'dann', 'unter', 'durch', 'vor', 'um', 'seit', 'gegen', 'ohne', 'zwischen', 'während', 'wegen', 'trotz', 'samt', 'nebst', 'mitsamt', 'binnen', 'kraft', 'laut', 'vermöge', 'zufolge', 'immobilie', 'haus', 'wohnung', 'verkauf', 'kaufen', 'miete', 'bodensee'];
    const englishWords = ['the', 'and', 'is', 'a', 'i', 'they', 'we', 'have', 'are', 'for', 'with', 'on', 'from', 'to', 'an', 'it', 'will', 'also', 'as', 'can', 'if', 'after', 'at', 'out', 'him', 'her', 'what', 'or', 'only', 'still', 'but', 'that', 'about', 'how', 'until', 'then', 'under', 'through', 'before', 'around', 'since', 'against', 'without', 'between', 'while', 'because', 'despite', 'property', 'house', 'apartment', 'sale', 'buy', 'rent', 'real', 'estate'];
    
    const words = text.toLowerCase().split(/\s+/);
    let germanScore = 0;
    let englishScore = 0;
    
    words.forEach(word => {
      if (germanWords.includes(word)) germanScore++;
      if (englishWords.includes(word)) englishScore++;
    });
    
    return germanScore > englishScore ? 'de' : 'en';
    
  } catch (error) {
    console.error('Language detection error:', error);
    // Default to German for Bodensee region
    return 'de';
  }
}

// Auto-translate inquiry based on detected language
export async function autoTranslateInquiry(inquiry: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{
  originalLanguage: 'de' | 'en';
  translatedInquiry?: typeof inquiry;
  needsTranslation: boolean;
}> {
  try {
    // Detect language from message and subject
    const detectedLanguage = await detectLanguage(`${inquiry.subject} ${inquiry.message}`);
    
    // If it's already in German, no translation needed
    if (detectedLanguage === 'de') {
      return {
        originalLanguage: 'de',
        needsTranslation: false
      };
    }
    
    // Translate to German for internal processing
    const translatedSubject = await translateText({
      text: inquiry.subject,
      fromLanguage: detectedLanguage,
      toLanguage: 'de',
      context: 'real estate inquiry subject'
    });
    
    const translatedMessage = await translateText({
      text: inquiry.message,
      fromLanguage: detectedLanguage,
      toLanguage: 'de',
      context: 'real estate customer inquiry'
    });
    
    return {
      originalLanguage: detectedLanguage,
      translatedInquiry: {
        ...inquiry,
        subject: translatedSubject,
        message: translatedMessage
      },
      needsTranslation: true
    };
    
  } catch (error) {
    console.error('Auto-translation error:', error);
    return {
      originalLanguage: 'de',
      needsTranslation: false
    };
  }
}

// Translate response back to original language
export async function translateResponse(
  response: string,
  targetLanguage: 'de' | 'en'
): Promise<string> {
  if (targetLanguage === 'de') {
    return response; // Already in German
  }
  
  return translateText({
    text: response,
    fromLanguage: 'de',
    toLanguage: 'en',
    context: 'real estate business response'
  });
}