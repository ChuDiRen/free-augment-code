// 检查当前URL是否匹配目标页面
function checkUrl() {
  const currentUrl = window.location.href;
  
  // 检测平台类型
  let platform = null;
  let pageType = null;
  
  if (currentUrl.includes('login.augmentcode.com')) {
    platform = 'augment';
    if (currentUrl.includes('/u/login/identifier')) {
      pageType = 'login';
    } else if (currentUrl.includes('/u/signup')) {
      pageType = 'signup';
    }
  } else if (currentUrl.includes('cursor.com') || currentUrl.includes('auth.cursor.sh')) {
    platform = 'cursor';
    if (currentUrl.includes('sign-in') || currentUrl.includes('login')) {
      pageType = 'login';
    } else if (currentUrl.includes('sign-up') || currentUrl.includes('signup')) {
      pageType = 'signup';
    }
  }
  
  if (platform && pageType) {
    console.log(`免费助手: 检测到${platform.toUpperCase()}${pageType === 'login' ? '登录' : '注册'}页面`);
    
    // 检查按钮是否已存在
    if (!document.querySelector('.free-helper-buttons-added')) {
      addHelperButtons(platform, pageType);
    }
  }
}

// 添加助手按钮
function addHelperButtons(platform, pageType) {
  // 等待页面元素加载
  const checkExist = setInterval(() => {
    let targetElement = null;
    
    // 根据平台和页面类型查找目标元素
    if (platform === 'augment') {
      targetElement = document.querySelector('button[name="action"][value="default"]') || 
                     document.querySelector('button[type="submit"]');
    } else if (platform === 'cursor') {
      targetElement = document.querySelector('button[type="submit"]') || 
                     document.querySelector('button:contains("Continue")');
    }

    if (targetElement && !document.querySelector('.free-helper-buttons-added')) {
      clearInterval(checkExist);

      // 创建按钮容器
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'free-helper-buttons-added';
      buttonContainer.style.cssText = `
        margin-top: 10px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      `;

      // 创建续杯按钮
      const refillButton = createHelperButton('🔄 续杯', 'refill', platform);
      refillButton.addEventListener('click', () => handleRefill(platform));

      // 创建自动注册按钮
      const autoRegisterButton = createHelperButton('🤖 自动注册', 'auto-register', platform);
      autoRegisterButton.addEventListener('click', () => handleAutoRegister(platform));

      // 创建机器码重置按钮
      const resetMachineIdButton = createHelperButton('🔧 重置机器码', 'reset-machine-id', platform);
      resetMachineIdButton.addEventListener('click', () => handleResetMachineId(platform));

      // 创建账号管理按钮
      const accountManagerButton = createHelperButton('👥 账号管理', 'account-manager', platform);
      accountManagerButton.addEventListener('click', () => handleAccountManager(platform));
      
      console.log(`免费助手: 已在${platform.toUpperCase()}页面添加助手按钮`);

      // 添加按钮到容器
      buttonContainer.appendChild(refillButton);
      buttonContainer.appendChild(autoRegisterButton);
      buttonContainer.appendChild(resetMachineIdButton);
      buttonContainer.appendChild(accountManagerButton);

      // 将容器插入到目标元素后面
      targetElement.parentNode.insertBefore(buttonContainer, targetElement.nextSibling);
      
      console.log(`免费助手: ${platform.toUpperCase()}助手按钮已添加`);
    }
  }, 500);
}

// 创建助手按钮
function createHelperButton(text, action, platform) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.className = `free-helper-btn free-helper-${action}`;
  button.dataset.action = action;
  button.dataset.platform = platform;
  
  // 设置按钮样式
  button.style.cssText = `
    padding: 8px 12px;
    font-size: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    min-width: 80px;
    text-align: center;
  `;
  
  // 添加悬停效果
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)';
    button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = 'none';
  });
  
  return button;
}

// 处理续杯按钮点击
function handleRefill(platform) {
  // 生成随机邮箱（现在返回Promise）
  generateRandomEmail().then(randomEmail => {
    console.log(`免费助手: 生成随机邮箱 ${randomEmail}`);

    // 根据平台查找邮箱输入框
    let emailInput = null;
    if (platform === 'augment') {
      emailInput = document.querySelector('input[name="username"]') || 
                  document.querySelector('input[name="email"]');
    } else if (platform === 'cursor') {
      emailInput = document.querySelector('input[type="email"]') || 
                  document.querySelector('input[name="email"]');
    }
    
    if (emailInput) {
      emailInput.value = randomEmail;
      // 触发input事件，确保表单验证能够识别值的变化
      const inputEvent = new Event('input', { bubbles: true });
      emailInput.dispatchEvent(inputEvent);
      
      // 触发change事件
      const changeEvent = new Event('change', { bubbles: true });
      emailInput.dispatchEvent(changeEvent);

      // 自动点击提交按钮，延迟1秒以确保表单验证有足够时间处理
      setTimeout(() => {
        let submitButton = null;
        if (platform === 'augment') {
          submitButton = document.querySelector('button[name="action"][value="default"]') ||
                        document.querySelector('button[type="submit"]');
        } else if (platform === 'cursor') {
          submitButton = document.querySelector('button[type="submit"]');
        }
        
        if (submitButton) {
          submitButton.click();
          console.log(`免费助手: 自动点击${platform.toUpperCase()}继续按钮`);
        }
      }, 1000);
    } else {
      showNotification('未找到邮箱输入框', 'error');
    }
  }).catch(error => {
    console.error('免费助手: 生成邮箱时出错', error);
    showNotification('生成邮箱失败: ' + error.message, 'error');
  });
}

// 处理自动注册
function handleAutoRegister(platform) {
  showNotification('正在准备自动注册...', 'info');
  
  // 发送消息给后台脚本
  chrome.runtime.sendMessage({
    action: 'autoRegister',
    platform: platform
  }, (response) => {
    if (response && response.success) {
      showNotification('自动注册成功！', 'success');
      console.log('自动注册结果:', response);
    } else {
      showNotification('自动注册失败: ' + (response?.error || '未知错误'), 'error');
    }
  });
}

// 处理机器码重置
function handleResetMachineId(platform) {
  showNotification('正在生成机器码重置脚本...', 'info');
  
  // 发送消息给后台脚本
  chrome.runtime.sendMessage({
    action: 'resetMachineId',
    platform: platform
  }, (response) => {
    if (response && response.success) {
      showNotification('机器码重置脚本已下载！', 'success');
      
      // 显示使用说明
      const instructions = response.instructions.join('\n');
      setTimeout(() => {
        alert(`机器码重置脚本使用说明:\n\n${instructions}`);
      }, 1000);
    } else {
      showNotification('生成重置脚本失败: ' + (response?.error || '未知错误'), 'error');
    }
  });
}

// 处理账号管理
function handleAccountManager(platform) {
  showNotification('正在打开账号管理...', 'info');
  
  // 发送消息给后台脚本
  chrome.runtime.sendMessage({
    action: 'openAccountManager',
    platform: platform
  }, (response) => {
    if (response && response.success) {
      showNotification('账号管理已打开', 'success');
    } else {
      showNotification('打开账号管理失败', 'error');
    }
  });
}

// 显示通知
function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `free-helper-notification free-helper-${type}`;
  notification.textContent = message;
  
  // 设置样式
  const colors = {
    info: '#2196F3',
    success: '#4CAF50',
    error: '#f44336',
    warning: '#FF9800'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 300px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-out;
  `;
  
  // 添加动画样式
  if (!document.querySelector('#free-helper-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'free-helper-notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 3秒后自动移除
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// 生成随机邮箱
function generateRandomEmail() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  // 从存储中获取邮箱后缀和随机字符串位数，如果没有则使用默认值
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['emailDomain', 'randomLength'], function(data) {
      // 检查是否设置了邮箱后缀
      if (!data.emailDomain) {
        // 如果没有设置邮箱后缀，则提示用户
        alert('请先在扩展设置中设置邮箱后缀！');
        reject(new Error('未设置邮箱后缀'));
        return;
      }

      const domain = data.emailDomain;
      // 使用设置的位数，默认为12位
      const length = data.randomLength ? parseInt(data.randomLength) : 12;

      // 生成随机字符串
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }

      resolve(result + '@' + domain);
    });
  });
}

// 创建一个标志，用于跟踪按钮是否已添加
let buttonAdded = false;

// 使用防抖函数来限制checkUrl的调用频率
function debounce(func, wait) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  };
}

// 防抖处理的checkUrl函数
const debouncedCheckUrl = debounce(checkUrl, 300);

// 在页面变化时检查URL，但使用更精确的选择器和配置
const observer = new MutationObserver((mutations) => {
  // 只有当按钮尚未添加时才继续检查
  if (!buttonAdded) {
    debouncedCheckUrl();
  }
});

// 使用更精确的配置来观察DOM变化
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
});

// 初始检查
setTimeout(checkUrl, 500);
