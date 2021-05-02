import { Request, Response } from "express"

export enum ResultCodes {
  success = "success",
  badRequest = "badRequest",
  unknownError = "unknownError"
}

export type ResultMeta = {
  code: ResultCodes
  status: number
  successful: boolean
  message?: string
  errorLog?: string
  originalException?: Error
}

export type Result = {
  payload: any
  meta: ResultMeta
}

export type ResultArgs = {
  status?: number
  successful?: boolean
  message?: string
  errorLog?: string|null
  originalException?: Error
}

export const results:Record<ResultCodes, ResultMeta> = {
  [ResultCodes.success]: {
    code: ResultCodes.success,
    status: 200,
    successful: true,
  },

  [ResultCodes.badRequest]: {
    code: ResultCodes.badRequest,
    status: 400,
    successful: false,
    message: "Your conductor might be drunk."
  },

  [ResultCodes.unknownError]: {
    code: ResultCodes.unknownError,
    status: 500,
    successful: false,
    message: "A train has crashed into the server."
  }
}

function overrideDefaults(defaults:ResultMeta, overrides:ResultArgs):ResultMeta {
  const overKeys = Object.keys(overrides)
  const result = {
    ...defaults
  }
  for (let key of overKeys) {
    const val = (overrides as any)[key]
    if (val != undefined) {
      (result as any)[key] = val
    }
  }
  return result
}

export function mapResult(payload:any, code:ResultCodes=ResultCodes.success, metaOverrides:ResultArgs={}):Result {
  const meta = overrideDefaults(results[code], metaOverrides)
  return {
    meta,
    payload
  }
}

export class HandledError {
  static code(code:ResultCodes, metaOverrides?:ResultArgs):HandledError {
    const result = mapResult(null, code, metaOverrides)
    return new HandledError(result)
  }

  constructor(readonly result:Result) {}
}

export type HandlerArgs = {
  req: Request
  res: Response
}

export function handler(func:(args:HandlerArgs)=>Promise<any>):(req:Request, res:Response)=>Promise<void> {
  return async (req, res) => {
    let result:Result
    try {
      const payload = await func({req,res})
      result = mapResult(payload, ResultCodes.success)
    }
    catch (e) {
      if (e instanceof HandledError) {
        result = e.result
      }
      else {
        result = mapResult(null, ResultCodes.unknownError, {originalException: e})
      }
    }

    if (result.meta.code == ResultCodes.unknownError) {
      console.error("-------- !!!!!!!!!!!!! --------")
      console.error("-------- UNKNOWN ERROR --------")
      console.error("-------- !!!!!!!!!!!!! --------")
      console.error((new Date()).toISOString())
      console.error(req.path)
      console.error(req.params)
    }
    if (result.meta.errorLog != undefined) {
      console.error("--- ERROR LOG ---")
      console.error(result.meta.errorLog)
      console.error("--- ~~~~~~~~~ ---")
    }
    if (result.meta.originalException != undefined) {
      console.error("--- ORIGINAL EXCEPTION ---")
      console.error(result.meta.originalException)
      console.error("--- ~~~~~~~~~~~~~~~~~~ ---")
    }
    if (result.meta.code == ResultCodes.unknownError) {
      console.error("-------- !!!!!!!!!!!!! --------")
      console.error("-------- ~~~~~~~~~~~~~ --------")
    }
    res.status(result.meta.status)
    res.json(result)
  }
}
