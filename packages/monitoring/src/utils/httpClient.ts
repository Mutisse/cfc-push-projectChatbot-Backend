import axios, { AxiosInstance, AxiosRequestConfig, } from 'axios';
import config from '../config';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  statusCode?: number;
  error?: string;
  data?: any;
  headers?: Record<string, string>;
}

export interface EndpointTestResult {
  endpoint: string;
  status: 'success' | 'failed';
  responseTime: number;
  statusCode?: number;
  error?: string;
}

class HttpClient {
  private client: AxiosInstance;
  private timeout: number = 10000; // 10 segundos padrão
  private retryAttempts: number = 2;

  constructor() {
    this.client = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `CFC-Monitoring/${config.APP_NAME}`,
        'X-Request-ID': () => this.generateRequestId()
      },
      validateStatus: (status) => status < 500 // Considera 5xx como erro
    });

    // Interceptores para logging e métricas
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        (config as any).metadata = { startTime };
        
        console.log(`[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data
        });
        
        return config;
      },
      (error) => {
        console.error('[HTTP Request Error]', error.message, error.config?.url);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const startTime = (response.config as any).metadata?.startTime;
        const duration = startTime ? endTime - startTime : 0;

        console.log(`[HTTP Response] ${response.status} ${response.config.url}`, {
          duration: `${duration}ms`,
          headers: response.headers
        });

        return response;
      },
      (error) => {
        const endTime = Date.now();
        const startTime = (error.config?.metadata?.startTime);
        const duration = startTime ? endTime - startTime : 0;

        console.error('[HTTP Response Error]', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
          duration: `${duration}ms`
        });

        return Promise.reject(error);
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async healthCheck(url: string, options?: {
    timeout?: number;
    expectedStatus?: number;
    validateResponse?: (data: any) => boolean;
  }): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timeout = options?.timeout || 3000;

    try {
      const response = await this.client.get(url, {
        timeout,
        validateStatus: () => true // Aceita qualquer status para análise
      });

      const responseTime = Date.now() - startTime;
      const statusCode = response.status;

      // Determinar status baseado no código HTTP
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (statusCode >= 200 && statusCode < 300) {
        status = 'healthy';
      } else if (statusCode >= 300 && statusCode < 500) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      // Validar resposta personalizada se fornecida
      if (options?.validateResponse && !options.validateResponse(response.data)) {
        status = 'unhealthy';
      }

      return {
        status,
        responseTime,
        statusCode,
        data: response.data,
        headers: response.headers as Record<string, string>
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
      let errorMessage = 'Unknown error';

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Timeout';
        } else if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused';
        } else if (error.response) {
          errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          errorMessage = 'No response received';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        status,
        responseTime,
        error: errorMessage
      };
    }
  }

  async testEndpoints(
    baseUrl: string, 
    endpoints: string[], 
    options?: { timeout?: number }
  ): Promise<{
    success: number;
    failed: number;
    totalResponseTime: number;
    details: EndpointTestResult[];
  }> {
    const promises = endpoints.map(async (endpoint) => {
      const startTime = Date.now();
      const fullUrl = `${baseUrl}${endpoint}`;

      try {
        const response = await this.client.get(fullUrl, {
          timeout: options?.timeout || 2000,
          validateStatus: () => true
        });

        const responseTime = Date.now() - startTime;
        const status = response.status >= 200 && response.status < 300 ? 'success' : 'failed';

        return {
          endpoint,
          status,
          responseTime,
          statusCode: response.status,
          error: status === 'failed' ? `HTTP ${response.status}` : undefined
        };
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        return {
          endpoint,
          status: 'failed' as const,
          responseTime,
          error: error.message || 'Request failed'
        };
      }
    });

    const results = await Promise.all(promises);
    const success = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0);

    return { success, failed, totalResponseTime, details: results };
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async head<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.head<T>(url, config);
    return response.data;
  }

  async options<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.options<T>(url, config);
    return response.data;
  }

  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  async retryRequest<T = any>(
    config: AxiosRequestConfig,
    maxRetries: number = this.retryAttempts
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.client.request<T>(config);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

export default new HttpClient();