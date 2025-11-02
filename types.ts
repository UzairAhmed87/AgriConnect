export enum UserRole {
  FARMER = 'farmer',
  BUYER = 'buyer'
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  location?: string;
  preferredLanguage: 'en' | 'ur';
  theme: 'light' | 'dark';
  profileImage?: string;
}

export interface Crop {
  id: string;
  farmerId: string;
  farmerName: string;
  cropName: string;
  category: 'vegetables' | 'fruits' | 'grains' | 'spices';
  quantity: number; // in kg
  price: number; // per kg
  imageUrl: string;
  location: string;
  description: string;
  status: 'available' | 'sold';
  timestamp: Date;
}

export enum OrderStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
}

export interface Order {
  id: string;
  buyerId: string;
  farmerId: string;
  cropId: string;
  cropName: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  timestamp: Date;
}

export interface AugmentedOrder extends Order {
  buyerName?: string;
  farmerName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  participants: string[]; // Array of user UIDs
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
}

// Client-side type for easier handling
export interface ChatWithParticipant extends Chat {
  otherParticipant: {
    uid: string;
    name: string;
  };
}


export interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  icon: string;
  forecast: { day: string; temp: number; icon: string }[];
}

// Types for Plant.id Health Assessment
export interface PlantIdHealthSuggestion {
  id: string;
  name: string;
  probability: number;
  // FIX: The description and treatment are nested inside a `details` object.
  details?: {
      description: string;
      treatment?: {
        biological?: string[];
        chemical?: string[];
        prevention?: string[];
      };
  }
}

export interface PlantIdHealthAssessment {
  is_healthy: boolean;
  disease_suggestions: PlantIdHealthSuggestion[];
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  link: string; // e.g., /orders or /messages
  isRead: boolean;
  timestamp: Date;
  messageParams?: Record<string, string>;
}