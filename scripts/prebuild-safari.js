import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 处理 manifest.json for Safari
function processManifest() {
  const manifestPath = path.join(__dirname, '../public/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // 移除本地调试相关的配置
  if (manifest.host_permissions) {
    manifest.host_permissions = manifest.host_permissions.filter(
      permission => !permission.includes('localhost')
    );
  }

  if (manifest.content_security_policy && manifest.content_security_policy.extension_pages) {
    // 移除 CSP 中的本地开发相关配置
    manifest.content_security_policy.extension_pages = manifest.content_security_policy.extension_pages
      .replace(/script-src 'self' http:\/\/localhost:5173;\s*/g, '')
      .replace(/\s*http:\/\/localhost:5173\s*/g, ' ')
      .replace(/\s*ws:\/\/localhost:5173\s*/g, ' ')
      .replace(/;\s+/g, '; ') // 标准化分号后的空格
      .replace(/\s+/g, ' ') // 合并多个空格为一个
      .trim();
  }

  // Safari 特殊处理：添加 appShell.html 到 content scripts 匹配
  if (manifest.content_scripts && manifest.content_scripts[0]) {
    // 添加 appShell.html 的匹配规则
    const existingMatches = manifest.content_scripts[0].matches;
    if (!existingMatches.includes("https://monster-siren.hypergryph.com/")) {
      existingMatches.push("https://monster-siren.hypergryph.com/");
    }
  }

  // Safari 特殊处理：使用 background.page 而不是 service_worker
  if (manifest.background && manifest.background.service_worker) {
    // Safari 扩展在 Manifest V3 中必须使用 persistent: false
    // 但为了调试，我们暂时设为 true 来确保页面加载
    manifest.background = {
      page: "background.html",
      persistent: true
    };
  }

  // 创建 background.html 文件用于 Safari
  const backgroundHtmlPath = path.join(__dirname, '../public/background.html');
  const backgroundHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MSR Mod Background</title>
</head>
<body>
  <h1>MSR Mod Background Page</h1>
  <p>If you can see this page, the background page is loaded!</p>
  <div id="log"></div>
  
  <script>
    // 创建日志函数，同时显示在页面和控制台
    function log(message) {
      console.log(message);
      const logDiv = document.getElementById('log');
      if (logDiv) {
        logDiv.innerHTML += '<div>' + message + '</div>';
      }
    }
    
    log('=== SAFARI BACKGROUND PAGE LOADED ===');
    log('Document ready state: ' + document.readyState);
    log('Location: ' + location.href);
    log('Time: ' + new Date().toISOString());
    
    // 确保在 Safari 中正确加载脚本
    try {
      log('Safari extension context: ' + JSON.stringify({
        chrome: typeof chrome,
        browser: typeof browser,
        safari: typeof safari
      }));
    } catch (e) {
      log('Error in background.html: ' + e.message);
    }
    
    // 监听事件
    document.addEventListener('DOMContentLoaded', function() {
      log('=== DOMContentLoaded fired ===');
    });
    
    window.addEventListener('load', function() {
      log('=== Window load fired ===');
    });
    
    log('About to load background.js...');
  </script>
  <script src="background.js" onload="log('background.js loaded successfully')" onerror="log('Failed to load background.js')"></script>
  <script>
    log('=== After background.js script tag ===');
  </script>
</body>
</html>`;
  fs.writeFileSync(backgroundHtmlPath, backgroundHtmlContent);

  // 创建 Safari 兼容的 background.js
  const backgroundJsPath = path.join(__dirname, '../public/background.js');
  let backgroundJsContent = fs.readFileSync(backgroundJsPath, 'utf8');
  
  // 检查是否已经添加过 Safari 代码，避免重复
  if (backgroundJsContent.includes('=== Safari background.js starting ===')) {
    console.log('Safari background.js already processed, skipping...');
  } else {
    // 在开头添加 Safari 调试信息（只添加一次）
    const safariDebugCode = `
console.log("=== Safari background.js starting ===");
console.log("Available APIs:", {
  chrome: typeof chrome,
  browser: typeof browser,
  safari: typeof safari
});

// Safari 特殊处理
if (typeof chrome === 'undefined' && typeof browser === 'undefined') {
  console.log("No extension APIs available in Safari");
  // 如果没有扩展 API，创建一个空的对象避免错误
  window.chrome = {
    webRequest: { onBeforeRequest: { addListener: () => {} } },
    storage: { sync: { get: () => Promise.resolve({}) } },
    tabs: { create: () => {}, remove: () => {}, update: () => {} },
    runtime: { 
      getURL: (path) => path,
      onMessage: { addListener: () => {} }
    }
  };
}

// Safari 消息监听器：处理来自 content script 的重定向请求
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    if (message.action === 'redirect_to_extension') {
      console.log('Processing redirect request from content script');
      
      try {
        // 创建新标签页并打开扩展
        const extensionUrl = chrome.runtime.getURL('index.html');
        chrome.tabs.create({ url: extensionUrl }, (newTab) => {
          console.log('New extension tab created:', newTab.id);
          
          // 关闭原始标签页
          if (sender.tab && sender.tab.id) {
            chrome.tabs.remove(sender.tab.id);
          }
          
          sendResponse({ success: true, url: extensionUrl });
        });
      } catch (error) {
        console.error('Failed to redirect:', error);
        sendResponse({ success: false, error: error.message });
      }
      
      return true; // 保持消息通道开放
    }
  });
}

`;
    
    // 替换 Safari 的重定向 URL 监听
    backgroundJsContent = backgroundJsContent.replace(
      /{ urls: \['https:\/\/monster-siren\.hypergryph\.com\/api\/fontset', 'https:\/\/monster-siren\.hypergryph\.com\/manifest\.json'\] }/g,
      "{ urls: ['https://monster-siren.hypergryph.com/api/fontset', 'https://monster-siren.hypergryph.com/manifest.json', 'https://monster-siren.hypergryph.com/'] }"
    );
    
    // 替换 Safari 的重定向判断逻辑
    backgroundJsContent = backgroundJsContent.replace(
      /details\.url === 'https:\/\/monster-siren\.hypergryph\.com\/manifest\.json'/g,
      "(details.url === 'https://monster-siren.hypergryph.com/manifest.json' || details.url === 'https://monster-siren.hypergryph.com/')"
    );
    
    // 清理可能的重复条件
    backgroundJsContent = backgroundJsContent.replace(
      /\(\(details\.url === 'https:\/\/monster-siren\.hypergryph\.com\/manifest\.json' \|\| details\.url === 'https:\/\/monster-siren\.hypergryph\.com\/'\) \|\| details\.url === 'https:\/\/monster-siren\.hypergryph\.com\/'\)/g,
      "(details.url === 'https://monster-siren.hypergryph.com/manifest.json' || details.url === 'https://monster-siren.hypergryph.com/')"
    );
    
    backgroundJsContent = safariDebugCode + backgroundJsContent;
  }
  fs.writeFileSync(backgroundJsPath, backgroundJsContent);
  console.log('✅ Safari-compatible background.js created');

  // 创建 Safari 专用的 content.js
  const contentJsPath = path.join(__dirname, '../public/content.js');
  
  // 检查是否已经处理过 content.js
  const existingContentJs = fs.existsSync(contentJsPath) ? fs.readFileSync(contentJsPath, 'utf8') : '';
  if (existingContentJs.includes('checkRedirectPreference')) {
    console.log('Safari content.js already processed, skipping...');
  } else {
    const contentJsContent = `
// Safari 扩展 content script for redirect
console.log('MSR Mod content script loaded on:', window.location.href);

// 兼容 Safari 的浏览器 API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// 异步函数：检查重定向偏好设置
async function checkRedirectPreference() {
  try {
    console.log('Checking redirect preferences...');
    
    // 读取偏好设置
    const pref = await browserAPI.storage.sync.get('preferences');
    console.log('Retrieved preferences:', pref);
    
    // 检查自动重定向设置（默认为 true）
    const shouldRedirect = pref === undefined || 
                          pref.preferences === undefined || 
                          pref.preferences.autoRedirect === undefined || 
                          pref.preferences.autoRedirect === true;
    
    console.log('Should redirect:', shouldRedirect);
    return shouldRedirect;
  } catch (error) {
    console.error('Error reading preferences:', error);
    // 如果读取偏好设置失败，默认重定向
    return true;
  }
}

// 执行重定向的函数
function performRedirect() {
  console.log('Performing redirect to extension...');
  
  try {
    // 对于 Safari，我们需要使用消息传递来请求重定向
    // 因为 content script 无法直接访问 chrome.runtime.getURL
    
    // 方案1：尝试通过消息传递
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({action: 'redirect_to_extension'}, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Message sending failed, trying direct redirect...');
          // 方案2：尝试直接重定向（可能在某些情况下有效）
          window.location.href = 'safari-web-extension://[extension-id]/index.html';
        }
      });
    } else {
      console.log('Chrome runtime not available, trying alternative redirect...');
      // 方案3：显示提示让用户手动打开扩展
      document.body.innerHTML = \`
        <div style="
          position: fixed; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%);
          background: #1a1a1a; 
          color: white; 
          padding: 20px; 
          border-radius: 8px;
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          z-index: 10000;
        ">
          <h2>MSR Mod Extension Detected</h2>
          <p>Please click the MSR Mod extension icon in your Safari toolbar to open the app.</p>
          <button onclick="window.close()" style="
            background: #007AFF; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 4px; 
            cursor: pointer;
            margin-top: 10px;
          ">Close Tab</button>
        </div>
      \`;
    }
  } catch (error) {
    console.error('Redirect failed:', error);
  }
}

// 主逻辑：检查页面并根据偏好设置决定是否重定向
async function main() {
  // 检查是否是目标页面
  if (window.location.pathname === '/' || window.location.href.includes('appShell.html')) {
    console.log('Detected target page, checking preferences...');
    
    // 检查偏好设置
    const shouldRedirect = await checkRedirectPreference();
    
    if (shouldRedirect) {
      console.log('Auto-redirect is enabled, proceeding with redirect...');
      performRedirect();
    } else {
      console.log('Auto-redirect is disabled, skipping redirect.');
    }
  }
}

// 执行主逻辑
main().catch(error => {
  console.error('Error in main function:', error);
});
`;
    
    fs.writeFileSync(contentJsPath, contentJsContent);
  }
  console.log('✅ Safari-compatible content.js created');

  // Safari 可能需要额外的权限
  if (!manifest.permissions.includes('activeTab')) {
    manifest.permissions.push('activeTab');
  }

  // 添加 Safari 特有配置
  manifest.browser_specific_settings = {
    safari: {
      minimum_version: "14.0"
    }
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Safari Manifest.json processed');
  console.log('✅ Background.html created for Safari');
}

// 处理 index.html
function processIndexHtml() {
  const indexPath = path.join(__dirname, '../index.html');
  let content = fs.readFileSync(indexPath, 'utf8');

  // 替换脚本地址
  content = content.replace(
    /src="[^"]*\/src\/main\.ts"/g,
    'src="./src/main.ts"'
  );

  // 移除 crossorigin 属性
  content = content.replace(/\s+crossorigin/g, '');

  fs.writeFileSync(indexPath, content);
  console.log('✅ Index.html processed for Safari');
}

// 执行处理
try {
  processManifest();
  processIndexHtml();
  console.log('🎉 Safari build preparation completed!');
} catch (error) {
  console.error('❌ Error during Safari build preparation:', error);
  process.exit(1);
}
