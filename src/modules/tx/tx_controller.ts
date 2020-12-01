import { controller, httpGet } from "inversify-express-utils";
import { inject, LazyServiceIdentifer } from "inversify";
import {
  ApiOperationGet,
  ApiPath,
  SwaggerDefinitionConstant,
} from "swagger-express-ts";
import * as express from "express";

import { modules } from "../../ioc";
import { DexLogger } from "../../component";
import TxService from "./tx_service";
import CkbRequestModel from "../../model/req/ckb_request_model";
import TransactionDetailsModel from './transaction_details_model';

@ApiPath({
  path: "/",
  name: "Transactions",
  security: { basicAuth: [] },
})
@controller("/")
export default class TxController {
  private logger: DexLogger;
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[TxService.name]))
    private txService: TxService
  ) {
    this.logger = new DexLogger(TxController.name);
  }

  @ApiOperationGet({
    path: "sudt-transactions",
    description: "Get sudt transactions",
    summary: "Get sudt transactions",
    parameters: {
      query: {
        type_code_hash: {
          name: "type_code_hash",
          type: "string",
          required: true,
          description: "",
        },
        type_hash_type: {
          name: "type_hash_type",
          type: "string",
          required: true,
          description: "",
        },
        type_args: {
          name: "type_args",
          type: "string",
          required: true,
          description: "",
        },
        lock_code_hash: {
          name: "lock_code_hash",
          type: "string",
          required: true,
          description: "",
        },
        lock_hash_type: {
          name: "lock_hash_type",
          type: "string",
          required: true,
          description: "",
        },
        lock_args: {
          name: "lock_args",
          type: "string",
          required: true,
          description: "",
        },
      },
    },
    responses: {
      200: {
        description: "Success",
        type: SwaggerDefinitionConstant.Response.Type.ARRAY,
        // model: "BalanceCkbModel",
      },
      400: { description: "Parameters fail" },
    },
  })
  @httpGet("sudt-transactions")
  async getSudtTransactions(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const reqParam: CkbRequestModel = CkbRequestModel.buildReqParam(
      <string>req.query.type_code_hash,
      <string>req.query.type_hash_type,
      <string>req.query.type_args,
      <string>req.query.lock_code_hash,
      <string>req.query.lock_hash_type,
      <string>req.query.lock_args
    );

    if (!reqParam.isValidLockScript() && !reqParam.isValidTypeScript()) {
      res.status(400).json({
        error: "requires either lock or type script specified as parameters",
      });

      return;
    }

    try {
      const txs = await this.txService.getSudtTransactions(reqParam);

      res.status(200).json(txs);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  @ApiOperationGet({
    path: "transactions-tx-hash",
    description: "Get transactions by tx_hash",
    summary: "Get transactions by tx_hash",
    parameters: {
      query: {
        type_code_hash: {
          name: "type_code_hash",
          type: "string",
          required: true,
          description: "",
        },
        type_hash_type: {
          name: "type_hash_type",
          type: "string",
          required: true,
          description: "",
        },
        type_args: {
          name: "type_args",
          type: "string",
          required: true,
          description: "",
        },
        lock_code_hash: {
          name: "lock_code_hash",
          type: "string",
          required: true,
          description: "",
        },
        lock_hash_type: {
          name: "lock_hash_type",
          type: "string",
          required: true,
          description: "",
        },
        lock_args: {
          name: "lock_args",
          type: "string",
          required: true,
          description: "",
        },
        tx_hash: {
          name: "tx_hash",
          type: "string",
          required: true,
          description: "",
        },
      },
    },
    responses: {
      200: {
        description: "Success",
        type: SwaggerDefinitionConstant.Response.Type.OBJECT,
        model: "TransactionDetailsModel",
      },
      400: { description: "Parameters fail" },
    },
  })
  @httpGet("transactions-tx-hash")
  async getTransactionsByTxHash(
    req: express.Request,
    res: express.Response
  ): Promise<TransactionDetailsModel> {
    const reqParam: CkbRequestModel = CkbRequestModel.buildReqParam(
      <string>req.query.type_code_hash,
      <string>req.query.type_hash_type,
      <string>req.query.type_args,
      <string>req.query.lock_code_hash,
      <string>req.query.lock_hash_type,
      <string>req.query.lock_args
    );

    if (!reqParam.isValidLockScript() && !reqParam.isValidTypeScript()) {
      res.status(400).json({
        error: "requires either lock or type script specified as parameters",
      });
      return;
    }
    
    try {
      const result = await this.txService.getTransactionDetailsByHash(reqParam, <string>req.query.tx_hash);

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }
}
