export interface INotification {
  userId: string;
  type: string;
  content: any;
  read: boolean;
  sentAt: Date;
  expiresAt?: Date;
}
