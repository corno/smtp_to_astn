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

        for (const [key, value] of Object.entries(headers)) {
            if (value === undefined) {
                continue;
            }
            
            if (value === null) {
                obj[key] = convertNull();
            } else if (typeof value === 'string') {
                obj[key] = convertString(value);
            } else if (typeof value === 'number') {
                obj[key] = convertNumber(value);
            } else if (typeof value === 'boolean') {
                obj[key] = convertBoolean(value);
            } else if (value instanceof Date) {
                obj[key] = convertDate(value);
            } else if (Array.isArray(value)) {
                obj[key] = convertArray(value, (item) => {
                    if (typeof item === 'string') return convertString(item);
                    if (typeof item === 'number') return convertNumber(item);
                    if (typeof item === 'boolean') return convertBoolean(item);
                    return convertGenericObject(item);
                });
            } else if (typeof value === 'object') {
                obj[key] = convertGenericObject(value);
            } else {
                obj[key] = convertString(String(value));
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

// Generic object converter for unknown structures
const convertGenericObject = (obj: any): JSON_Value => {
    if (obj === null || obj === undefined) {
        return convertNull();
    }

    const result: { [key: string]: JSON_Value } = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) {
            continue;
        }
        
        if (value === null) {
            result[key] = convertNull();
        } else if (typeof value === 'string') {
            result[key] = convertString(value);
        } else if (typeof value === 'number') {
            result[key] = convertNumber(value);
        } else if (typeof value === 'boolean') {
            result[key] = convertBoolean(value);
        } else if (value instanceof Date) {
            result[key] = convertDate(value);
        } else if (Array.isArray(value)) {
            result[key] = convertArray(value, convertGenericValue);
        } else if (typeof value === 'object') {
            result[key] = convertGenericObject(value);
        } else {
            result[key] = convertString(String(value));
        }
    }

    return ['object', result] as const;
};

// Generic value converter
const convertGenericValue = (value: any): JSON_Value => {
    if (value === null || value === undefined) {
        return convertNull();
    }
    if (typeof value === 'string') {
        return convertString(value);
    }
    if (typeof value === 'number') {
        return convertNumber(value);
    }
    if (typeof value === 'boolean') {
        return convertBoolean(value);
    }
    if (value instanceof Date) {
        return convertDate(value);
    }
    if (Array.isArray(value)) {
        return convertArray(value, convertGenericValue);
    }
    if (typeof value === 'object') {
        return convertGenericObject(value);
    }
    return convertString(String(value));
};

// Legacy function for backward compatibility
export const toJSONValue = convertGenericValue;