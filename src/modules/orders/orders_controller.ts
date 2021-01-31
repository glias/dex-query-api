import { controller, httpGet, httpPost } from 'inversify-express-utils'
import { inject, LazyServiceIdentifer } from 'inversify'
import {
  ApiOperationGet,
  ApiOperationPost,
  ApiPath,
  SwaggerDefinitionConstant
} from 'swagger-express-ts'
import * as express from 'express'

import { modules } from '../../ioc'
import { DexLogger } from '../../component'
import OrderService from './orders_service'
import OrdersHistoryService from './orders_history_service'
import { HashType } from '@ckb-lumos/base'

@ApiPath({
  path: '/',
  name: 'Orders',
  security: { basicAuth: [] }
})
@controller('/')
export default class OrderController {
  private readonly logger: DexLogger
  constructor (
    @inject(new LazyServiceIdentifer(() => modules[OrderService.name]))
    private readonly orderService: OrderService,
    @inject(new LazyServiceIdentifer(() => modules[OrdersHistoryService.name]))
    private readonly orderHistoryService: OrdersHistoryService
  ) {
    this.logger = new DexLogger(OrderController.name)
  }

  @ApiOperationGet({
    path: 'orders',
    description: 'Get orders',
    summary: 'Get orders',
    parameters: {
      query: {
        type_code_hash: {
          name: 'type_code_hash',
          type: 'string',
          required: true,
          description: ''
        },
        type_hash_type: {
          name: 'type_hash_type',
          type: 'string',
          required: true,
          description: ''
        },
        type_args: {
          name: 'type_args',
          type: 'string',
          required: true,
          description: ''
        },
        decimal: {
          name: 'decimal',
          type: 'string',
          required: true,
          description: ''
        }
      }
    },
    responses: {
      200: {
        description: 'Success',
        type: SwaggerDefinitionConstant.Response.Type.ARRAY
        // model: "BalanceCkbModel",
      },
      400: { description: 'Parameters fail' }
    }
  })
  @httpGet('orders')
  async getOrders (req: express.Request, res: express.Response): Promise<void> {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      decimal
    } = req.query
    try {
      const orders = await this.orderService.getOrders(
        <string>type_code_hash,
        <string>type_hash_type,
        <string>type_args,
        <string>decimal
      )
      res.status(200).json(orders)
    } catch (err) {
      console.error(err)
      res.status(500).send()
    }
  }

  @ApiOperationGet({
    path: 'current-price',
    description: 'Get current price',
    summary: 'Get current price',
    parameters: {
      query: {
        type_code_hash: {
          name: 'type_code_hash',
          type: 'string',
          required: true,
          description: ''
        },
        type_hash_type: {
          name: 'type_hash_type',
          type: 'string',
          required: true,
          description: ''
        },
        type_args: {
          name: 'type_args',
          type: 'string',
          required: true,
          description: ''
        }
      }
    },
    responses: {
      200: {
        description: 'Success',
        type: SwaggerDefinitionConstant.Response.Type.STRING
      },
      400: { description: 'Parameters fail' }
    }
  })
  @httpGet('current-price')
  async getCurrentPrice (req: express.Request, res: express.Response): Promise<void> {
    const {
      type_code_hash: code_hash,
      type_hash_type: hash_type,
      type_args: args
    } = req.query as Record<string, string>
    try {
      const price = await this.orderService.getCurrentPrice({ code_hash, hash_type: <HashType>hash_type, args })
      res.status(200).json(price)
    } catch (err) {
      console.error(err)
      res.status(500).send()
    }
  }

  @ApiOperationGet({
    path: 'order-history',
    description: 'Get orders history',
    summary: 'Get orders history',
    parameters: {
      query: {
        type_code_hash: {
          name: 'type_code_hash',
          type: 'string',
          required: true,
          description: ''
        },
        type_hash_type: {
          name: 'type_hash_type',
          type: 'string',
          required: true,
          description: ''
        },
        type_args: {
          name: 'type_args',
          type: 'string',
          required: true,
          description: ''
        },
        order_lock_args: {
          name: 'order_lock_args',
          type: 'string',
          required: true,
          description: ''
        },
        ckb_address: {
          name: 'ckb_address',
          type: 'string',
          required: true,
          description: ''
        },
        eth_address: {
          name: 'eth_address',
          type: 'string',
          required: true,
          description: ''
        }
      }
    },
    responses: {
      200: {
        description: 'Success',
        type: SwaggerDefinitionConstant.Response.Type.ARRAY
      },
      400: { description: 'Parameters fail' }
    }
  })
  @httpGet('order-history')
  async getOrderHistory (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      order_lock_args,
      ckb_address,
      eth_address
    } = req.query

    try {
      const result = await this.orderHistoryService.getOrderHistory(
        <string>type_code_hash,
        <string>type_hash_type,
        <string>type_args,
        <string>order_lock_args,
        <string>ckb_address,
        <string>eth_address
      )

      res.status(200).json(result)
    } catch (error) {
      console.error(error)
      res.status(500).send()
    }
  }

  @ApiOperationPost({
    path: 'order-history-batch',
    description: 'Batch orders history',
    summary: 'Batch orders history',
    parameters: {
      body: {
        description: 'Batch orders history',
        required: true
      }
    },
    responses: {
      200: {
        description: 'Success',
        type: SwaggerDefinitionConstant.Response.Type.ARRAY
      },
      400: { description: 'Parameters fail' }
    }
  })
  @httpPost('order-history-batch')
  async batch (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const types = <{
        type_code_hash: string
        type_hash_type: string
        order_lock_args: string
        ckb_address: string
        eth_address: string
        types: Array<{
          type_args: string
        }>
      }>req.body

      const orders = await this.orderHistoryService.batch(types)
      res.status(200).json(orders)
    } catch (error) {
      this.logger.error(error)
      res.status(400).json({ error: 'Query failure' })
    }
  }
}
