import { HashType, Script } from "@ckb-lumos/base";
import { ApiModel, ApiModelProperty } from "swagger-express-ts";

@ApiModel({
  description: "Cells",
  name: "CellsAmountRequestModel",
})
export default class CkbRequestModel {
  @ApiModelProperty({
    description: "type_code_hash",
    required: true,
  })
  type_code_hash: string;

  @ApiModelProperty({
    description: "type_hash_type",
    required: true,
  })
  type_hash_type: string;

  @ApiModelProperty({
    description: "type_args",
    required: true,
  })
  type_args: string;

  @ApiModelProperty({
    description: "lock_code_hash",
    required: true,
  })
  lock_code_hash: string;

  @ApiModelProperty({
    description: "lock_hash_type",
    required: true,
  })
  lock_hash_type: string;

  @ApiModelProperty({
    description: "lock_args",
    required: true,
  })
  lock_args: string;

  static buildReqParam(
    type_code_hash: string,
    type_hash_type: string,
    type_args: string,
    lock_code_hash: string,
    lock_hash_type: string,
    lock_args: string
  ): CkbRequestModel {
    const reqParam: CkbRequestModel = new CkbRequestModel();

    reqParam.type_code_hash = type_code_hash;
    (reqParam.type_hash_type = <string>type_hash_type),
    (reqParam.type_args = type_args),
    (reqParam.lock_code_hash = lock_code_hash),
    (reqParam.lock_hash_type = lock_hash_type),
    (reqParam.lock_args = lock_args);

    return reqParam;
  }

  isValidLockScript(): string {
    return this.lock_code_hash && this.lock_hash_type && this.lock_args;
  }

  isValidTypeScript(): string {
    return this.type_code_hash && this.type_hash_type && this.type_args;
  }

  lockScript(): Script {
    const lockScript: Script = {
      code_hash: this.lock_code_hash,
      hash_type: <HashType>this.lock_hash_type,
      args: this.lock_args,
    };

    return lockScript;
  }

  typeScript(): Script {
    const lockScript: Script = {
      code_hash: this.type_code_hash,
      hash_type: <HashType>this.type_hash_type,
      args: this.type_args,
    };

    return lockScript;
  }
}
