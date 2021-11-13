
type IResponseCurrency = {
  CHANGE24HOUR: string,
  CHANGEPCT24HOUR: string,
  OPEN24HOUR: string,
  VOLUME24HOUR: string,
  VOLUME24HOURTO: string,
  LOW24HOUR: string,
  HIGH24HOUR: string,
  PRICE: string,
  SUPPLY: string,
  MKTCAP: string,
}

type ICryptoDbData = {
  DISPLAY: object,
  RAW: object,
  fsym: string,
  tsym: string,
}

export { ICryptoDbData, IResponseCurrency }