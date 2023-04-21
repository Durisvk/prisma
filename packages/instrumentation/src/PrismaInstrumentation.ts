import {
  InstrumentationBase,
  InstrumentationConfig,
  InstrumentationNodeModuleDefinition,
} from '@opentelemetry/instrumentation'
import { PrismaInstrumentationGlobalValue } from '@prisma/internals'

import { ActiveTracingHelper } from './ActiveTracingHelper'
import { GLOBAL_KEY, MODULE_NAME, NAME, VERSION } from './constants'

export interface PrismaInstrumentationConfig {
  middleware?: boolean
}

type Config = PrismaInstrumentationConfig & InstrumentationConfig

export class PrismaInstrumentation extends InstrumentationBase {
  constructor(config: Config = {}) {
    super(NAME, VERSION, config)
  }

  init() {
    const module = new InstrumentationNodeModuleDefinition(MODULE_NAME, [VERSION])

    return [module]
  }

  enable() {
    const config = this._config as Config

    const globalValue: PrismaInstrumentationGlobalValue = {
      helper: new ActiveTracingHelper(config.middleware ?? false),
    }

    global[GLOBAL_KEY] = globalValue
  }

  disable() {
    delete global[GLOBAL_KEY]
  }

  isEnabled() {
    return Boolean(global[GLOBAL_KEY])
  }
}
