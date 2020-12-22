import { OutPoint } from '@ckb-lumos/base';
import { ApiModel, ApiModelProperty } from "swagger-express-ts";

@ApiModel({
  description: "Cells",
  name: "CellsAmountRequestModel",
})
export default class CellsAmountRequestModel {
  @ApiModelProperty({
    description: "type_code_hash",
    required: true,
  })
  type_code_hash?: string;

  @ApiModelProperty({
    description: "type_hash_type",
    required: true,
  })
  type_hash_type?: string;

  @ApiModelProperty({
    description: "type_args",
    required: true,
  })
  type_args?: string;

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

  @ApiModelProperty({
    description: "ckb_amount",
    required: true,
  })
  ckb_amount?: string;

  @ApiModelProperty({
    description: "sudt_amount",
    required: true,
  })
  sudt_amount?: string;

  @ApiModelProperty({
    description: "spent_cells",
    required: true,
  })
  spent_cells?: Array<OutPoint>;

}

