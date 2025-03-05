import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import logger from "../config/logger";

export class BaseServiceClient {
  protected client: AxiosInstance;
  protected serviceName: string;

  constructor(baseURL: string, serviceName: string) {
    this.serviceName = serviceName;
    this.client = axios.create({
      baseURL,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "Service-Auth":
          process.env.INTER_SERVICE_SECRET || "your-inter-service-secret",
      },
    });

    // Adding request interceptor for logging so we can see what's being sent or requested to other service
    this.client.interceptors.request.use((config) => {
      logger.debug(
        `Request to ${this.serviceName}: ${config.method?.toUpperCase()} ${
          config.url
        }`
      );
      return config;
    });

    // Adding response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          logger.error(
            `${this.serviceName} service error: ${
              error.response.status
            } - ${JSON.stringify(error.response.data)}`
          );
        } else if (error.request) {
          logger.error(
            `${this.serviceName} service no response: ${error.message}`
          );
        } else {
          logger.error(`${this.serviceName} service error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.put(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      return new Error(
        `${this.serviceName} service responded with ${
          error.response.status
        }: ${JSON.stringify(error.response.data)}`
      );
    } else if (error.request) {
      return new Error(`${this.serviceName} service timeout or no response`);
    } else {
      return new Error(`${this.serviceName} service error: ${error.message}`);
    }
  }
}
