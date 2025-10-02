import { Express } from 'express';
import { translateText, detectLanguage } from '../translationService.js';

export function registerTranslationRoutes(app: Express) {
  console.log('🌍 Registering translation routes...');
  
  // API endpoint for manual translation - support both GET and POST
  app.post('/api/translate', async (req, res) => {
    try {
      const { text, fromLanguage, toLanguage, context } = req.body;
      
      if (!text || !fromLanguage || !toLanguage) {
        return res.status(400).json({
          error: 'Missing required fields: text, fromLanguage, toLanguage'
        });
      }
      
      const translatedText = await translateText({
        text,
        fromLanguage,
        toLanguage,
        context: context || 'general'
      });
      
      res.json({
        originalText: text,
        translatedText,
        fromLanguage,
        toLanguage,
        context: context || 'general'
      });
      
    } catch (error) {
      console.error('Translation API error:', error);
      res.status(500).json({
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Support GET method for translation API as well
  app.get('/api/translate', async (req, res) => {
    try {
      const { text, fromLanguage, toLanguage, context } = req.query;
      
      if (!text || !fromLanguage || !toLanguage) {
        return res.status(400).json({ 
          error: 'Missing required parameters: text, fromLanguage, toLanguage' 
        });
      }

      const translatedText = await translateText({
        text: text as string,
        fromLanguage: fromLanguage as 'de' | 'en',
        toLanguage: toLanguage as 'de' | 'en',
        context: context as string
      });
      
      res.json({ translatedText });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ 
        error: 'Translation failed',
        fallback: 'Translation service temporarily unavailable'
      });
    }
  });

  // API endpoint for language detection
  app.post('/api/detect-language', async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({
          error: 'Missing required field: text'
        });
      }
      
      const detectedLanguage = await detectLanguage(text);
      
      res.json({
        text,
        detectedLanguage
      });
      
    } catch (error) {
      console.error('Language detection API error:', error);
      res.status(500).json({
        error: 'Language detection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}