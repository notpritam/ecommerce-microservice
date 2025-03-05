import { IUser } from "./user.types";

export interface IAuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}
