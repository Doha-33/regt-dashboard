

import { User, Withdrawal, AuditLog, Company, Notification, SystemConfig } from '../types';

// Simple random generator helpers
const randomId = () => Math.random().toString(36).substr(2, 9);
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomArr = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = () => new Date(Date.now() - randomInt(0, 10000000000)).toISOString();
const isToday = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
};

class MockDatabase {
  users: User[] = [];
  withdrawals: Withdrawal[] = [];
  auditLogs: AuditLog[] = [];
  companies: Company[] = [];
  notifications: Notification[] = [];
  configs: SystemConfig[] = [];

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Generate Users with Tiers Logic (Mock)
    for (let i = 1; i <= 50; i++) {
        // Range: 0 to 50 for realistic demo of tier switch
        const teamSize = randomInt(0, 50); 
        let tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' = 'Bronze';
        
        // 0-10 Bronze, 11-20 Silver, 21-30 Gold, 31+ Diamond
        if (teamSize >= 31) tier = 'Diamond';
        else if (teamSize >= 21) tier = 'Gold';
        else if (teamSize >= 11) tier = 'Silver';
        else tier = 'Bronze';

        this.users.push({
            id: i,
            name: `User ${i}`,
            email: `user${i}@gmail.com`,
            phone: `+12345678${i}`,
            role: i === 1 ? 'admin' : 'user',
            affiliate_code: `AFF-${randomId().toUpperCase()}`,
            referred_by: i > 5 ? `AFF-${randomId().toUpperCase()}` : null,
            otp: "000000",
            is_verified: i % 10 === 0 ? 0 : 1, // Some frozen
            status: i % 10 === 0 ? 'suspended' : 'active',
            profile_image: null,
            address: "123 Street, City",
            balance: randomInt(10, 5000), // RGT Balance
            affiliate_balance: randomInt(0, 500),
            team_size: teamSize,
            tier: tier, // Ensure tier is present
            country: randomArr(['Egypt', 'Saudi Arabia', 'UAE', 'USA']),
            age: randomInt(18, 50),
            gender: randomArr(['male', 'female']),
            last_login_at: randomInt(0, 1) ? new Date().toISOString() : randomDate(),
            created_at: i > 45 ? new Date().toISOString() : randomDate(), // Some created today
            updated_at: randomDate()
        });
    }

    // Generate Withdrawals
    for (let i = 0; i < 30; i++) {
        const status = randomArr(['pending', 'confirmed', 'rejected']);
        this.withdrawals.push({
            id: 1000 + i,
            transaction_id: `TXN-${randomId().toUpperCase()}`, // Ensure transaction_id
            user_id: randomInt(1, 50),
            username: `User ${randomInt(1, 50)}`,
            name: `Full Name ${i}`,
            email: `email${i}@test.com`,
            amount: randomInt(50, 1000), // RGT
            method: randomArr(['bank', 'bank_dollar', 'wallet', 'games']),
            status: status,
            type_withdraw: randomArr(['affiliate', 'profit_ads']),
            note: status === 'rejected' ? 'Invalid details' : null,
            country: 'Country',
            created_at: randomDate()
        });
    }

    // Seed Companies
    const companyTypes = ['Ads', 'Tasks', 'Surveys'];
    for (let i = 0; i < 6; i++) {
      this.companies.push({
        id: `COMP-${randomId()}`,
        name: `Partner ${i + 1} ${randomArr(['Inc', 'Media', 'Ltd'])}`,
        logo: null,
        type: companyTypes[i % 3].toLowerCase(),
        status: 'active',
        description: 'Global partner for traffic.',
        amount: randomInt(5000, 20000), // Revenue generated
        url: `https://partner${i+1}.com/admin`,
        created_at: randomDate(),
        updated_at: randomDate()
      });
    }

    // Seed Configs (Settings) - Added missing data keys
    this.configs = [
      { id: '1', key: 'riget_price_usd', value: '0.10', description: 'Coin Price (USD)', updated_at: new Date().toISOString() },
      { id: '2', key: 'ad_price', value: '1.00', description: 'Price per Ad View (RGT)', updated_at: new Date().toISOString() },
      { id: '3', key: 'survey_price', value: '5.00', description: 'Price per Survey (RGT)', updated_at: new Date().toISOString() },
      { id: '4', key: 'task_price', value: '10.00', description: 'Price per Task (RGT)', updated_at: new Date().toISOString() },
      { id: '5', key: 'referral_commission_percent', value: '10', description: 'Tier 1 Commission %', updated_at: new Date().toISOString() },
      { id: '6', key: 'support_email', value: 'support@regt.com', description: 'Support Email', updated_at: new Date().toISOString() },
      { id: '7', key: 'total-riget', value: '50000000', description: 'Total Supply Cap (50M)', updated_at: new Date().toISOString() },
      { id: '8', key: 'total-avalible-riget', value: '0', description: 'Calculated dynamically usually', updated_at: new Date().toISOString() },
      { id: '9', key: 'cooling_period_ads', value: '30', description: 'Seconds between ads', updated_at: new Date().toISOString() },
      { id: '10', key: 'min_withdrawal', value: '50', description: 'Min RGT to withdraw', updated_at: new Date().toISOString() },
      { id: '11', key: 'referral_commission_tier_2', value: '5', description: 'Tier 2 Commission %', updated_at: new Date().toISOString() },
      { id: '12', key: 'referral_commission_tier_3', value: '2.5', description: 'Tier 3 Commission %', updated_at: new Date().toISOString() },
      { id: '13', key: 'daily_login_bonus', value: '0.5', description: 'RGT for daily login', updated_at: new Date().toISOString() },
      { id: '14', key: 'maintenance_mode', value: 'false', description: 'System Maintenance', updated_at: new Date().toISOString() },
      { id: '15', key: 'android_version', value: '1.0.0', description: 'Latest App Version', updated_at: new Date().toISOString() },
      { id: '16', key: 'ios_version', value: '1.0.0', description: 'Latest iOS Version', updated_at: new Date().toISOString() },
    ];
  }

  // --- Actions ---

  createAuditLog(adminId: string, action: string, entityId: string, details: any) {
    this.auditLogs.unshift({
      id: `LOG-${randomId()}`,
      admin_id: adminId,
      action,
      entity_id: entityId,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString()
    });
  }

  getStats() {
      // 1. Calculate Total User Balances (Distributed Supply)
      const totalUserBalance = this.users.reduce((sum, user) => sum + Number(user.balance || 0), 0);
      
      // 2. Supply Logic
      const totalCap = 50000000;
      const distributed = totalUserBalance; 
      const remaining = totalCap - distributed;

      // 3. User Stats
      const todayUsers = this.users.filter(u => isToday(u.created_at)).length;
      const activeUsers = this.users.filter(u => u.status === 'active').length; // Logic: Active >= 1 view/day
      const inactiveUsers = this.users.filter(u => u.status === 'inactive').length;
      const frozenUsers = this.users.filter(u => u.is_verified === 0).length;

      // 4. Withdrawal Stats
      const pendingWithdrawals = this.withdrawals.filter(w => w.status === 'pending');
      const confirmedWithdrawals = this.withdrawals.filter(w => w.status === 'confirmed');
      const rejectedWithdrawals = this.withdrawals.filter(w => w.status === 'rejected');

      const totalWithdrawnRGT = confirmedWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
      
      // Breakdown by Method
      const methods = {
          bank: { count: 0, volume: 0 },
          crypto: { count: 0, volume: 0 },
          wallet: { count: 0, volume: 0 }, // RGT transfer
          gift_card: { count: 0, volume: 0 }
      };

      this.withdrawals.forEach(w => {
          const m = w.method as keyof typeof methods;
          if (methods[m]) {
              methods[m].count++;
              methods[m].volume += Number(w.amount);
          } else {
             // fallback map if mock data is dirty
             if(w.method === 'bank_dollar') { methods.crypto.count++; methods.crypto.volume += Number(w.amount); }
          }
      });

      // 5. Revenue Breakdown (Mocked based on companies)
      const adRevenue = this.companies.filter(c => c.type === 'ads').reduce((sum, c) => sum + Number(c.amount), 0);
      const taskRevenue = this.companies.filter(c => c.type === 'tasks').reduce((sum, c) => sum + Number(c.amount), 0);
      const surveyRevenue = this.companies.filter(c => c.type === 'surveys').reduce((sum, c) => sum + Number(c.amount), 0);

      // 6. Tier Stats
      const tiers = {
          Bronze: this.users.filter(u => u.tier === 'Bronze').length,
          Silver: this.users.filter(u => u.tier === 'Silver').length,
          Gold: this.users.filter(u => u.tier === 'Gold').length,
          Diamond: this.users.filter(u => u.tier === 'Diamond').length,
      };

      return {
          total_users: this.users.length,
          active_users: activeUsers,
          inactive_users: inactiveUsers,
          frozen_users: frozenUsers,
          new_users_today: todayUsers,
          
          total_revenue: adRevenue + taskRevenue + surveyRevenue,
          revenue_breakdown: { ads: adRevenue, tasks: taskRevenue, surveys: surveyRevenue },
          
          total_money_users: totalUserBalance, // Distributed
          
          riget_supply: {
              total: totalCap,
              distributed: distributed,
              remaining: remaining
          },
          
          pending_withdrawals: pendingWithdrawals.length,
          pending_withdrawals_value: pendingWithdrawals.reduce((s, w) => s + Number(w.amount), 0),
          
          confirmed_withdraw: totalWithdrawnRGT,
          confirmed_withdraw_count: confirmedWithdrawals.length,
          
          rejected_withdraw: rejectedWithdrawals.reduce((s, w) => s + Number(w.amount), 0),
          rejected_withdraw_count: rejectedWithdrawals.length,
          
          withdrawal_breakdown: { methods },
          
          company_revenues: this.companies.map(c => ({
              name: c.name,
              amount: Number(c.amount)
          })),
          
          tiers
      };
  }
}

export const mockDb = new MockDatabase();