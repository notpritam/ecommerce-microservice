export interface IUser {
  name: string;
  _id: string;
  email: string;
  role: "user" | "admin";
  password: string;
  preferences: {
    promotions: boolean;
    order_updates: boolean;
    recommendations: boolean;
  };
}
