import { controller, httpGet, httpPost } from "inversify-express-utils";
import { modules } from "../../ioc";
import { inject, LazyServiceIdentifer } from "inversify";
import {
  ApiOperationGet,
  ApiOperationPost,
  ApiPath,
  SwaggerDefinitionConstant,
} from "swagger-express-ts";
import * as express from "express";
import { DexLogger } from "../../component";
import CellsService from "./cells_service";
import CellsAmountRequestModel from "./cells_amount_request_model";

@ApiPath({
  path: "/",
  name: "Cells",
  security: { basicAuth: [] },
})
@controller("/")
export default class CellsController {
  private logger: DexLogger;
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[CellsService.name]))
    private cellsService: CellsService
  ) {
    this.logger = new DexLogger(CellsController.name);
  }

  @ApiOperationGet({
    path: "cells",
    description: "Get cells",
    summary: "Get cells",
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
  @httpGet("cells")
  async getLiveCells(
    req: express.Request,
    res: express.Response
  ): Promise<express.Response<void>> {
    const reqParam: CellsAmountRequestModel = {
      type_code_hash: <string>req.query.type_code_hash,
      type_hash_type: <string>req.query.type_hash_type,
      type_args: <string>req.query.type_args,
      lock_code_hash: <string>req.query.lock_code_hash,
      lock_hash_type: <string>req.query.lock_hash_type,
      lock_args: <string>req.query.lock_args,
    };
    if (
      !this.isValidScript(
        reqParam.lock_code_hash,
        reqParam.lock_hash_type,
        reqParam.lock_args
      ) &&
      !this.isValidScript(
        reqParam.type_code_hash,
        reqParam.type_hash_type,
        reqParam.type_args
      )
    ) {
      return res.status(400).json({
        error: "requires either lock or type script specified as parameters",
      });
    }

    try {
      const result = await this.cellsService.getLiveCells(reqParam);
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }
  @ApiOperationGet({
    path: "cells-for-amount",
    description: "Get cells for amount",
    summary: "Get cells for amount",
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
        ckb_amount: {
          name: "ckb_amount",
          type: "string",
          required: false,
          description: "",
        },
        sudt_amount: {
          name: "sudt_amount",
          type: "string",
          required: false,
          description: "",
        },
      },
    },
    responses: {
      200: {
        description: "Success",
        type: SwaggerDefinitionConstant.Response.Type.OBJECT,
        model: "BalanceCkbModel",
      },
      400: { description: "Parameters fail" },
    },
  })
  @httpGet("cells-for-amount")
  async getLiveCellsForAmount(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const reqParam: CellsAmountRequestModel = {
      type_code_hash: <string>req.query.type_code_hash,
      type_hash_type: <string>req.query.type_hash_type,
      type_args: <string>req.query.type_args,
      lock_code_hash: <string>req.query.lock_code_hash,
      lock_hash_type: <string>req.query.lock_hash_type,
      lock_args: <string>req.query.lock_args,
      ckb_amount: <string>req.query.ckb_amount,
      sudt_amount: <string>req.query.sudt_amount,
    };

    const err = this.checkRequestParams(reqParam);
    if (err) {
      res.status(400).json(err);
    }

    try {
      const result = await this.cellsService.getLiveCellsForAmount(reqParam);
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  @ApiOperationPost({
    path: "cells-for-amount",
    description: "Get cells for amount",
    summary: "Get cells for amount",
    parameters: {
      body: {
        description: "Cells amount request model",
        required: true,
        model: "CellsAmountRequestModel",
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
  @httpPost("cells-for-amount")
  async postLiveCellsForAmount(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const reqParam: CellsAmountRequestModel = {
      type_code_hash: <string>req.body.type_code_hash,
      type_hash_type: <string>req.body.type_hash_type,
      type_args: <string>req.body.type_args,
      lock_code_hash: <string>req.body.lock_code_hash,
      lock_hash_type: <string>req.body.lock_hash_type,
      lock_args: <string>req.body.lock_args,
      ckb_amount: <string>req.body.ckb_amount,
      sudt_amount: <string>req.body.sudt_amount,
      spent_cells: req.body.spent_cells,
    };

    const err = this.checkRequestParams(reqParam);
    if (err) {
      res.status(400).json(err);
    }

    try {
      const result = await this.cellsService.getLiveCellsForAmount(reqParam);
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  private isValidScript(codeHash: string, hashType: string, args: string) {
    return codeHash && hashType && args;
  }

  private checkRequestParams(reqParam: CellsAmountRequestModel): {[key: string]: string } {
    if (reqParam.ckb_amount && reqParam.sudt_amount) {
      return {
        error: "only support query either with ckb_amount or sudt_amount",
      };
    }

    if (!reqParam.ckb_amount && !reqParam.sudt_amount) {
      return { error: "requires either ckb_amount or sudt_amount" };
    }

    if (
      reqParam.ckb_amount &&
      !this.isValidScript(
        reqParam.lock_code_hash,
        reqParam.lock_hash_type,
        reqParam.lock_args
      )
    ) {
      return { error: "invalid lock script" };
    }

    if (
      reqParam.sudt_amount &&
      (!this.isValidScript(
        reqParam.lock_code_hash,
        reqParam.lock_hash_type,
        reqParam.lock_args
      ) ||
        !this.isValidScript(
          reqParam.type_code_hash,
          reqParam.type_hash_type,
          reqParam.type_args
        ))
    ) {
      return { error: "invalid lock script or type script" };
    }
  }
}
