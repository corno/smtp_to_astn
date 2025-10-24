export type JSON_Value = 
 | readonly ['string', string]
 | readonly ['number', number]
 | readonly ['boolean', boolean]
 | readonly ['null']
 | readonly ['array', readonly JSON_Value[]]
 | readonly ['object', { [key: string]: JSON_Value }];