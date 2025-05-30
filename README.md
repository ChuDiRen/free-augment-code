# 🚀 Cursor & Augment 免费助手

一个强大的Chrome扩展，帮助您自动管理Cursor和Augment账号，实现无限制使用这些AI编程助手。

## ✨ 主要功能

### 🔄 自动账号管理
- **自动注册新账号**: 一键生成新的临时邮箱账号
- **账号轮换**: 智能管理多个账号，自动切换使用
- **账号状态监控**: 实时监控账号可用性和过期状态
- **批量账号操作**: 支持批量创建、删除和管理账号

### 🛠️ 机器码重置
- **一键重置机器码**: 自动生成重置脚本，解决设备限制问题
- **跨平台支持**: 支持Windows、macOS和Linux系统
- **智能检测**: 自动检测操作系统并生成对应的重置脚本
- **安全可靠**: 使用安全的方法重置设备标识

### 📧 智能邮箱生成
- **多服务支持**: 支持10MinuteMail、GuerrillaMail、TempMail等临时邮箱服务
- **自定义域名**: 支持使用自定义邮箱域名
- **随机生成**: 智能生成随机用户名，避免重复
- **自动填充**: 自动填充注册表单，无需手动操作

### 📊 数据统计
- **使用统计**: 记录注册次数、成功率等关键指标
- **账号统计**: 显示总账号数、可用账号数、过期账号数
- **实时监控**: 实时更新统计数据和账号状态

## 🎯 支持平台

- **Cursor**: AI代码编辑器 (https://cursor.sh)
- **Augment**: AI编程助手 (https://augment.dev)

## 📦 安装方法

### 方法一：开发者模式安装

1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，进入扩展管理页面 (`chrome://extensions/`)
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的`src`文件夹
6. 扩展安装完成！

### 方法二：打包安装

1. 在扩展管理页面点击"打包扩展程序"
2. 选择`src`文件夹进行打包
3. 安装生成的`.crx`文件

## 🚀 使用指南

### 基础设置

1. 点击扩展图标打开设置面板
2. 配置邮箱域名（默认：gmail.com）
3. 设置随机字符长度（6-20位）
4. 选择临时邮箱服务
5. 点击"保存设置"

### 自动注册账号

1. 访问Cursor或Augment的登录/注册页面
2. 页面会自动显示助手按钮
3. 点击"🆕 自动注册"按钮
4. 扩展会自动生成邮箱并完成注册
5. 新账号会自动保存到账号管理器

### 续杯功能

1. 在登录页面点击"🥤 续杯"按钮
2. 扩展会自动填充新的随机邮箱
3. 自动点击继续按钮完成操作

### 重置机器码

1. 点击"🔄 重置机器码"按钮
2. 扩展会自动下载重置脚本
3. 按照提示运行脚本即可重置设备标识

### 账号管理

1. 点击"📊 账号管理"打开管理界面
2. 查看所有已保存的账号
3. 可以使用、删除或批量管理账号
4. 查看账号状态和使用统计

## ⚙️ 高级配置

### 自定义邮箱域名

```
# 在设置中输入您的域名
example.com
yourdomain.org
```

### 临时邮箱服务配置

- **10 Minute Mail**: 提供10分钟有效期的临时邮箱
- **Guerrilla Mail**: 支持自定义域名的临时邮箱
- **Temp Mail**: 快速生成临时邮箱地址

### 机器码重置原理

扩展通过修改以下配置文件来重置机器码：

**Windows:**
```
%APPDATA%\Cursor\User\globalStorage\storage.json
%APPDATA%\augment\User\globalStorage\storage.json
```

**macOS:**
```
~/Library/Application Support/Cursor/User/globalStorage/storage.json
~/Library/Application Support/augment/User/globalStorage/storage.json
```

**Linux:**
```
~/.config/Cursor/User/globalStorage/storage.json
~/.config/augment/User/globalStorage/storage.json
```

## 🔧 技术实现

### 核心技术栈

- **Manifest V3**: 使用最新的Chrome扩展API
- **Content Scripts**: 页面内容注入和DOM操作
- **Background Scripts**: 后台任务处理和数据管理
- **Chrome Storage API**: 数据持久化存储
- **Chrome Downloads API**: 文件下载功能

### 项目结构

```
src/
├── manifest.json          # 扩展配置文件
├── background.js          # 后台脚本
├── content.js            # 内容脚本
├── popup.html            # 弹窗界面
├── popup.js              # 弹窗逻辑
├── account-manager.html  # 账号管理页面
├── account-manager-ui.js # 账号管理逻辑
├── account-manager.js    # 账号管理核心
└── machine-id-reset.js   # 机器码重置功能
```

### 核心模块

#### AccountManager 类
```javascript
// 账号管理核心功能
- generateRandomEmail()     // 生成随机邮箱
- autoRegister()           // 自动注册账号
- getAvailableAccount()    // 获取可用账号
- deleteAccount()          // 删除账号
```

#### MachineIdReset 类
```javascript
// 机器码重置功能
- generateResetScript()    // 生成重置脚本
- detectOS()              // 检测操作系统
- generateMachineId()     // 生成新机器码
```

## 🛡️ 安全说明

### 隐私保护

- 所有数据仅存储在本地浏览器中
- 不会上传任何个人信息到远程服务器
- 临时邮箱使用完毕后自动清理
- 支持手动清理所有数据

### 使用风险

- 本工具仅供学习和研究使用
- 请遵守相关平台的服务条款
- 过度使用可能导致IP被限制
- 建议合理使用，避免滥用

## 🐛 故障排除

### 常见问题

**Q: 扩展无法正常工作？**
A: 请检查是否开启了开发者模式，并确保扩展已正确加载。

**Q: 自动注册失败？**
A: 请检查网络连接和临时邮箱服务是否可用。

**Q: 机器码重置无效？**
A: 请确保完全关闭目标应用后再运行重置脚本。

**Q: 账号管理页面打不开？**
A: 请检查扩展权限设置，确保允许访问扩展页面。

### 调试方法

1. 打开Chrome开发者工具 (F12)
2. 切换到Console标签
3. 查看扩展相关的日志输出
4. 检查是否有错误信息

## 🔄 更新日志

### v2.0.0 (当前版本)
- ✨ 新增Cursor平台支持
- 🔄 重构账号管理系统
- 🛠️ 添加机器码重置功能
- 📊 新增数据统计功能
- 🎨 全新的用户界面设计
- 🔧 优化代码结构和性能

### v1.0.0
- 🎉 初始版本发布
- 📧 基础的Augment续杯功能
- ⚙️ 简单的设置界面

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

### 开发环境设置

1. 克隆项目到本地
2. 在Chrome中加载扩展进行测试
3. 修改代码后重新加载扩展
4. 提交Pull Request

### 代码规范

- 使用ES6+语法
- 遵循Google JavaScript风格指南
- 添加适当的注释和文档
- 确保代码通过测试

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 免责声明

本工具仅供学习和研究目的使用。使用者应当遵守相关平台的服务条款和法律法规。开发者不对使用本工具可能产生的任何后果承担责任。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交GitHub Issue
- 发送邮件至开发者
- 在相关技术社区讨论

---

**⭐ 如果这个项目对您有帮助，请给个Star支持一下！**
