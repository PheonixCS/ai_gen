import apiClient from './api-client';

export interface SubscriptionStatus {
  is_subscribed: boolean;
  subscription_end?: number;
  message?: string;
  status: string;
  code: number;
}

class SubscriptionService {
  /**
   * Activates user subscription
   * @param email User email
   * @param password User password
   * @returns Subscription activation status
   */
  async activateSubscription(email: string, password: string) {
    try {
      const response = await apiClient.activateSubscription(email, password);
      
      if (response.code === 200) {
        // Update local user data with subscription info
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.sub = 'y';
          userData.timestamp = response.timestamp || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // Default 30 days if not specified
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        return {
          success: true,
          message: 'Subscription activated successfully'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to activate subscription',
          code: response.code
        };
      }
    } catch (error) {
      console.error('Activate subscription error:', error);
      return {
        success: false,
        message: 'Service error occurred',
        code: 500
      };
    }
  }

  /**
   * Cancels user subscription
   * @param email User email
   * @param password User password
   * @returns Subscription cancellation status
   */
  async cancelSubscription(email: string, password: string) {
    try {
      const response = await apiClient.deactivateSubscription(email, password);
      
      if (response.code === 200) {
        // Update local user data to remove subscription info
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.sub = 'n';
          userData.timestamp = 0;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        return {
          success: true,
          message: 'Subscription cancelled successfully'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to cancel subscription',
          code: response.code
        };
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return {
        success: false,
        message: 'Service error occurred',
        code: 500
      };
    }
  }

  /**
   * Gets subscription status for the current user
   * @param email User email
   * @param password User password
   * @returns Subscription status
   */
  async getSubscriptionStatus(email: string, password: string): Promise<SubscriptionStatus> {
    try {
      return await apiClient.checkSubscription(email, password);
    } catch (error) {
      console.error('Get subscription status error:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
