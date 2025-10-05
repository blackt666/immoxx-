
export interface SEOData {
  title: string;
  description: string;
  keywords: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

export class SEOManager {
  private static activeStrategy: SEOData | null = null;
  private static lastUpdate = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getActiveSEO(section: string): Promise<SEOData | null> {
    try {
      // seoStrategiesTable doesn't exist in schema, so just return default SEO
      return this.getSectionSEO(section);
    } catch (error) {
      console.error("Error fetching active SEO:", error);
      return null;
    }
  }

  private static getSectionSEO(section: string): SEOData | null {
    // Return default SEO data for the section
    const defaultSEO = {
      home: {
        title: "Bodensee Immobilien Müller | Immobilienmakler für die Bodenseeregion",
        description: "Ihr Experte für Immobilien am Bodensee. Über 20 Jahre Erfahrung in der Vermittlung von Wohnungen, Häusern und Villen in Friedrichshafen und Umgebung.",
        keywords: "Immobilienmakler Bodensee, Wohnung kaufen Bodensee, Haus verkaufen Friedrichshafen"
      },
      properties: {
        title: "Immobilien am Bodensee | Exklusive Angebote",
        description: "Entdecken Sie unsere exklusiven Immobilien in den schönsten Lagen rund um den Bodensee.",
        keywords: "Immobilien Bodensee, Häuser Bodensee, Wohnungen Bodensee"
      }
    };
    
    return defaultSEO[section as keyof typeof defaultSEO] || defaultSEO.home;
  }

  static async generateMetaTags(section: string, baseUrl: string): Promise<string> {
    const seoData = await this.getActiveSEO(section);
    
    if (!seoData) {
      return this.getDefaultMetaTags(section);
    }

    return `
    <title>${seoData.title}</title>
    <meta name="description" content="${seoData.description}" />
    <meta name="keywords" content="${seoData.keywords}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${seoData.ogTitle || seoData.title}" />
    <meta property="og:description" content="${seoData.ogDescription || seoData.description}" />
    <meta property="og:url" content="${baseUrl}/${section === 'home' ? '' : section}" />
    <meta property="og:type" content="website" />
    
    <!-- Twitter -->
    <meta name="twitter:title" content="${seoData.twitterTitle || seoData.title}" />
    <meta name="twitter:description" content="${seoData.twitterDescription || seoData.description}" />
    <meta name="twitter:card" content="summary_large_image" />
    `;
  }

  private static getDefaultMetaTags(section: string): string {
    const defaultSEO = {
      home: {
        title: "Bodensee Immobilien Müller | Immobilienmakler für die Bodenseeregion",
        description: "Ihr Experte für Immobilien am Bodensee. Über 20 Jahre Erfahrung in der Vermittlung von Wohnungen, Häusern und Villen in Friedrichshafen und Umgebung.",
        keywords: "Immobilienmakler Bodensee, Wohnung kaufen Bodensee, Haus verkaufen Friedrichshafen"
      },
      properties: {
        title: "Immobilien am Bodensee | Exklusive Angebote",
        description: "Entdecken Sie unsere exklusiven Immobilien in den schönsten Lagen rund um den Bodensee.",
        keywords: "Immobilien Bodensee, Häuser Bodensee, Wohnungen Bodensee"
      }
    };

    const seo = defaultSEO[section as keyof typeof defaultSEO] || defaultSEO.home;
    
    return `
    <title>${seo.title}</title>
    <meta name="description" content="${seo.description}" />
    <meta name="keywords" content="${seo.keywords}" />
    `;
  }

  static clearCache() {
    this.activeStrategy = null;
    this.lastUpdate = 0;
  }
}
