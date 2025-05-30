// 自动账号管理模块
// 实现自动注册、账号轮换、邮箱管理等功能

class AccountManager {
  constructor() {
    this.emailProviders = [
      // 临时邮箱服务提供商
      { name: '10minutemail', domain: '10minutemail.com', api: null },
      { name: 'tempmail', domain: 'tempmail.org', api: null },
      { name: 'guerrillamail', domain: 'guerrillamail.com', api: 'https://api.guerrillamail.com/ajax.php' },
      { name: 'mailinator', domain: 'mailinator.com', api: null },
      // 自定义邮箱后缀（用户配置）
      { name: 'custom', domain: '', api: null }
    ];
    
    this.platforms = {
      cursor: {
        name: 'Cursor',
        loginUrl: 'https://www.cursor.com/sign-in',
        signupUrl: 'https://www.cursor.com/sign-up',
        deleteAccountUrl: 'https://www.cursor.com/settings/account',
        selectors: {
          emailInput: 'input[type="email"], input[name="email"], input[placeholder*="email" i]',
          passwordInput: 'input[type="password"], input[name="password"]',
          submitButton: 'button[type="submit"], button:contains("Sign"), button:contains("Continue")',
          deleteButton: 'button:contains("Delete"), button:contains("Remove")',
          confirmDelete: 'button:contains("Confirm"), button:contains("Yes")'
        }
      },
      augment: {
        name: 'Augment',
        loginUrl: 'https://login.augmentcode.com/u/login/identifier',
        signupUrl: 'https://login.augmentcode.com/u/signup',
        deleteAccountUrl: 'https://www.augmentcode.com/settings',
        selectors: {
          emailInput: 'input[name="username"], input[name="email"]',
          passwordInput: 'input[name="password"]',
          submitButton: 'button[name="action"][value="default"], button[type="submit"]',
          deleteButton: 'button:contains("Delete"), button:contains("Remove")',
          confirmDelete: 'button:contains("delete"), input[value="delete"]'
        }
      }
    };
    
    this.accountHistory = [];
    this.currentAccount = null;
    this.loadAccountHistory();
  }

  // 生成随机用户名
  generateRandomUsername(length = 12) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // 确保第一个字符是字母
    result += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    
    for (let i = 1; i < length; i++) {
      result += characters[Math.floor(Math.random() * characters.length)];
    }
    
    return result;
  }

  // 生成随机密码
  generateRandomPassword(length = 16) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // 确保密码包含各种类型的字符
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // 填充剩余长度
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // 打乱密码字符顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // 生成临时邮箱
  async generateTempEmail(provider = 'custom') {
    try {
      if (provider === 'custom') {
        // 使用用户自定义的邮箱后缀
        const settings = await this.getStoredSettings();
        if (!settings.emailDomain) {
          throw new Error('请先在设置中配置邮箱后缀');
        }
        
        const username = this.generateRandomUsername(settings.randomLength || 12);
        return `${username}@${settings.emailDomain}`;
      }
      
      // 使用临时邮箱服务
      const providerConfig = this.emailProviders.find(p => p.name === provider);
      if (!providerConfig) {
        throw new Error(`不支持的邮箱提供商: ${provider}`);
      }
      
      if (providerConfig.api) {
        // 通过API获取临时邮箱
        return await this.getTempEmailFromAPI(providerConfig);
      } else {
        // 生成随机邮箱
        const username = this.generateRandomUsername();
        return `${username}@${providerConfig.domain}`;
      }
    } catch (error) {
      console.error('生成临时邮箱失败:', error);
      throw error;
    }
  }

  // 通过API获取临时邮箱
  async getTempEmailFromAPI(providerConfig) {
    try {
      if (providerConfig.name === 'guerrillamail') {
        const response = await fetch(`${providerConfig.api}?f=get_email_address`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.email_addr;
        }
      }
      
      throw new Error('API调用失败');
    } catch (error) {
      console.error('API获取邮箱失败:', error);
      // 降级到随机生成
      const username = this.generateRandomUsername();
      return `${username}@${providerConfig.domain}`;
    }
  }

  // 创建新账号
  async createNewAccount(platform, emailProvider = 'custom') {
    try {
      const email = await this.generateTempEmail(emailProvider);
      const password = this.generateRandomPassword();
      
      const account = {
        id: Date.now().toString(),
        platform,
        email,
        password,
        createdAt: new Date().toISOString(),
        status: 'created',
        usageCount: 0,
        lastUsed: null
      };
      
      this.accountHistory.push(account);
      this.currentAccount = account;
      await this.saveAccountHistory();
      
      return account;
    } catch (error) {
      console.error('创建账号失败:', error);
      throw error;
    }
  }

  // 自动注册账号
  async autoRegister(platform) {
    try {
      const account = await this.createNewAccount(platform);
      const platformConfig = this.platforms[platform];
      
      if (!platformConfig) {
        throw new Error(`不支持的平台: ${platform}`);
      }
      
      // 打开注册页面
      const tab = await this.openTab(platformConfig.signupUrl);
      
      // 等待页面加载
      await this.sleep(2000);
      
      // 自动填写表单
      const result = await this.fillRegistrationForm(tab.id, platformConfig, account);
      
      if (result.success) {
        account.status = 'registered';
        await this.saveAccountHistory();
        
        return {
          success: true,
          account,
          message: '账号注册成功'
        };
      } else {
        account.status = 'failed';
        await this.saveAccountHistory();
        
        return {
          success: false,
          error: result.error,
          message: '账号注册失败'
        };
      }
    } catch (error) {
      console.error('自动注册失败:', error);
      return {
        success: false,
        error: error.message,
        message: '自动注册过程中出现错误'
      };
    }
  }

  // 填写注册表单
  async fillRegistrationForm(tabId, platformConfig, account) {
    try {
      // 注入内容脚本来填写表单
      const result = await chrome.tabs.sendMessage(tabId, {
        action: 'fillRegistrationForm',
        data: {
          selectors: platformConfig.selectors,
          account: account
        }
      });
      
      return result;
    } catch (error) {
      console.error('填写表单失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 删除账号
  async deleteAccount(platform, account) {
    try {
      const platformConfig = this.platforms[platform];
      
      if (!platformConfig) {
        throw new Error(`不支持的平台: ${platform}`);
      }
      
      // 打开账号设置页面
      const tab = await this.openTab(platformConfig.deleteAccountUrl);
      
      // 等待页面加载
      await this.sleep(2000);
      
      // 执行删除操作
      const result = await this.executeAccountDeletion(tab.id, platformConfig, account);
      
      if (result.success) {
        // 更新账号状态
        const accountIndex = this.accountHistory.findIndex(a => a.id === account.id);
        if (accountIndex !== -1) {
          this.accountHistory[accountIndex].status = 'deleted';
          this.accountHistory[accountIndex].deletedAt = new Date().toISOString();
        }
        
        await this.saveAccountHistory();
        
        return {
          success: true,
          message: '账号删除成功'
        };
      } else {
        return {
          success: false,
          error: result.error,
          message: '账号删除失败'
        };
      }
    } catch (error) {
      console.error('删除账号失败:', error);
      return {
        success: false,
        error: error.message,
        message: '删除账号过程中出现错误'
      };
    }
  }

  // 执行账号删除
  async executeAccountDeletion(tabId, platformConfig, account) {
    try {
      const result = await chrome.tabs.sendMessage(tabId, {
        action: 'deleteAccount',
        data: {
          selectors: platformConfig.selectors,
          account: account
        }
      });
      
      return result;
    } catch (error) {
      console.error('执行删除失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取可用账号
  getAvailableAccounts(platform) {
    return this.accountHistory.filter(account => 
      account.platform === platform && 
      account.status === 'registered' &&
      account.usageCount < 3 // 限制每个账号最多使用3次
    );
  }

  // 获取下一个可用账号
  getNextAvailableAccount(platform) {
    const availableAccounts = this.getAvailableAccounts(platform);
    
    if (availableAccounts.length === 0) {
      return null;
    }
    
    // 按使用次数和最后使用时间排序
    availableAccounts.sort((a, b) => {
      if (a.usageCount !== b.usageCount) {
        return a.usageCount - b.usageCount;
      }
      
      if (!a.lastUsed) return -1;
      if (!b.lastUsed) return 1;
      
      return new Date(a.lastUsed) - new Date(b.lastUsed);
    });
    
    return availableAccounts[0];
  }

  // 使用账号
  async useAccount(accountId) {
    const accountIndex = this.accountHistory.findIndex(a => a.id === accountId);
    
    if (accountIndex !== -1) {
      this.accountHistory[accountIndex].usageCount++;
      this.accountHistory[accountIndex].lastUsed = new Date().toISOString();
      this.currentAccount = this.accountHistory[accountIndex];
      
      await this.saveAccountHistory();
      
      return this.accountHistory[accountIndex];
    }
    
    return null;
  }

  // 打开新标签页
  async openTab(url) {
    return new Promise((resolve, reject) => {
      chrome.tabs.create({ url }, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(tab);
        }
      });
    });
  }

  // 延时函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取存储的设置
  async getStoredSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['emailDomain', 'randomLength'], (result) => {
        resolve(result);
      });
    });
  }

  // 保存账号历史
  async saveAccountHistory() {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        accountHistory: this.accountHistory,
        currentAccount: this.currentAccount
      }, () => {
        resolve();
      });
    });
  }

  // 加载账号历史
  async loadAccountHistory() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['accountHistory', 'currentAccount'], (result) => {
        this.accountHistory = result.accountHistory || [];
        this.currentAccount = result.currentAccount || null;
        resolve();
      });
    });
  }

  // 清理过期账号
  async cleanupExpiredAccounts() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    this.accountHistory = this.accountHistory.filter(account => {
      const createdAt = new Date(account.createdAt);
      return createdAt > thirtyDaysAgo;
    });
    
    await this.saveAccountHistory();
  }

  // 获取账号统计信息
  getAccountStats() {
    const stats = {
      total: this.accountHistory.length,
      byPlatform: {},
      byStatus: {},
      available: 0
    };
    
    this.accountHistory.forEach(account => {
      // 按平台统计
      if (!stats.byPlatform[account.platform]) {
        stats.byPlatform[account.platform] = 0;
      }
      stats.byPlatform[account.platform]++;
      
      // 按状态统计
      if (!stats.byStatus[account.status]) {
        stats.byStatus[account.status] = 0;
      }
      stats.byStatus[account.status]++;
      
      // 可用账号统计
      if (account.status === 'registered' && account.usageCount < 3) {
        stats.available++;
      }
    });
    
    return stats;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccountManager;
} else {
  window.AccountManager = AccountManager;
}