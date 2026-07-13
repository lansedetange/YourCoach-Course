# 数据模型

## 用途与边界

这是 YourCoach MVP 的数据契约，定义集合、字段、关系、查询和最小读写边界。MVP 仅支持本城到店一对一服务；每位教练一个主项目、可关联多个场馆，用户预约必须选择场馆。所有样例为虚构数据；金额均用整数分；生产权限、真实数据和凭据不进入本仓库。

## 通用约定

- 主键使用数据库 `_id`；跨集合引用命名为 `<对象>_id`，例如 `coach_id`。
- 时间字段使用统一时间戳：`created_at`、`updated_at`；预约开始和结束使用 `start_at`、`end_at`。
- 枚举为大写常量，例如 `APPROVED`、`ACTIVE`；枚举可选值由对应课程维护。
- 金额字段以 `_cent` 结尾，使用非负整数；不使用浮点数。
- 客户端传入的字段均不可信。订单、支付、退款、核销、钱包、流水和提现状态只能通过云函数受控更新。

## 集合清单

| 集合 | 用途与关键字段 | 主要读取者 | 唯一/关键索引 | 写入入口与数据边界 |
| --- | --- | --- | --- | --- |
| `users` | 用户档案：`nickname`、`avatar_url`、`phone_masked`、`status`、时间字段 | 本人；必要展示字段可受控展示 | 身份主体唯一；`status` | 登录云函数创建/更新；本人仅能请求允许修改的展示字段 |
| `coaches` | 教练公开与审核状态：`user_id`、`display_name`、`bio`、`main_project_id`、`audit_status`、`public_status` | 已上架公开字段；本人；管理员 | `user_id` 唯一；`audit_status, updated_at` | 入驻申请、审核云函数；公开字段与证书分离 |
| `coach_certificates` | 证书审核材料：`coach_id`、`type`、`file_ref`、`audit_status`、`review_note` | 本人、指定审核管理员 | `coach_id, audit_status` | 后端受控上传/审核；不公开读取文件与证件信息 |
| `projects` | 课程项目：`name`、`duration_minutes`、`base_price_cent`、`status` | 已上架项目可公开读 | `status, updated_at` | 管理员或审核流程写入；价格变化不回写历史订单 |
| `venues` | 场馆：`name`、`address_text`、`location`、`status` | 已上架场馆可公开读 | `status, location` | 管理员受控写入；精确位置展示须符合隐私策略 |
| `coach_venues` | 教练-场馆多对多：`coach_id`、`venue_id`、`status`、`price_override_cent` | 关联教练、用户的公开有效关联、管理员 | `(coach_id, venue_id)` 唯一；`venue_id, status` | 教练申请、后台审核或后端配置 |
| `coach_schedules` | 可约时段：`coach_id`、`venue_id`、`start_at`、`end_at`、`status` | 教练本人；用户可读可约时段 | `coach_id, status, start_at`；`venue_id, start_at` | 教练云函数维护；订单云函数条件占用 |
| `orders` | 订单主记录：`user_id`、`coach_id`、`project_id`、`venue_id`、`schedule_id`、快照字段、`amount_cent`、`status` | 订单用户、教练、管理员 | `user_id, created_at`；`coach_id, status, service_start_at`；有效预约去重键 | 创建、支付确认、取消、履约均由云函数；前端不可直写状态 |
| `order_logs` | 订单审计：`order_id`、`from_status`、`to_status`、`action`、`actor_type`、`created_at` | 相关用户的最小可见摘要；管理员 | `order_id, created_at` | 仅订单云函数追加，禁止客户端修改/删除 |
| `payments` | 支付记录：`order_id`、`provider_trade_no`、`amount_cent`、`status`、`paid_at` | 本人/管理员的必要摘要 | `order_id`；`provider_trade_no` 唯一 | 支付下单、回调、主动查单云函数；不存密钥原文 |
| `refunds` | 退款记录：`order_id`、`payment_id`、`amount_cent`、`status`、`provider_refund_no` | 本人/管理员的必要摘要 | `order_id, created_at`；`provider_refund_no` 唯一 | 退款云函数创建与回调更新，必须幂等 |
| `reviews` | 完课评价：`order_id`、`user_id`、`coach_id`、`rating`、`content`、`status` | 已发布内容公开；本人和管理员 | `order_id` 唯一；`coach_id, status, created_at` | 已完成订单的用户经云函数创建；审核/隐藏受控 |
| `favorites` | 用户收藏：`user_id`、`coach_id`、`created_at` | 本人 | `(user_id, coach_id)` 唯一 | 本人云函数创建/删除；不公开收藏列表 |
| `notifications` | 站内通知：`receiver_user_id`、`type`、`payload_safe`、`read_at` | 接收者本人 | `receiver_user_id, read_at, created_at` | 后端创建；本人只能标记已读，不改内容 |
| `coach_wallets` | 教练收益汇总：`coach_id`、`available_cent`、`frozen_cent`、`version` | 教练本人摘要、管理员 | `coach_id` 唯一 | 结算云函数事务更新；不允许教练直写 |
| `wallet_transactions` | 收益流水：`wallet_id`、`coach_id`、`order_id`、`amount_cent`、`type`、`status` | 教练本人、管理员 | `coach_id, created_at`；`order_id, type` | 仅结算/退款云函数追加；不可客户端修改 |
| `withdrawals` | 提现申请：`coach_id`、`amount_cent`、`status`、`requested_at`、`reviewed_at` | 申请教练、管理员 | `coach_id, status, requested_at` | 教练经云函数申请；审核、打款状态仅管理员/后端 |
| `admins` | 后台角色：`user_id`、`role`、`status` | 管理员本人及受控鉴权服务 | `user_id` 唯一；`role, status` | 超级管理员受控维护；不能由前端自助创建 |
| `system_configs` | 非敏感业务配置：`key`、`value_safe`、`status`、`updated_at` | 仅需该配置的受控服务 | `key` 唯一 | 管理后台云函数写入；不存密钥、证书或个人数据 |

## 关系与交易快照

```text
users 1—1 coaches
coaches 1—N coach_certificates / coach_schedules / coach_wallets
coaches N—N venues（经 coach_venues）
orders N—1 users / coaches / projects / venues / coach_schedules
orders 1—N order_logs / payments / refunds / wallet_transactions
orders 1—0..1 reviews
```

`orders` 创建时固定保存 `project_name_snapshot`、`venue_name_snapshot`、`coach_name_snapshot`、`duration_minutes_snapshot`、`amount_cent` 等交易快照；不能因为后续项目调价、场馆更名或教练资料更新而改写历史订单。订单仍保存各主对象 ID，方便受控审计与关联查询。

## 访问路径与索引验证清单

| 查询 | 条件与排序 | 预期索引 | 说明 |
| --- | --- | --- | --- |
| 用户订单列表 | `user_id`，按 `created_at` 倒序 | `orders(user_id, created_at)` | 只返回本人订单 |
| 教练待处理订单 | `coach_id + status`，按服务时间 | `orders(coach_id, status, service_start_at)` | 仅教练本人或管理员 |
| 可约时段 | `coach_id + status + start_at` | `coach_schedules(coach_id, status, start_at)` | 下单前仍需后端确认 |
| 场馆下教练 | `venue_id + status` | `coach_venues(venue_id, status)` | 仅有效、审核通过关联 |
| 教练评价 | `coach_id + status`，按时间 | `reviews(coach_id, status, created_at)` | 仅已发布内容公开 |
| 支付/退款回调 | 外部交易号等值 | 唯一 `provider_trade_no` / `provider_refund_no` | 后端幂等去重 |
| 用户收藏 | `user_id + coach_id` | 唯一 `favorites(user_id, coach_id)` | 防止重复收藏 |

控制台中索引名称、排序方向和唯一约束的配置以当前平台能力为准。执行时请以微信公众平台当前页面和官方文档为准。

## 权限与保留原则

- 公开读取仅限已审核、已上架的教练、项目、场馆和已发布评价的展示字段。
- 本人读取必须带归属条件；管理员读取通过受控后台鉴权，不能靠客户端传递的角色字符串判断。
- `orders`、`payments`、`refunds`、`order_logs`、`coach_wallets`、`wallet_transactions`、`withdrawals` 和审核状态均由云函数写入，并记录必要审计信息。
- 证书、支付信息、提现资料和任何个人敏感信息不进入公开集合；保留期限、删除和导出流程上线前须与业务、法务确认。

不要填写真实个人资料、证件号码、交易号或生产凭据。
