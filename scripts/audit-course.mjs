import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const courseFiles = [
  'course/00-导学与学习方法/00-课程使用说明与最终成果.md',
  'course/00-导学与学习方法/01-理解微信小程序生态.md',
  'course/01-主体账号与合规准备/02-企业主体与资质准备.md',
  'course/01-主体账号与合规准备/03-注册微信小程序账号.md',
  'course/01-主体账号与合规准备/04-开通微信云开发.md',
  'course/01-主体账号与合规准备/05-工具安装与环境配置.md',
  'course/02-产品设计与项目文档/06-产品需求与MVP边界.md',
  'course/02-产品设计与项目文档/07-用户流程与页面结构.md',
  'course/02-产品设计与项目文档/08-UI与交互原型设计.md',
  'course/02-产品设计与项目文档/09-Git-GitHub与项目管理.md',
  'course/03-工程初始化与云端基础/10-创建项目工程.md',
  'course/03-工程初始化与云端基础/11-环境与AppID管理.md',
  'course/03-工程初始化与云端基础/12-云数据库基础.md',
  'course/03-工程初始化与云端基础/13-数据模型-集合与索引设计.md',
  'course/03-工程初始化与云端基础/14-云函数与后端基础.md',
  'course/04-用户体系与供给侧建设/15-微信登录与用户系统.md',
  'course/04-用户体系与供给侧建设/16-教练入驻与审核.md',
  'course/04-用户体系与供给侧建设/17-场馆与运动项目管理.md',
  'course/04-用户体系与供给侧建设/18-教练排期系统.md',
  'course/05-预约订单与三端开发/19-预约与订单状态机.md',
  'course/05-预约订单与三端开发/20-用户端小程序开发.md',
  'course/05-预约订单与三端开发/21-私教端小程序开发.md',
  'course/05-预约订单与三端开发/22-PC管理后台开发.md',
  'course/06-支付履约与平台运营/23-模拟支付与完整流程演练.md',
  'course/06-支付履约与平台运营/24-真实微信支付接入.md',
  'course/06-支付履约与平台运营/25-退款取消与异常处理.md',
  'course/06-支付履约与平台运营/26-核销完课与评价.md',
  'course/06-支付履约与平台运营/27-教练收益与提现.md',
  'course/06-支付履约与平台运营/28-订阅消息与通知.md',
  'course/06-支付履约与平台运营/29-地图定位与附近教练.md',
  'course/07-安全测试与质量保障/30-权限隐私与安全.md',
  'course/07-安全测试与质量保障/31-自动化测试.md',
  'course/07-安全测试与质量保障/32-双端联调与完整流程测试.md',
  'course/07-安全测试与质量保障/33-体验版与真机测试.md',
  'course/08-部署审核与持续运营/34-生产环境部署.md',
  'course/08-部署审核与持续运营/35-小程序备案与审核.md',
  'course/08-部署审核与持续运营/36-正式发布与灰度运营.md',
  'course/08-部署审核与持续运营/37-数据分析与后续迭代.md',
];

const headings = [
  '### 本课目标', '### 你将完成', '### 前置条件', '### 核心概念', '### 本课范围',
  '### 关键决策', '### 操作前检查', '### 步骤 1', '### 步骤 2', '### 步骤 3',
  '### 步骤 4', '### 常见问题', '### 安全与合规', '### Codex 提示词', '### 产出物',
  '### 验收标准', '### 自查清单', '### 提交记录', '### 延伸阅读', '### 下一课预告',
];
const codexPromptLabels = [
  '角色：', '任务：', '上下文：', '允许范围：', '禁止范围：',
  '功能要求：', '安全要求：', '测试要求：', '验收要求：', '报告要求：',
];

const errors = [];
const missing = courseFiles.filter((file) => !existsSync(resolve(root, file)));

if (missing.length) {
  errors.push(...missing.map((file) => `缺少课程文件：${file}`));
} else {
  for (const file of courseFiles) {
    const content = readFileSync(resolve(root, file), 'utf8');
    const sectionHeadings = content.match(/^### [^\r\n]+$/gm) ?? [];
    let lastIndex = -1;
    for (const heading of headings) {
      const index = sectionHeadings.indexOf(heading);
      if (index === -1) {
        errors.push(`${file} 缺少固定栏目：${heading}`);
      } else if (index < lastIndex) {
        errors.push(`${file} 固定栏目顺序错误：${heading}`);
      } else {
        lastIndex = index;
      }
    }
  }

  for (const file of courseFiles.slice(0, 23)) {
    const content = readFileSync(resolve(root, file), 'utf8');
    if (!content.includes('### 步骤 1')) errors.push(`${file} 缺少完整课步骤：### 步骤 1`);
    if (content.length < 1500) errors.push(`${file} 内容不足 1,500 UTF-16 代码单元（当前 ${content.length}）`);
    if (content.includes('本轮骨架：正文将在对应阶段完整编写')) errors.push(`${file} 仍包含课程骨架标记`);
    const prompt = content.slice(content.indexOf('### Codex 提示词'), content.indexOf('### 产出物'));
    for (const label of codexPromptLabels) {
      if (!prompt.includes(label)) errors.push(`${file} 的 Codex 提示词缺少字段：${label}`);
    }
  }

  const mapPath = resolve(root, 'docs/课程总纲.md');
  const map = readFileSync(mapPath, 'utf8');
  const links = [...map.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const link of links) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('#')) continue;
    const target = normalize(resolve(dirname(mapPath), link.split('#', 1)[0]));
    if (!target.startsWith(`${root}/`) || !existsSync(target) || !statSync(target).isFile()) {
      errors.push(`课程总纲链接无效：${link}`);
    }
  }
}

if (errors.length) {
  console.error(`课程审计失败：${errors.length} 项。`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('课程审计通过：38 节课程、20 个固定栏目、23 节完整基础课、课程总纲链接均有效。');
}
