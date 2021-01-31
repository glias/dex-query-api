import { controller, httpPost } from 'inversify-express-utils'
import { modules } from '../../ioc'
import { inject, LazyServiceIdentifer } from 'inversify'
import {
  ApiOperationPost,
  ApiPath,
  SwaggerDefinitionConstant
} from 'swagger-express-ts'
import * as express from 'express'
import { DexLogger } from '../../component'
import RedisCache from './redis_cache'
import { DexCache } from './dex_cache'

@ApiPath({
  path: '/',
  name: 'Cache',
  security: { basicAuth: [] }
})
@controller('/')
export default class CacheController {
  private readonly logger: DexLogger
  constructor (
    @inject(new LazyServiceIdentifer(() => modules[RedisCache.name]))
    private readonly dexCache: DexCache
  ) {
    this.logger = new DexLogger(CacheController.name)
  }

  @ApiOperationPost({
    path: 'scripts/lock-scripts',
    description: 'Get lockScripts by lockHash',
    summary: 'Get lockScripts by lockHash',
    parameters: {},
    responses: {
      200: {
        description: 'Success',
        type: SwaggerDefinitionConstant.Response.Type.ARRAY
      },
      400: { description: 'Parameters fail' }
    }
  })
  @httpPost('scripts/lock-scripts')
  async getLockScriptsByLockHash (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const reqParams = <{
      lock_hashes: string[]
    }>req.body

    try {
      const lockScripts = []
      for (let i = 0; i < reqParams.lock_hashes.length; i++) {
        const hash = reqParams.lock_hashes[i]
        const value = await this.dexCache.get(hash)

        if (value !== null) {
          lockScripts.push(JSON.parse(value))
        }
      }

      res.status(200).json(lockScripts)
    } catch (err) {
      console.error(err)
      res.status(500).send()
    }
  }

  @ApiOperationPost({
    path: 'scripts/cache',
    description: 'Script Cache',
    summary: 'Script Cache',
    parameters: {},
    responses: {
      200: {
        description: 'Success',
        type: SwaggerDefinitionConstant.Response.Type.ARRAY
      },
      400: { description: 'Parameters fail' }
    }
  })
  @httpPost('scripts/cache')
  async cheche (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const cache = <{
        lock_hash: string
        script: {
          code_hash: string
          hash_type: string
          args: string
        }
      }>req.body
      const value = this.dexCache.set(cache.lock_hash, JSON.stringify(cache))
      res.status(200).json({ args: value })
    } catch (err) {
      console.error(err)
      res.status(500).send()
    }
  }
}
