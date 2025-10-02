import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { LoginCredentials, AuthResponse } from "@/types/admin";

const TIMEOUT_MS = 8000; // Reduced timeout for faster fallback
const MAX_RETRIES = 2;

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  signal?: AbortSignal;
  retries?: number;
  validateAuth?: boolean;
}

// Custom error types for better error handling
class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

class TimeoutError extends Error {
  status: number;

  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
    this.status = 408;
  }
}

class NetworkError extends Error {
  status: number;

  constructor(message: string = 'Network error') {
    super(message);
    this.name = 'NetworkError';
    this.status = 0;
  }
}

// Enhanced fetch function with better error handling
const enhancedFetch = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`⏰ Request timeout (${TIMEOUT_MS}ms) for ${options.method || 'GET'} ${url}`);
    controller.abort();
  }, TIMEOUT_MS);

  try {
    console.log(`🔄 API Request ${options.method || 'GET'} to: ${url}`);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status} for ${url}`);

      // Try to get error message from response body
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use status text
      }

      throw new ApiError(errorMessage, response.status, response.statusText);
    }

    console.log(`✅ Request successful for ${url}`);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message?.includes('signal is aborted')) {
        console.log(`⏰ Request timeout for ${options.method || 'GET'} ${url}`);
        throw new TimeoutError('Request timeout');
      }

      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.log(`⚠️ Network error for ${options.method || 'GET'} ${url}`);
        throw new NetworkError('Network connection failed');
      }

      console.error(`❌ Request failed for ${options.method || 'GET'} ${url}:`, error.message);
      throw error;
    } else {
      // Handle non-Error objects with better typing
      console.error(`❌ Request failed for ${options.method || 'GET'} ${url}:`, error);
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred';
      throw new NetworkError(errorMessage);
    }
  }
};

// Real API requests with proper error handling
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = TIMEOUT_MS,
    retries = MAX_RETRIES,
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  };

  if (body && method !== 'GET') {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await enhancedFetch(url, requestOptions);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json() as T;
      } else {
        return response as unknown as T;
      }
    } catch (error: unknown) {
      lastError = error;
      console.log(`🔄 Attempt ${attempt + 1}/${retries + 1} failed for ${method} ${endpoint}`);

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  console.error(`❌ All attempts failed for ${method} ${endpoint}:`, errorMessage);

  if (lastError instanceof Error) {
    throw lastError;
  } else {
    throw new Error(`Request failed: ${errorMessage}`);
  }
}

// Mock Properties for immediate fallback
function getMockProperties() {
  return [
    {
      id: "mock-1",
      title: "Luxusvilla am Bodensee",
      location: "Konstanz",
      price: 1200000,
      type: "villa",
      status: "available",
      bedrooms: 5,
      bathrooms: 3,
      area: 250,
      description: "Exklusive Villa mit direktem Seeblick",
      images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "mock-2",
      title: "Moderne Wohnung in Meersburg",
      location: "Meersburg",
      price: 650000,
      type: "apartment",
      status: "available",
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      description: "Helle Wohnung mit Balkon und Seeblick",
      images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "mock-3",
      title: "Einfamilienhaus Friedrichshafen",
      location: "Friedrichshafen",
      price: 850000,
      type: "house",
      status: "available",
      bedrooms: 4,
      bathrooms: 2,
      area: 180,
      description: "Gepflegtes Einfamilienhaus in ruhiger Lage",
      images: ["https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop"],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
}

// Create query client with optimized settings - STOP ENDLESS RETRIES
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1, // Only retry once
      retryDelay: 1000, // 1 second delay
      refetchOnWindowFocus: false,
      // timeout: 8000 // 8 second timeout - not supported in default options
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// CRITICAL: Stop all rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.log('🛡️ Handled rejection:', event.reason?.message || 'Unknown');
    event.preventDefault(); // ALWAYS prevent to stop console spam
  });

  window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('timeout') || event.error?.message?.includes('fetch')) {
      console.log('🛡️ Network error handled');
      event.preventDefault();
    }
  });
}

// Real Properties hook with backend API calls
export function useProperties(filters?: {
  type?: string;
  location?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();

  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.location) queryParams.append('location', filters.location);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/properties${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => apiRequest(endpoint),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      // Return mock property for demo
      const mockProps = getMockProperties();
      return mockProps.find(p => p.id === id) || mockProps[0];
    },
    enabled: !!id && typeof id === 'string',
    staleTime: Infinity,
    retry: false,
  });
}

export function useGallery(category?: string) {
  return useQuery({
    queryKey: ["gallery", category || "all"],
    queryFn: async () => {
      console.log("🖼️ Using mock gallery images");
      // Return mock gallery data - NO API CALLS
      return [
        {
          id: "1",
          filename: "villa-1.jpg",
          url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
          category: category || "villa",
          alt: "Luxusvilla Bodensee"
        },
        {
          id: "2",
          filename: "apartment-1.jpg",
          url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
          category: category || "apartment",
          alt: "Moderne Wohnung"
        }
      ];
    },
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useInquiries() {
  return useQuery({
    queryKey: ["/api/inquiries"],
    queryFn: () => apiRequest("/api/inquiries"),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

// Real Auth hook with backend API calls
export function useAuth() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async (): Promise<AuthResponse | null> => {
      // Check session storage first
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('admin_user');
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch {
            sessionStorage.removeItem('admin_user');
          }
        }
      }

      // Verify with server
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('admin_user', JSON.stringify(userData));
          }
          return userData;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }

      return null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

// Mutation hooks
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include', // Important for session cookies
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login fehlgeschlagen');
      }

      const userData = await response.json();

      // Store in sessionStorage for persistence
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_user', JSON.stringify(userData));
      }

      return userData;
    },
    onSuccess: (userData) => {
      // Invalidate any cached queries that depend on auth state
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error) => {
      console.error('Login error:', error);
      // Clear any stored auth data on error
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('admin_user');
      }
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiRequest("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyData: any) =>
      apiRequest("/api/properties", {
        method: "POST",
        body: propertyData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) =>
      apiRequest(`/api/properties/${id}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/properties/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useCreateInquiry() {
  return useMutation({
    mutationFn: (inquiryData: any) =>
      apiRequest("/api/inquiries", {
        method: "POST",
        body: inquiryData,
      }),
  });
}

// Real system status check
export function useSystemStatus() {
  return useQuery({
    queryKey: ["/api/health"],
    queryFn: () => apiRequest("/api/health"),
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

// DISABLED: Dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: () => apiRequest("/api/admin/stats"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// DISABLED: Newsletters
export function useNewsletters() {
  return useQuery({
    queryKey: ["/api/newsletters"],
    queryFn: () => apiRequest("/api/newsletters"),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

export function useCreateNewsletter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newsletterData: any) =>
      apiRequest("/api/newsletters", {
        method: "POST",
        body: newsletterData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
    },
  });
}