import Constants from "expo-constants";

// The developer local server port for Spring Boot is 8080.
const DEFAULT_PORT = "8080";

export const getBaseUrl = (): string => {
  // If running in development, construct URL using the packager host IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (__DEV__ && hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}:${DEFAULT_PORT}`;
  }
  
  // Fallback to localhost (e.g. for simulators or local web environments)
  return `http://localhost:${DEFAULT_PORT}`;
};

interface RequestOptions extends RequestInit {
  body?: any;
}

/**
 * Standard utility wrapper for API HTTP requests.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
  const url = `${baseUrl}/${cleanEndpoint}`;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json() as T;
    }
    
    return {} as T;
  } catch (error: any) {
    console.error(`API Error on ${options.method || "GET"} ${url}:`, error);
    throw error;
  }
}

/**
 * Core HTTP Request Methods Helper
 */
export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "POST", body }),
  put: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "PUT", body }),
  delete: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
