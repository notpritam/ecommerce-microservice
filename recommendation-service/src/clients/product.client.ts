import { BaseServiceClient } from "./base.client";
import { INotification } from "../types/notification.types";
import ENV from "../config/env";
import { IApiResponse } from "../types";

export class ProductServiceClient extends BaseServiceClient {
  constructor() {
    const productServiceURL = ENV.services.productServiceURL;
    super(productServiceURL, "ProductService");
  }

  async getProducts(options: {
    categoryIds?: string[];
    limit?: number;
  }): Promise<IApiResponse<any>> {
    return this.post<IApiResponse<any>>("/", {
      params: options,
    });
  }

  async getProductById(productId: string): Promise<IApiResponse<any>> {
    return this.get<IApiResponse<any>>(`/${productId}`);
  }

  async getProductsByIds(productIds: string[]): Promise<IApiResponse<any>> {
    return this.post<IApiResponse<any>>("/by-ids", {
      data: { productIds },
    });
  }
}
