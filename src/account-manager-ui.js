// 账号管理UI脚本
class AccountManagerUI {
    constructor() {
        this.currentTab = 'cursor';
        this.accounts = {
            cursor: [],
            augment: []
        };
        this.init();
    }

    init() {
        this.setupTabs();
        this.loadSettings();
        this.loadAccounts();
        this.loadStats();
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // 更新标签状态
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新内容面板
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
    }

    async loadAccounts() {
        try {
            // 从Chrome存储加载账号数据
            const result = await chrome.storage.local.get(['cursorAccounts', 'augmentAccounts']);
            
            this.accounts.cursor = result.cursorAccounts || [];
            this.accounts.augment = result.augmentAccounts || [];

            this.renderAccounts('cursor');
            this.renderAccounts('augment');
            this.updateStats();
        } catch (error) {
            console.error('加载账号失败:', error);
            this.showAlert('加载账号失败: ' + error.message, 'error');
        }
    }

    renderAccounts(platform) {
        const container = document.getElementById(`${platform}-accounts`);
        const accounts = this.accounts[platform];

        if (accounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>暂无${platform.toUpperCase()}账号</h3>
                    <p>点击"创建新账号"开始添加账号</p>
                </div>
            `;
            return;
        }

        const accountsHtml = accounts.map((account, index) => {
            const status = this.getAccountStatus(account);
            const statusClass = `status-${status.type}`;
            
            return `
                <div class="account-item">
                    <div class="account-info">
                        <div class="account-email">${account.email}</div>
                        <div class="account-meta">
                            创建时间: ${new Date(account.createdAt).toLocaleString()} | 
                            最后使用: ${account.lastUsed ? new Date(account.lastUsed).toLocaleString() : '从未使用'}
                        </div>
                    </div>
                    <span class="account-status ${statusClass}">${status.text}</span>
                    <button class="btn btn-primary" onclick="accountManagerUI.useAccount('${platform}', ${index})">使用</button>
                    <button class="btn btn-danger" onclick="accountManagerUI.deleteAccount('${platform}', ${index})">删除</button>
                </div>
            `;
        }).join('');

        container.innerHTML = accountsHtml;
    }

    getAccountStatus(account) {
        const now = Date.now();
        const createdAt = new Date(account.createdAt).getTime();
        const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);

        if (account.isExpired) {
            return { type: 'expired', text: '已过期' };
        } else if (daysSinceCreated > 30) {
            return { type: 'expired', text: '可能过期' };
        } else if (account.lastUsed && (now - new Date(account.lastUsed).getTime()) < 24 * 60 * 60 * 1000) {
            return { type: 'active', text: '活跃' };
        } else {
            return { type: 'pending', text: '待使用' };
        }
    }

    updateStats() {
        ['cursor', 'augment'].forEach(platform => {
            const accounts = this.accounts[platform];
            const total = accounts.length;
            const active = accounts.filter(acc => !this.getAccountStatus(acc).type === 'expired').length;
            const expired = accounts.filter(acc => this.getAccountStatus(acc).type === 'expired').length;

            document.getElementById(`${platform}-total`).textContent = total;
            document.getElementById(`${platform}-active`).textContent = active;
            document.getElementById(`${platform}-expired`).textContent = expired;
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'emailDomain',
                'randomLength',
                'autoRegisterInterval',
                'tempEmailService'
            ]);

            document.getElementById('emailDomain').value = result.emailDomain || 'gmail.com';
            document.getElementById('randomLength').value = result.randomLength || 8;
            document.getElementById('autoRegisterInterval').value = result.autoRegisterInterval || 60;
            document.getElementById('tempEmailService').value = result.tempEmailService || '10minutemail';
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    async loadStats() {
        try {
            const result = await chrome.storage.local.get([
                'totalRegistrations',
                'totalResets',
                'successfulRegistrations'
            ]);

            const totalRegistrations = result.totalRegistrations || 0;
            const totalResets = result.totalResets || 0;
            const successfulRegistrations = result.successfulRegistrations || 0;
            const successRate = totalRegistrations > 0 ? Math.round((successfulRegistrations / totalRegistrations) * 100) : 0;

            document.getElementById('total-registrations').textContent = totalRegistrations;
            document.getElementById('total-resets').textContent = totalResets;
            document.getElementById('success-rate').textContent = successRate + '%';
        } catch (error) {
            console.error('加载统计失败:', error);
        }
    }

    async useAccount(platform, index) {
        try {
            const account = this.accounts[platform][index];
            
            // 更新最后使用时间
            account.lastUsed = new Date().toISOString();
            await this.saveAccounts();
            
            // 复制邮箱到剪贴板
            await navigator.clipboard.writeText(account.email);
            
            this.showAlert(`账号 ${account.email} 已复制到剪贴板`, 'success');
            this.renderAccounts(platform);
        } catch (error) {
            console.error('使用账号失败:', error);
            this.showAlert('使用账号失败: ' + error.message, 'error');
        }
    }

    async deleteAccount(platform, index) {
        if (confirm('确定要删除这个账号吗？')) {
            try {
                this.accounts[platform].splice(index, 1);
                await this.saveAccounts();
                this.renderAccounts(platform);
                this.updateStats();
                this.showAlert('账号已删除', 'success');
            } catch (error) {
                console.error('删除账号失败:', error);
                this.showAlert('删除账号失败: ' + error.message, 'error');
            }
        }
    }

    async saveAccounts() {
        await chrome.storage.local.set({
            cursorAccounts: this.accounts.cursor,
            augmentAccounts: this.accounts.augment
        });
    }

    showAlert(message, type = 'info') {
        // 移除现有的alert
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // 创建新的alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // 插入到容器顶部
        const container = document.querySelector('.tab-content');
        container.insertBefore(alert, container.firstChild);

        // 3秒后自动移除
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 3000);
    }
}

// 全局函数
let accountManagerUI;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    accountManagerUI = new AccountManagerUI();
});

// 创建新账号
async function createNewAccount(platform) {
    try {
        accountManagerUI.showAlert('正在创建新账号...', 'info');
        
        // 发送消息给后台脚本
        const response = await chrome.runtime.sendMessage({
            action: 'autoRegister',
            platform: platform
        });
        
        if (response && response.success) {
            // 添加到本地账号列表
            const newAccount = {
                email: response.account.email,
                password: response.account.password,
                createdAt: new Date().toISOString(),
                lastUsed: null,
                isExpired: false
            };
            
            accountManagerUI.accounts[platform].push(newAccount);
            await accountManagerUI.saveAccounts();
            
            accountManagerUI.renderAccounts(platform);
            accountManagerUI.updateStats();
            accountManagerUI.showAlert('新账号创建成功！', 'success');
            
            // 更新统计
            const stats = await chrome.storage.local.get(['totalRegistrations', 'successfulRegistrations']);
            await chrome.storage.local.set({
                totalRegistrations: (stats.totalRegistrations || 0) + 1,
                successfulRegistrations: (stats.successfulRegistrations || 0) + 1
            });
            accountManagerUI.loadStats();
        } else {
            accountManagerUI.showAlert('创建账号失败: ' + (response?.error || '未知错误'), 'error');
            
            // 更新失败统计
            const stats = await chrome.storage.local.get(['totalRegistrations']);
            await chrome.storage.local.set({
                totalRegistrations: (stats.totalRegistrations || 0) + 1
            });
            accountManagerUI.loadStats();
        }
    } catch (error) {
        console.error('创建账号失败:', error);
        accountManagerUI.showAlert('创建账号失败: ' + error.message, 'error');
    }
}

// 刷新账号列表
function refreshAccounts(platform) {
    accountManagerUI.loadAccounts();
    accountManagerUI.showAlert('账号列表已刷新', 'success');
}

// 清理过期账号
async function clearExpiredAccounts(platform) {
    if (confirm('确定要清理所有过期账号吗？')) {
        try {
            const beforeCount = accountManagerUI.accounts[platform].length;
            accountManagerUI.accounts[platform] = accountManagerUI.accounts[platform].filter(account => {
                return accountManagerUI.getAccountStatus(account).type !== 'expired';
            });
            const afterCount = accountManagerUI.accounts[platform].length;
            const removedCount = beforeCount - afterCount;
            
            await accountManagerUI.saveAccounts();
            accountManagerUI.renderAccounts(platform);
            accountManagerUI.updateStats();
            
            accountManagerUI.showAlert(`已清理 ${removedCount} 个过期账号`, 'success');
        } catch (error) {
            console.error('清理过期账号失败:', error);
            accountManagerUI.showAlert('清理失败: ' + error.message, 'error');
        }
    }
}

// 保存设置
async function saveSettings() {
    try {
        const settings = {
            emailDomain: document.getElementById('emailDomain').value,
            randomLength: parseInt(document.getElementById('randomLength').value),
            autoRegisterInterval: parseInt(document.getElementById('autoRegisterInterval').value),
            tempEmailService: document.getElementById('tempEmailService').value
        };
        
        await chrome.storage.sync.set(settings);
        accountManagerUI.showAlert('设置已保存', 'success');
    } catch (error) {
        console.error('保存设置失败:', error);
        accountManagerUI.showAlert('保存设置失败: ' + error.message, 'error');
    }
}

// 重置设置
async function resetSettings() {
    if (confirm('确定要重置所有设置吗？')) {
        try {
            const defaultSettings = {
                emailDomain: 'gmail.com',
                randomLength: 8,
                autoRegisterInterval: 60,
                tempEmailService: '10minutemail'
            };
            
            await chrome.storage.sync.set(defaultSettings);
            accountManagerUI.loadSettings();
            accountManagerUI.showAlert('设置已重置', 'success');
        } catch (error) {
            console.error('重置设置失败:', error);
            accountManagerUI.showAlert('重置设置失败: ' + error.message, 'error');
        }
    }
}