export interface Metric {
  status: 'up' | 'down' | 'unknown';
  responseTime: number;
  url: string;
  timestamp: string;
  alerts: Alert[];
  error?: string;
}

export type AlertType = 'status_change' | 'high_latency';

export interface BaseAlert {
  type: AlertType;
  url: string;
  timestamp: string;
}

export interface StatusChangeAlert extends BaseAlert {
  type: 'status_change';
  from: 'up' | 'down' | 'unknown' | null;
  to: 'up' | 'down' | 'unknown';
  responseTime?: number;
  error?: string;
}

export interface HighLatencyAlert extends BaseAlert {
  type: 'high_latency';
  responseTime: number;
  threshold: number;
}

export type Alert = StatusChangeAlert | HighLatencyAlert;

export interface LogMetadata {
  [key: string]: any;
} 