/**
 * Widget Configuration Types
 */

export interface WidgetConfig {
  tenantId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  voice: 'male' | 'female' | 'neutral';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  brandLogo?: string;
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  welcomeMessage?: string;
  placeholderText?: string;
  buttonText?: string;
  enabled: boolean;
  allowedDomains?: string[];
  customCSS?: string;
  maxQueriesPerDay?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WidgetQueryRequest {
  tenantId: string;
  apiKey: string;
  query: string;
  mode?: 'text' | 'voice';
  sessionId?: string;
  agentId?: string;
}

export interface WidgetQueryResponse {
  response: string;
  timestamp: string;
  mode: 'text' | 'voice';
  metadata?: {
    tokens?: number;
    cost?: number;
    duration?: number;
  };
}

export interface WidgetInteraction {
  id: string;
  tenantId: string;
  agentId?: string;
  sessionId?: string;
  query: string;
  response: string;
  mode: 'text' | 'voice';
  metadata?: {
    tokens?: number;
    cost?: number;
    duration?: number;
    userAgent?: string;
    ipAddress?: string;
  };
  timestamp: string;
}
