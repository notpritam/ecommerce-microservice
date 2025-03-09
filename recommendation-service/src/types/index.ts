export interface IApiResponse<T> {
  data: T;
  error: string;
  success: boolean;
}
