/**
 * Helper function to handle all API calls with consistent error handling
 * Ensures that errors are properly logged and reported
 */
export async function fetchAPI<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    // If response is not ok, try to parse error details
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If we can't parse the error response, use the status message
        errorMessage = response.statusText || errorMessage;
      }
      console.error(`API Error [${response.status}]:`, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
