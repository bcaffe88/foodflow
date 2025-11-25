export async function apiRequest(
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT",
  endpoint: string,
  body?: any
): Promise<any> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add auth token if available
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(endpoint, options);

    // Handle token expiration
    if (response.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const { accessToken: newToken } = await refreshRes.json();
            localStorage.setItem("accessToken", newToken);

            // Retry original request
            headers["Authorization"] = `Bearer ${newToken}`;
            const retryRes = await fetch(endpoint, { ...options, headers });
            return retryRes.json();
          }
        } catch (error) {
        }
      }

      // Redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Request failed");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
}
