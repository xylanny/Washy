export interface Result<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface HttpOptions extends RequestInit {
  headers?: HeadersInit;
  skipAuth?: boolean;
}

/**
 * 接口基础地址
 *
 * 构建时由 APP_API_BASE_URL 注入（.env.* 文件或 Docker build-arg）。
 *
 * 这里必须给空值兜底：Vite 解析环境变量时 process.env 的优先级高于 .env 文件，
 * Docker 里一旦传入空的 APP_API_BASE_URL，就会把 .env.production 的 /api 覆盖成空串，
 * 请求会变成同源的 /user/xxx（缺少 /api 前缀）。Nginx 把 /api/ 代理给后端，
 * 后端的 context-path 也是 /api，所以 /api 是安全的默认值。
 */
export const API_BASE_URL: string =
  (typeof import.meta.env.APP_API_BASE_URL === "string"
    ? import.meta.env.APP_API_BASE_URL.trim()
    : "") || "/api";

class HTTPClient {
  private baseURL: string;
  private white: Set<string>;

  constructor(baseURL: string, white: Set<string>) {
    this.baseURL = baseURL;
    this.white = white;
  }

  private buildURL(url: string): string {
    return `${this.baseURL}${url}`;
  }

  private getToken(): string | null {
    return localStorage.getItem("token");
  }

  private setToken(token: string): void {
    localStorage.setItem("token", token);
  }

  private removeToken(): void {
    localStorage.removeItem("token");
  }

  private shouldSkipAuth(url: string, options: HttpOptions): boolean {
    return options.skipAuth || this.white.has(url);
  }

  async request<T = any>(
    url: string,
    options: HttpOptions = {},
  ): Promise<Result<T>> {
    const targetURL = this.buildURL(url);
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (!this.shouldSkipAuth(url, options)) {
      const token = this.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(targetURL, requestOptions);

      if (response.status === 401) {
        this.removeToken();
        throw new Error("Unauthorized (401)");
      }

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const responseBody = (await response.json()) as Result<T>;

      if (responseBody.data && typeof responseBody.data === "object") {
        const token = (responseBody.data as { token?: string }).token;
        if (token) {
          this.setToken(token);
        }
      }

      return responseBody;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  get<T = any>(url: string, options: HttpOptions = {}): Promise<Result<T>> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  post<T = any>(
    url: string,
    data?: any,
    options: HttpOptions = {},
  ): Promise<Result<T>> {
    const body =
      data instanceof FormData
        ? data
        : data !== undefined
          ? JSON.stringify(data)
          : undefined;
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body,
    });
  }

  put<T = any>(
    url: string,
    data?: any,
    options: HttpOptions = {},
  ): Promise<Result<T>> {
    const body =
      data instanceof FormData
        ? data
        : data !== undefined
          ? JSON.stringify(data)
          : undefined;
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body,
    });
  }

  delete<T = any>(url: string, options: HttpOptions = {}): Promise<Result<T>> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

const client = new HTTPClient(
  API_BASE_URL,
  new Set<string>(["/register", "/login"]),
);

export default client;
