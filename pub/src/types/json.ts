export type Value = 
 | readonly ['string', string]
 | readonly ['number', number]
 | readonly ['boolean', boolean]
 | readonly ['null']
 | readonly ['array', readonly Value[]]
 | readonly ['object', { [key: string]: Value }];