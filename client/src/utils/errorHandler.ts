interface APIError extends Error {
  status?: number;
  code?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {
    this.setupGlobalErrorHandling();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandling() {
    // Normale Error-Handler ohne API-Blockade
    window.addEventListener('unhandledrejection', (event) => {
      console.log('🛡️ Unhandled rejection:', event.reason?.message || 'Unknown error');
      // Nur bei kritischen Errors verhindern
      if (event.reason?.message?.includes('CRITICAL')) {
        event.preventDefault();
      }
    });

    window.addEventListener('error', (event) => {
      if (event.message?.includes('fetch') || event.message?.includes('Network')) {
        console.log('🛡️ Network error handled:', event.message);
      }
    });
  }

  static createError(message: string, status?: number): APIError {
    const error = new Error(message) as APIError;
    error.status = status;
    return error;
  }

  static handleAPIError(error: unknown): APIError {
    if (error instanceof Error) {
      return error as APIError;
    }

    if (typeof error === "string") {
      return this.createError(error);
    }

    return this.createError("Ein unbekannter Fehler ist aufgetreten");
  }

  static getErrorMessage(error: unknown): string {
    const apiError = this.handleAPIError(error);

    if (apiError.name === "TimeoutError" ||
        apiError.message?.includes("timeout") ||
        apiError.message?.includes("signal is aborted")) {
      console.log("🔄 Handling timeout error - using fallback data");
      return "Verbindung langsam - Fallback-Daten geladen";
    }

    if (apiError.status === 404) {
      return "Die angeforderten Daten wurden nicht gefunden";
    }

    if (apiError.status === 500) {
      return "Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.";
    }

    if (apiError.status === 408) {
      return "Request timeout - Fallback-Daten verwendet";
    }

    if (apiError.name === "AbortError") {
      console.log("🔄 Request aborted - continuing with fallback");
      return "Anfrage abgebrochen - Fallback aktiv";
    }

    if (apiError.status === 503) {
      return "Service vorübergehend nicht verfügbar.";
    }

    return apiError.message || "Ein Fehler ist aufgetreten";
  }

  static isNetworkError(error: unknown): boolean {
    const apiError = this.handleAPIError(error);
    return (
      apiError.message.toLowerCase().includes("fetch") ||
      apiError.message.toLowerCase().includes("network") ||
      apiError.name === "TypeError"
    );
  }

  static shouldRetry(error: unknown, retryCount: number = 0): boolean {
    if (retryCount >= 3) return false;

    const apiError = this.handleAPIError(error);

    return Boolean(
      this.isNetworkError(error) || (apiError.status && apiError.status >= 500)
    );
  }
}

// Enhanced fetch with retry logic
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = ErrorHandler.createError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
        );
        throw error;
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !ErrorHandler.shouldRetry(error, attempt)) {
        throw ErrorHandler.handleAPIError(error);
      }

      // Wait before retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw ErrorHandler.handleAPIError(lastError);
}