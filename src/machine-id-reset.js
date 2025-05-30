// 机器码重置功能模块
// 基于cursor-free-everyday项目的实现原理

class MachineIdReset {
  constructor() {
    this.platforms = {
      cursor: {
        name: 'Cursor',
        configPaths: {
          windows: '%APPDATA%\\Cursor\\User\\globalStorage\\storage.json',
          mac: '~/Library/Application Support/Cursor/User/globalStorage/storage.json',
          linux: '~/.config/Cursor/User/globalStorage/storage.json'
        },
        machineIdKeys: [
          'telemetry.machineId',
          'telemetry.macMachineId', 
          'telemetry.devDeviceId',
          'telemetry.sqmId'
        ]
      },
      augment: {
        name: 'Augment',
        configPaths: {
          windows: '%APPDATA%\\augment\\User\\globalStorage\\storage.json',
          mac: '~/Library/Application Support/augment/User/globalStorage/storage.json',
          linux: '~/.config/augment/User/globalStorage/storage.json'
        },
        machineIdKeys: [
          'telemetry.machineId',
          'telemetry.macMachineId',
          'telemetry.devDeviceId'
        ]
      }
    };
  }

  // 生成随机机器码
  generateRandomMachineId() {
    const chars = '0123456789abcdef';
    let result = '';
    
    // 生成标准格式的机器码: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const pattern = [8, 4, 4, 4, 12];
    
    for (let i = 0; i < pattern.length; i++) {
      if (i > 0) result += '-';
      for (let j = 0; j < pattern[i]; j++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }

  // 生成MAC地址格式的机器码
  generateMacMachineId() {
    const chars = '0123456789abcdef';
    let result = '';
    
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 2 === 0) result += ':';
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return result;
  }

  // 检测操作系统
  detectOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'mac';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
  }

  // 生成重置脚本内容
  generateResetScript(platform, os) {
    const platformConfig = this.platforms[platform];
    if (!platformConfig) {
      throw new Error(`不支持的平台: ${platform}`);
    }

    const configPath = platformConfig.configPaths[os];
    if (!configPath) {
      throw new Error(`不支持的操作系统: ${os}`);
    }

    const newMachineId = this.generateRandomMachineId();
    const newMacMachineId = this.generateMacMachineId();
    const newDevDeviceId = this.generateRandomMachineId();
    const newSqmId = this.generateRandomMachineId();

    let script = '';
    
    if (os === 'windows') {
      script = this.generateWindowsScript(platform, configPath, {
        machineId: newMachineId,
        macMachineId: newMacMachineId,
        devDeviceId: newDevDeviceId,
        sqmId: newSqmId
      });
    } else if (os === 'mac' || os === 'linux') {
      script = this.generateUnixScript(platform, configPath, {
        machineId: newMachineId,
        macMachineId: newMacMachineId,
        devDeviceId: newDevDeviceId
      });
    }

    return {
      script,
      platform: platformConfig.name,
      os,
      newIds: {
        machineId: newMachineId,
        macMachineId: newMacMachineId,
        devDeviceId: newDevDeviceId,
        sqmId: newSqmId
      }
    };
  }

  // 生成Windows脚本
  generateWindowsScript(platform, configPath, ids) {
    return `@echo off
chcp 65001 >nul
echo ========================================
echo ${platform.toUpperCase()} 机器码重置工具
echo ========================================
echo.

echo 正在检查 ${platform.toUpperCase()} 是否运行中...
tasklist /FI "IMAGENAME eq ${platform}.exe" 2>NUL | find /I /N "${platform}.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo 检测到 ${platform.toUpperCase()} 正在运行，正在关闭...
    taskkill /F /IM "${platform}.exe" >nul 2>&1
    timeout /t 3 >nul
    echo ${platform.toUpperCase()} 已关闭
) else (
    echo ${platform.toUpperCase()} 未运行
)
echo.

set "config_file=${configPath}"
echo 配置文件路径: %config_file%

if not exist "%config_file%" (
    echo 错误: 配置文件不存在！
    echo 请确保 ${platform.toUpperCase()} 已安装并至少运行过一次
    pause
    exit /b 1
)

echo 正在备份原配置文件...
copy "%config_file%" "%config_file%.backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul
echo 备份完成
echo.

echo 正在重置机器码...
powershell -Command "& {
    $json = Get-Content '%config_file%' | ConvertFrom-Json;
    $json.'telemetry.machineId' = '${ids.machineId}';
    $json.'telemetry.macMachineId' = '${ids.macMachineId}';
    $json.'telemetry.devDeviceId' = '${ids.devDeviceId}';
    $json.'telemetry.sqmId' = '${ids.sqmId}';
    $json | ConvertTo-Json -Depth 100 | Set-Content '%config_file%' -Encoding UTF8
}"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo 机器码重置成功！
    echo ========================================
    echo 新的机器码信息:
    echo Machine ID: ${ids.machineId}
    echo Mac Machine ID: ${ids.macMachineId}
    echo Dev Device ID: ${ids.devDeviceId}
    echo SQM ID: ${ids.sqmId}
    echo.
    echo 请重新启动 ${platform.toUpperCase()} 以使更改生效
    echo ========================================
) else (
    echo 错误: 机器码重置失败！
    echo 请检查配置文件权限或手动编辑
)

echo.
echo 按任意键退出...
pause >nul`;
  }

  // 生成Unix脚本 (Mac/Linux)
  generateUnixScript(platform, configPath, ids) {
    const realPath = configPath.replace('~', '$HOME');
    return `#!/bin/bash

echo "========================================"
echo "${platform.toUpperCase()} 机器码重置工具"
echo "========================================"
echo

echo "正在检查 ${platform.toUpperCase()} 是否运行中..."
if pgrep -x "${platform}" > /dev/null; then
    echo "检测到 ${platform.toUpperCase()} 正在运行，正在关闭..."
    pkill -x "${platform}"
    sleep 3
    echo "${platform.toUpperCase()} 已关闭"
else
    echo "${platform.toUpperCase()} 未运行"
fi
echo

CONFIG_FILE="${realPath}"
echo "配置文件路径: $CONFIG_FILE"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "错误: 配置文件不存在！"
    echo "请确保 ${platform.toUpperCase()} 已安装并至少运行过一次"
    exit 1
fi

echo "正在备份原配置文件..."
cp "$CONFIG_FILE" "$CONFIG_FILE.backup_$(date +%Y%m%d_%H%M%S)"
echo "备份完成"
echo

echo "正在重置机器码..."

# 使用 Python 或 Node.js 来处理 JSON
if command -v python3 &> /dev/null; then
    python3 -c "
import json
import sys

try:
    with open('$CONFIG_FILE', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data['telemetry.machineId'] = '${ids.machineId}'
    data['telemetry.macMachineId'] = '${ids.macMachineId}'
    data['telemetry.devDeviceId'] = '${ids.devDeviceId}'
    
    with open('$CONFIG_FILE', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print('机器码重置成功！')
except Exception as e:
    print(f'错误: {e}')
    sys.exit(1)
"
else
    echo "错误: 需要 Python3 来处理 JSON 文件"
    echo "请安装 Python3 或手动编辑配置文件"
    exit 1
fi

echo
echo "========================================"
echo "机器码重置成功！"
echo "========================================"
echo "新的机器码信息:"
echo "Machine ID: ${ids.machineId}"
echo "Mac Machine ID: ${ids.macMachineId}"
echo "Dev Device ID: ${ids.devDeviceId}"
echo
echo "请重新启动 ${platform.toUpperCase()} 以使更改生效"
echo "========================================"`;
  }

  // 下载脚本文件
  downloadScript(platform, os) {
    try {
      const result = this.generateResetScript(platform, os);
      const filename = `${platform}_machine_id_reset_${os}.${os === 'windows' ? 'bat' : 'sh'}`;
      
      const blob = new Blob([result.script], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        filename,
        ...result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取使用说明
  getInstructions(platform, os) {
    const instructions = {
      windows: [
        '1. 下载生成的 .bat 脚本文件',
        '2. 右键点击脚本文件，选择"以管理员身份运行"',
        '3. 等待脚本执行完成',
        '4. 重新启动 ' + platform.toUpperCase() + ' 应用程序',
        '5. 现在可以重新注册账号获得新的免费额度'
      ],
      mac: [
        '1. 下载生成的 .sh 脚本文件',
        '2. 打开终端，进入脚本所在目录',
        '3. 运行命令: chmod +x ' + platform + '_machine_id_reset_mac.sh',
        '4. 运行命令: sudo ./' + platform + '_machine_id_reset_mac.sh',
        '5. 输入管理员密码',
        '6. 重新启动 ' + platform.toUpperCase() + ' 应用程序',
        '7. 现在可以重新注册账号获得新的免费额度'
      ],
      linux: [
        '1. 下载生成的 .sh 脚本文件',
        '2. 打开终端，进入脚本所在目录',
        '3. 运行命令: chmod +x ' + platform + '_machine_id_reset_linux.sh',
        '4. 运行命令: ./' + platform + '_machine_id_reset_linux.sh',
        '5. 重新启动 ' + platform.toUpperCase() + ' 应用程序',
        '6. 现在可以重新注册账号获得新的免费额度'
      ]
    };
    
    return instructions[os] || [];
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MachineIdReset;
} else {
  window.MachineIdReset = MachineIdReset;
}