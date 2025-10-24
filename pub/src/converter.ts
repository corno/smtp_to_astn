import { JSON_Value } from './json-value.js';
import { SMTPMessage, Attachment, Headers, AddressObject } from './types.js';

// Primitive converters
const convertString = (value: string): JSON_Value => {
    return ['string', value] as const;
};

const convertNumber = (value: number): JSON_Value => {
    if (!isFinite(value)) {
        return ['null'] as const;
    }
    return ['number', value] as const;
};

const convertBoolean = (value: boolean): JSON_Value => {
    return ['boolean', value] as const;
};

const convertNull = (): JSON_Value => {
    return ['null'] as const;
};

const convertDate = (date: Date): JSON_Value => {
    return ['string', date.toISOString()] as const;
};

// Generic object converter for unknown/complex objects
const convertGenericObject = (obj: any): JSON_Value => {
    if (obj === null || obj === undefined) {
        return convertNull();
    }
    
    if (typeof obj === 'string') {
        return convertString(obj);
    }
    
    if (typeof obj === 'number') {
        return convertNumber(obj);
    }
    
    if (typeof obj === 'boolean') {
        return convertBoolean(obj);
    }
    
    if (obj instanceof Date) {
        return convertDate(obj);
    }
    
    if (Array.isArray(obj)) {
        return convertArray(obj, convertGenericObject);
    }
    
    if (typeof obj === 'object') {
        const result: { [key: string]: JSON_Value } = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                result[key] = convertGenericObject(value);
            }
        }
        return ['object', result] as const;
    }
    
    // Fallback for any other types (functions, symbols, etc.)
    return convertString(String(obj));
};

// Optional value converter
const convertOptional = <T>(value: T | undefined, converter: (val: T) => JSON_Value): JSON_Value => {
    if (value === undefined || value === null) {
        return convertNull();
    }
    return converter(value);
};

// Array converter
const convertArray = <T>(array: T[], itemConverter: (item: T) => JSON_Value): JSON_Value => {
    return ['array', array.map(itemConverter)] as const;
};

// Namespace containing type-specific converters matching type names exactly
export namespace Convert {
    
    export const Attachment = (attachment: Attachment): JSON_Value => {
        const obj: { [key: string]: JSON_Value } = {
            contentType: convertString(attachment.contentType),
            checksum: convertString(attachment.checksum),
            size: convertNumber(attachment.size),
            related: convertBoolean(attachment.related ?? false)
        };

        if (attachment.filename !== undefined) {
            obj.filename = convertString(attachment.filename);
        }
        if (attachment.contentDisposition !== undefined) {
            obj.contentDisposition = convertString(attachment.contentDisposition);
        }
        if (attachment.content !== undefined) {
            obj.content = convertString(attachment.content);
        }
        if (attachment.cid !== undefined) {
            obj.cid = convertString(attachment.cid);
        }

        return ['object', obj] as const;
    };

    export const AddressObject = (addressObj: AddressObject): JSON_Value => {
        const obj: { [key: string]: JSON_Value } = {};

        if (addressObj.text !== undefined) {
            obj.text = convertString(addressObj.text);
        }
        if (addressObj.html !== undefined) {
            obj.html = convertString(addressObj.html);
        }
        if (addressObj.value !== undefined) {
            obj.value = convertArray(addressObj.value, (addr) => {
                const addrObj: { [key: string]: JSON_Value } = {
                    address: convertString(addr.address || '')
                };
                if (addr.name !== undefined && addr.name !== '') {
                    addrObj.name = convertString(addr.name);
                } else {
                    addrObj.name = convertString('');
                }
                return ['object', addrObj] as const;
            });
        }

        return ['object', obj] as const;
    };

    export const Headers = (headers: Headers): JSON_Value => {
        const obj: { [key: string]: JSON_Value } = {};

        for (const [key, headerValue] of Object.entries(headers)) {
            if (headerValue === undefined) {
                continue;
            }
            
            const [headerType, value] = headerValue;
            
            switch (headerType) {
                case 'unstructured':
                    obj[key] = ['array', [convertString(headerType), convertString(value)]] as const;
                    break;
                    
                case 'date':
                    obj[key] = ['array', [convertString(headerType), convertDate(value)]] as const;
                    break;
                    
                case 'address':
                    obj[key] = ['array', [convertString(headerType), AddressObject(value)]] as const;
                    break;
                    
                case 'address_list':
                    obj[key] = ['array', [convertString(headerType), convertArray(value, AddressObject)]] as const;
                    break;
                    
                case 'message_id':
                    obj[key] = ['array', [convertString(headerType), convertString(value)]] as const;
                    break;
                    
                case 'message_id_list':
                    obj[key] = ['array', [convertString(headerType), convertArray(value, convertString)]] as const;
                    break;
                    
                case 'content_type':
                    const contentTypeObj: { [key: string]: JSON_Value } = {
                        value: convertString(value.value)
                    };
                    if (value.params) {
                        const paramsObj: { [key: string]: JSON_Value } = {};
                        for (const [paramKey, paramValue] of Object.entries(value.params)) {
                            paramsObj[paramKey] = convertString(paramValue);
                        }
                        contentTypeObj.params = ['object', paramsObj] as const;
                    }
                    obj[key] = ['array', [convertString(headerType), ['object', contentTypeObj]]] as const;
                    break;
                    
                case 'mime_version':
                case 'content_encoding':
                    obj[key] = ['array', [convertString(headerType), convertString(value)]] as const;
                    break;
                    
                case 'content_disposition':
                    const dispositionObj: { [key: string]: JSON_Value } = {
                        value: convertString(value.value)
                    };
                    if (value.params) {
                        const paramsObj: { [key: string]: JSON_Value } = {};
                        for (const [paramKey, paramValue] of Object.entries(value.params)) {
                            paramsObj[paramKey] = convertString(paramValue);
                        }
                        dispositionObj.params = ['object', paramsObj] as const;
                    }
                    obj[key] = ['array', [convertString(headerType), ['object', dispositionObj]]] as const;
                    break;
                    
                case 'received':
                    const receivedObj: { [key: string]: JSON_Value } = {
                        date: convertDate(value.date)
                    };
                    if (value.from) receivedObj.from = convertString(value.from);
                    if (value.by) receivedObj.by = convertString(value.by);
                    if (value.via) receivedObj.via = convertString(value.via);
                    if (value.with) receivedObj.with = convertString(value.with);
                    if (value.id) receivedObj.id = convertString(value.id);
                    if (value.for) receivedObj.for = convertString(value.for);
                    obj[key] = ['array', [convertString(headerType), ['object', receivedObj]]] as const;
                    break;
                    
                case 'keywords':
                    obj[key] = ['array', [convertString(headerType), convertArray(value, convertString)]] as const;
                    break;
                    
                case 'unknown':
                    obj[key] = ['array', [convertString(headerType), convertString(value)]] as const;
                    break;
                    
                default:
                    // Fallback for any unhandled header types
                    obj[key] = ['array', [convertString('unknown'), convertString(String(value))]] as const;
                    break;
            }
        }

        return ['object', obj] as const;
    };

    export const SMTPMessage = (message: SMTPMessage): JSON_Value => {
        const obj: { [key: string]: JSON_Value } = {
            headers: Headers(message.headers),
            attachments: convertArray(message.attachments, Attachment)
        };

        if (message.subject !== undefined) {
            obj.subject = convertString(message.subject);
        }

        if (message.from !== undefined) {
            obj.from = AddressObject(message.from);
        }

        if (message.to !== undefined) {
            if (Array.isArray(message.to)) {
                obj.to = convertArray(message.to, AddressObject);
            } else {
                obj.to = AddressObject(message.to);
            }
        }

        if (message.cc !== undefined) {
            if (Array.isArray(message.cc)) {
                obj.cc = convertArray(message.cc, AddressObject);
            } else {
                obj.cc = AddressObject(message.cc);
            }
        }

        if (message.bcc !== undefined) {
            if (Array.isArray(message.bcc)) {
                obj.bcc = convertArray(message.bcc, AddressObject);
            } else {
                obj.bcc = AddressObject(message.bcc);
            }
        }

        if (message.date !== undefined) {
            obj.date = convertDate(message.date);
        }

        if (message.messageId !== undefined) {
            obj.messageId = convertString(message.messageId);
        }

        if (message.inReplyTo !== undefined) {
            obj.inReplyTo = convertString(message.inReplyTo);
        }

        if (message.references !== undefined) {
            if (Array.isArray(message.references)) {
                obj.references = convertArray(message.references, convertString);
            } else {
                obj.references = convertString(message.references);
            }
        }

        if (message.text !== undefined) {
            obj.text = convertString(message.text);
        }

        if (message.html !== undefined && message.html !== false) {
            obj.html = convertString(message.html);
        }

        if (message.textAsHtml !== undefined) {
            obj.textAsHtml = convertString(message.textAsHtml);
        }

        return ['object', obj] as const;
    };
}

// Main export functions using the namespace
export const convertSMTPMessage = Convert.SMTPMessage;
export const convertAttachment = Convert.Attachment;
export const convertAddressObject = Convert.AddressObject;
export const convertHeaders = Convert.Headers;
