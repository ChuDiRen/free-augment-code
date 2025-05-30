// 后台脚本，用于管理扩展的生命周期


// 导入模块
importScripts('machine-id-reset.js', 'account-manager.js');

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background收到消息:', message);
  
  switch (message.action) {
    case 'autoRegister':
      handleAutoRegister(message.platform, sendResponse);
      return true; // 保持消息通道开放
      
    case 'resetMachineId':
      handleResetMachineId(message.platform, sendResponse);
      return true;
      
    case 'openAccountManager':
      handleOpenAccountManager(message.platform, sendResponse);
      return true;
      
    default:
      console.log('未知消息类型:', message.action);
  }
});

// 处理自动注册
async function handleAutoRegister(platform, sendResponse) {
  try {
    const accountManager = new AccountManager();
    const result = await accountManager.autoRegister(platform);
    
    if (result.success) {
      sendResponse({ success: true, account: result.account });
    } else {
      sendResponse({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('自动注册失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 处理机器码重置
async function handleResetMachineId(platform, sendResponse) {
  try {
    const machineIdReset = new MachineIdReset();
    const result = await machineIdReset.generateResetScript(platform);
    
    if (result.success) {
      // 下载脚本文件
      const blob = new Blob([result.scriptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      chrome.downloads.download({
        url: url,
        filename: result.filename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ 
            success: true, 
            downloadId: downloadId,
            instructions: result.instructions
          });
        }
        URL.revokeObjectURL(url);
      });
    } else {
      sendResponse({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('生成机器码重置脚本失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 处理打开账号管理
async function handleOpenAccountManager(platform, sendResponse) {
  try {
    // 创建新标签页打开账号管理页面
    chrome.tabs.create({
      url: chrome.runtime.getURL('account-manager.html')
    }, (tab) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, tabId: tab.id });
      }
    });
  } catch (error) {
    console.error('打开账号管理失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Cursor & Augment 免费助手已安装/更新');
  
  if (details.reason === 'install') {
    // 首次安装时的初始化
    chrome.storage.sync.set({
      emailDomain: 'gmail.com',
      randomLength: 8
    });
  }
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 检查是否是目标网站
    const targetUrls = [
      'https://accounts.cursor.sh',
      'https://www.augment.dev/login',
      'https://www.augment.dev/signup'
    ];
    
    const isTargetSite = targetUrls.some(url => tab.url.includes(url));
    
    if (isTargetSite) {
      console.log('检测到目标网站:', tab.url);
      // 可以在这里添加额外的逻辑
    }
  }
});
