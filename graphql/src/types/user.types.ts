export interface IUser {
  name: string;
  id: string;
  email: string;
  preferences: {
    promotions: boolean;
    order_updates: boolean;
    recommendations: boolean;
  };
}
