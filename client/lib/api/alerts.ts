import { fetchAPI } from './fetch-helper';

const API_BASE_URL = '/api';

export interface Alert {
  id: number;
  symbol: string;
  target_price: number;
  condition: 'above' | 'below';
  status: 'active' | 'triggered';
  created_at: string;
}

export interface CheckAlertsResponse {
  triggered_alerts: Alert[];
}

export const alertsAPI = {
  // Get alerts
  getAlerts: async (status?: string): Promise<Alert[]> => {
    try {
      const url = status
        ? `${API_BASE_URL}/alerts?status=${status}`
        : `${API_BASE_URL}/alerts`;
      const data = await fetchAPI<Alert[]>(url);
      return data || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  },

  // Create an alert
  createAlert: async (
    symbol: string,
    targetPrice: number,
    condition: 'above' | 'below'
  ): Promise<Alert> => {
    const data = await fetchAPI<Alert>(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        target_price: targetPrice,
        condition,
      }),
    });
    return data;
  },

  // Delete an alert
  deleteAlert: async (alertId: number): Promise<{ success: boolean }> => {
    try {
      const data = await fetchAPI<{ success: boolean }>(
        `${API_BASE_URL}/alerts/${alertId}`,
        { method: 'DELETE' }
      );
      return data || { success: true };
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  },

  // Check alerts - IMPORTANT: Always returns a value
  checkAlerts: async (): Promise<CheckAlertsResponse> => {
    try {
      const data = await fetchAPI<CheckAlertsResponse>(
        `${API_BASE_URL}/alerts/check`,
        { method: 'POST' }
      );
      return data || { triggered_alerts: [] };
    } catch (error) {
      console.error('Error checking alerts:', error);
      return { triggered_alerts: [] };
    }
  },
};
