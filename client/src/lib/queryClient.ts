import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Structured error so onError handlers can branch on `err.status` directly
// instead of the brittle `err.message.includes("401")` string-match pattern.
// Message format is preserved (`${status}: ${text}`) for back-compat with any
// existing call sites still doing the string check.
export class ApiError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`${status}: ${body}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new ApiError(res.status, text);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    // Handle additional path segments (for hierarchical keys like ['/api/products', id])
    // and query params (for object params like ['/api/products', { featured: true }])
    for (let i = 1; i < queryKey.length; i++) {
      const segment = queryKey[i];
      if (typeof segment === 'object' && segment !== null) {
        // Convert object to query params
        const params = new URLSearchParams();
        Object.entries(segment).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        const paramString = params.toString();
        if (paramString) {
          url += (url.includes('?') ? '&' : '?') + paramString;
        }
      } else if (segment !== undefined && segment !== null) {
        // Append as path segment
        url += '/' + String(segment);
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
