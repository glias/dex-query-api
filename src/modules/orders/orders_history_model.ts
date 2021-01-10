
export interface OrdersHistoryModel {
  block_hash: string
  is_bid?: boolean
  order_amount?: string
  traded_amount?: string
  turnover_rate?: string
  paid_amount?: string
  price?: string
  status?: string
  timestamp: string
  last_order_cell_outpoint?: OutPoint
  order_cells: OutPoint[]
  type_args: string
}

export interface OutPoint {
  tx_hash: string
  index: string
}
