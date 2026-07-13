# 接口约定

## 用途与通用响应

本文件定义三端与云函数的调用合同。客户端只提出意图；云函数从可信登录上下文获取调用方，校验输入、角色、归属、状态、价格与幂等性后再读写数据库。所有金额均为整数分。

```json
{ "ok": true, "data": {} }
```

```json
{ "ok": false, "error": { "code": "CONFLICT_SLOT_UNAVAILABLE", "message": "该时段已不可预约，请刷新后重试。" } }
```

响应不返回数据库原始异常、令牌、证书、内部权限或其他用户的敏感资料。内部日志记录请求 ID、函数动作、结果与脱敏上下文。

## 责任清单

| 动作 | 调用方 | 最小请求 | 后端必须校验 | 成功结果 | 典型错误 |
| --- | --- | --- | --- | --- | --- |
| `auth.login` | 用户端/私教端/后台 | 无或授权所需最小参数 | 可信登录态、账号状态 | 本人最小档案与角色摘要 | `AUTH_REQUIRED` |
| `user.updateProfile` | 本人 | 允许修改的展示字段 | 登录身份、字段长度与内容 | 更新后本人档案 | `VALIDATION_FAILED` |
| `coach.apply` | 本人 | 展示资料、脱敏材料引用 | 用户身份、必填项、重复申请 | 申请状态 | `FORBIDDEN`、`CONFLICT_EXISTS` |
| `admin.reviewCoach` | 管理员 | `coach_id`、审核决定 | 管理员角色、当前审核状态 | 新审核状态 | `FORBIDDEN`、`STATE_TRANSITION_INVALID` |
| `schedule.manage` | 教练本人 | 时段、场馆、动作、幂等键 | 教练归属、未来时间、场馆关联、冲突 | 时段摘要 | `CONFLICT_SLOT_UNAVAILABLE` |
| `booking.create` | 用户本人 | 教练/项目/场馆/时段 ID、幂等键 | 上架状态、关联、可约状态、价格快照、并发占用 | 订单 ID、待支付状态、金额分 | `CONFLICT_SLOT_UNAVAILABLE` |
| `order.transition` | 受控角色 | 订单 ID、动作、幂等键 | 身份、订单归属、合法状态机转换 | 更新后订单摘要 | `STATE_TRANSITION_INVALID` |
| `payment.create` | 订单用户 | 订单 ID、幂等键 | 订单归属、待支付状态、金额 | 安全支付参数或处理中状态 | `PAYMENT_PENDING` |
| `payment.notify` | 可信支付回调 | 平台回调体 | 签名、金额、交易号唯一性、订单状态 | 回调确认 | `FORBIDDEN`、`CONFLICT_EXISTS` |
| `refund.request` | 用户/管理员 | 订单 ID、原因、幂等键 | 取消规则、支付状态、退款金额 | 退款处理中摘要 | `STATE_TRANSITION_INVALID` |
| `checkin.verify` | 教练/管理员 | 订单 ID、核销信息 | 角色、到课窗口、状态、幂等 | 核销结果 | `FORBIDDEN`、`STATE_TRANSITION_INVALID` |
| `review.create` | 完课用户 | 订单 ID、评分、内容 | 订单归属、已完成、未重复评价 | 评价摘要 | `CONFLICT_EXISTS` |
| `withdrawal.request` | 教练本人 | 金额分、幂等键 | 钱包余额、最小金额、风控状态 | 提现申请摘要 | `FORBIDDEN`、`VALIDATION_FAILED` |
| `admin.manageConfig` | 管理员 | 配置键与安全值 | 管理员角色、键白名单 | 配置摘要 | `FORBIDDEN` |

## 错误与幂等规则

- `AUTH_REQUIRED`：无有效身份；引导重新登录。
- `FORBIDDEN`：身份存在但无权限；不泄露对象归属。
- `VALIDATION_FAILED`：字段缺失、类型、长度、枚举或金额不合法。
- `NOT_FOUND`：调用方可见范围内对象不存在。
- `CONFLICT_SLOT_UNAVAILABLE`：时段已占用或不可约；不创建第二个有效订单。
- `STATE_TRANSITION_INVALID`：当前订单状态不允许该动作。
- `CONFLICT_EXISTS`：同一幂等键或唯一业务约束重复。
- `PAYMENT_PENDING`：支付状态尚未可信确认，客户端展示处理中。
- `SYSTEM_RETRYABLE`：可安全重试的系统问题；后端保留详细脱敏日志。

写操作使用调用方提供或后端生成的幂等键；同一键的重复请求应返回同一业务结果，不重复扣款、创建订单或记账。支付、退款回调以外部交易号为唯一去重条件，并须主动查验可信状态后更新。

## 最小验证案例

1. **成功预约：** 虚构已上架教练、关联项目/场馆和未来可约时段，调用 `booking.create`。预期返回订单 ID、`PENDING_PAYMENT` 和整数分金额，同时写入一条订单日志。
2. **时段冲突：** 使用同一时段再次调用。预期返回 `CONFLICT_SLOT_UNAVAILABLE`，订单数量、支付记录和余额均不增加。

执行时请以微信公众平台当前页面和官方文档为准。不得在示例、日志、截图或仓库中写入真实密钥、支付标识、个人信息或生产配置。
