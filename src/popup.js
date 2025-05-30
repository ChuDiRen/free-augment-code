document.addEventListener('DOMContentLoaded', function() {
  const emailDomainInput = document.getElementById('emailDomain');
  const randomLengthInput = document.getElementById('randomLength');
  const tempEmailServiceSelect = document.getElementById('tempEmailService');
  const saveBtn = document.getElementById('saveBtn');
  const openAccountManagerBtn = document.getElementById('openAccountManager');
  const resetMachineIdBtn = document.getElementById('resetMachineId');
  const statusDiv = document.getElementById('status');
  const increaseBtn = document.getElementById('increaseBtn');
  const decreaseBtn = document.getElementById('decreaseBtn');
  const totalAccountsSpan = document.getElementById('totalAccounts');
  const todayRegistrationsSpan = document.getElementById('todayRegistrations');

  // 初始化
  init();

  async function init() {
    await loadSettings();
    await loadStats();
  }

  // 加载已保存的设置
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'emailDomain', 
        'randomLength', 
        'tempEmailService'
      ]);
      
      emailDomainInput.value = result.emailDomain || 'gmail.com';
      randomLengthInput.value = result.randomLength || 8;
      tempEmailServiceSelect.value = result.tempEmailService || '10minutemail';
    } catch (error) {
      console.error('加载设置失败:', error);
      showStatus('加载设置失败', 'error');
    }
  }

  // 加载统计数据
  async function loadStats() {
    try {
      const accounts = await chrome.storage.local.get(['cursorAccounts', 'augmentAccounts']);
      const stats = await chrome.storage.local.get(['todayRegistrations']);
      
      const cursorCount = (accounts.cursorAccounts || []).length;
      const augmentCount = (accounts.augmentAccounts || []).length;
      const totalCount = cursorCount + augmentCount;
      
      const today = new Date().toDateString();
      const todayRegs = (stats.todayRegistrations || {})[today] || 0;
      
      totalAccountsSpan.textContent = totalCount;
      todayRegistrationsSpan.textContent = todayRegs;
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  }

  // 增加按钮事件
  increaseBtn.addEventListener('click', function() {
    let currentVal = parseInt(randomLengthInput.value) || 8;
    if (currentVal < 20) {
      currentVal++;
      randomLengthInput.value = currentVal;
    }
  });

  // 减少按钮事件
  decreaseBtn.addEventListener('click', function() {
    let currentVal = parseInt(randomLengthInput.value) || 8;
    if (currentVal > 6) {
      currentVal--;
      randomLengthInput.value = currentVal;
    }
  });

  // 保存设置
  saveBtn.addEventListener('click', async function() {
    try {
      const emailDomain = emailDomainInput.value.trim();
      const randomLength = parseInt(randomLengthInput.value) || 8;
      const tempEmailService = tempEmailServiceSelect.value;

      // 验证输入
      if (!emailDomain) {
        showStatus('请输入邮箱域名', 'error');
        return;
      }

      if (randomLength < 6 || randomLength > 20) {
        showStatus('随机字符长度必须在6-20之间', 'error');
        return;
      }

      // 保存到Chrome存储
      await chrome.storage.sync.set({
        emailDomain: emailDomain,
        randomLength: randomLength,
        tempEmailService: tempEmailService
      });
      
      showStatus('设置已保存', 'success');
    } catch (error) {
      console.error('保存设置失败:', error);
      showStatus('保存失败: ' + error.message, 'error');
    }
  });

  // 打开账号管理
  openAccountManagerBtn.addEventListener('click', async function() {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('account-manager.html')
      });
      window.close();
    } catch (error) {
      console.error('打开账号管理失败:', error);
      showStatus('打开账号管理失败', 'error');
    }
  });

  // 重置机器码
  resetMachineIdBtn.addEventListener('click', async function() {
    try {
      showStatus('正在生成重置脚本...', 'info');
      
      const response = await chrome.runtime.sendMessage({
        action: 'resetMachineId',
        platform: 'cursor' // 默认重置Cursor机器码
      });
      
      if (response && response.success) {
        showStatus('重置脚本已下载！', 'success');
        
        // 显示使用说明
        setTimeout(() => {
          const instructions = response.instructions.join('\n');
          alert(`机器码重置脚本使用说明:\n\n${instructions}`);
        }, 1000);
      } else {
        showStatus('生成重置脚本失败: ' + (response?.error || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('重置机器码失败:', error);
      showStatus('重置机器码失败: ' + error.message, 'error');
    }
  });

  // 显示状态消息
  function showStatus(message, type = 'info') {
    statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
    
    // 3秒后清除消息
    setTimeout(() => {
      statusDiv.innerHTML = '';
    }, 3000);
  }

  // 监听存储变化，实时更新统计
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.cursorAccounts || changes.augmentAccounts || changes.todayRegistrations)) {
      loadStats();
    }
  });
});
