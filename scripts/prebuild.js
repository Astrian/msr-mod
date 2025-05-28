import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 处理 manifest.json
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
      .replace(/style-src 'self' 'unsafe-inline';\s*/g, '')
      .replace(/\s*http:\/\/localhost:5173\s*/g, ' ')
      .replace(/\s*ws:\/\/localhost:5173\s*/g, ' ')
      .replace(/;\s+/g, '; ') // 标准化分号后的空格
      .replace(/\s+/g, ' ') // 合并多个空格为一个
      .trim();
  }
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Manifest.json processed');
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
  console.log('✅ Index.html processed');
}

// 执行处理
try {
  processManifest();
  processIndexHtml();
  console.log('🎉 Build preparation completed!');
} catch (error) {
  console.error('❌ Error during build preparation:', error);
  process.exit(1);
}