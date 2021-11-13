import {
    AllowNull, AutoIncrement, Column, CreatedAt, DataType, Model, PrimaryKey, Table, Unique
} from 'sequelize-typescript'

@Table
class CryptoData extends Model {
  @PrimaryKey
  @AutoIncrement
  @Unique
  @Column
  id: number

  @AllowNull(false)
  @Column(DataType.JSON)
  RAW: string

  @AllowNull(false)
  @Column(DataType.JSON)
  DISPLAY: string

  @AllowNull(false)
  @Column
  fsym: string

  @AllowNull(false)
  @Column
  tsym: string

  @CreatedAt
  createdAt: Date
}

export { CryptoData }