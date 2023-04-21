import type { Context } from '@opentelemetry/api'
import { EngineSpanEvent, ExtendedSpanOptions, SpanCallback, TracingHelper } from '@prisma/internals'

export const disabledTracingHelper: TracingHelper = {
  isEnabled() {
    return false
  },
  getTraceParent() {
    return `00-10-10-00`
  },

  async createSpan(): Promise<void> {},

  getActiveContext() {
    return undefined
  },

  runInChildSpan<R>(options: string | ExtendedSpanOptions, callback: SpanCallback<R>): R {
    return callback()
  },
}

/**
 * Tracing helper that can dynamically switch between enabled/disabled states
 * Needed because tracing can be disabled and enabled with the calls to
 * PrismaInstrumentation::disable/enable at any point
 */
class DynamicTracingHelper implements TracingHelper {
  isEnabled(): boolean {
    return this.getGlobalTracingHelper().isEnabled()
  }
  getTraceParent(context: Context) {
    return this.getGlobalTracingHelper().getTraceParent(context)
  }

  async createSpan(event: EngineSpanEvent): Promise<void> {
    return this.getGlobalTracingHelper().createSpan(event)
  }

  getActiveContext() {
    return this.getGlobalTracingHelper().getActiveContext()
  }
  runInChildSpan<R>(options: string | ExtendedSpanOptions, callback: SpanCallback<R>): R {
    return this.getGlobalTracingHelper().runInChildSpan(options, callback)
  }

  private getGlobalTracingHelper(): TracingHelper {
    return globalThis.PRISMA_INSTRUMENTATION?.helper ?? disabledTracingHelper
  }
}

export function getTracingHelper(previewFeatures: string[]): TracingHelper {
  if (!previewFeatures.includes('tracing')) {
    // no preview feature - tracing is disabled and can never be enabled
    return disabledTracingHelper
  }
  // preview feature is enabled - tracing is enabled if PRISMA_INSTRUMENTATION global is set
  return new DynamicTracingHelper()
}
