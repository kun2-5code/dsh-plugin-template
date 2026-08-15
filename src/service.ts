/**
 * 可选示例：Service 提供方（类形式插件）。服务名 'templateService'，
 * 其他插件通过 inject: ['templateService'] 消费，ctx 上的类型由下方
 * declaration merging 提供。该模块经 package.json 的 "./service" 子路径导出，
 * cordis.patch.yml 里对应的插件行默认注释，需要时启用。
 * @module dsh-plugin-template/service
 */

import { Service, type Context } from '@deepseek-ai/cordis'

declare module '@deepseek-ai/cordis' {
  interface Context {
    templateService: TemplateService
  }
}

/** 示例服务：暴露给其他插件的能力。 */
export class TemplateService extends Service {
  /** 本服务依赖的其他服务；就绪后本插件才加载。 */
  static inject = ['tools']

  constructor(ctx: Context) {
    super(ctx, 'templateService')
  }

  /** 公共方法：记录一次事件。 */
  record(event: string): void {
    // 这里是服务的业务实现。
    console.log(`[templateService] ${event}`)
  }
}

export default TemplateService
