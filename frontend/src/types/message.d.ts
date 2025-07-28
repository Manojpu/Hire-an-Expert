export interface Message {
  _id?: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp?: string;
  status?: 'sent' | 'read';
}
