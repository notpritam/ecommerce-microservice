import { IUser } from "./user.types";

export interface IAuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export interface IApiResponse<T> {
  data: T;
  error: string;
  success: boolean;
}
