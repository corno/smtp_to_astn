import * as d_in from "../../types/normalized_email"

import * as d_out from "../../types/json"

// Utility functions for converting primitive types
const string = (value: string): d_out.Value => {
    return ['string', value] as const;
};

const number = (value: number): d_out.Value => {
    if (!isFinite(value)) {
        return ['null'] as const;
    }
    return ['number', value] as const;
};

const boolean = (value: boolean): d_out.Value => {
    return ['boolean', value] as const;
};

const null_ = (): d_out.Value => {
    return ['null'] as const;
};

const date = (value: Date): d_out.Value => {
    return ['string', value.toISOString()] as const;
};

const array = <T>(arr: T[], converter: (item: T) => d_out.Value): d_out.Value => {
    return ['array', arr.map(converter)] as const;
};

// Convert Address
const Address = (address: d_in.Address): d_out.Value => {
    const obj: { [key: string]: d_out.Value } = {
        name: string(address.name),
        address: address.address !== undefined ? string(address.address) : null_()
    };
    
    return ['object', obj] as const;
};

// Convert Address_Object
const Address_Object = (addressObj: d_in.Address_Object): d_out.Value => {
    const obj: { [key: string]: d_out.Value } = {
        value: array(addressObj.value, Address),
        html: string(addressObj.html),
        text: string(addressObj.text)
    };
    
    return ['object', obj] as const;
};

// Convert Attachment
const Attachment = (attachment: d_in.Attachment): d_out.Value => {
    const obj: { [key: string]: d_out.Value } = {
        filename: attachment.filename !== undefined ? string(attachment.filename) : null_(),
        contentType: string(attachment.contentType),
        contentDisposition: attachment.contentDisposition !== undefined ? string(attachment.contentDisposition) : null_(),
        checksum: string(attachment.checksum),
        size: number(attachment.size),
        content: attachment.content !== undefined ? string(attachment.content) : null_(),
        cid: attachment.cid !== undefined ? string(attachment.cid) : null_(),
        related: boolean(attachment.related ?? false)
    };
    
    return ['object', obj] as const;
};

// Convert Header_Value
const Header_Value = (headerValue: d_in.Header_Value): d_out.Value => {
    const [headerType, value] = headerValue;
    
    switch (headerType) {
        case 'unstructured':
            return ['array', [string(headerType), string(value)]] as const;
            
        case 'date':
            return ['array', [string(headerType), date(value)]] as const;
            
        case 'address':
            return ['array', [string(headerType), Address_Object(value)]] as const;
            
        case 'address_list':
            return ['array', [string(headerType), array(value, Address_Object)]] as const;
            
        case 'message_id':
            return ['array', [string(headerType), string(value)]] as const;
            
        case 'message_id_list':
            return ['array', [string(headerType), array(value, string)]] as const;
            
        case 'content_type':
            const contentTypeObj: { [key: string]: d_out.Value } = {
                value: string(value.value),
                params: value.params ? (['object', Object.fromEntries(
                    Object.entries(value.params).map(([k, v]) => [k, string(v)])
                )] as const) : null_()
            };
            return ['array', [string(headerType), ['object', contentTypeObj]]] as const;
            
        case 'mime_version':
        case 'content_encoding':
            return ['array', [string(headerType), string(value)]] as const;
            
        case 'content_disposition':
            const dispositionObj: { [key: string]: d_out.Value } = {
                value: string(value.value),
                params: value.params ? (['object', Object.fromEntries(
                    Object.entries(value.params).map(([k, v]) => [k, string(v)])
                )] as const) : null_()
            };
            return ['array', [string(headerType), ['object', dispositionObj]]] as const;
            
        case 'received':
            const receivedObj: { [key: string]: d_out.Value } = {
                from: value.from ? string(value.from) : null_(),
                by: value.by ? string(value.by) : null_(),
                via: value.via ? string(value.via) : null_(),
                with: value.with ? string(value.with) : null_(),
                id: value.id ? string(value.id) : null_(),
                for: value.for ? string(value.for) : null_(),
                date: date(value.date)
            };
            return ['array', [string(headerType), ['object', receivedObj]]] as const;
            
        case 'keywords':
            return ['array', [string(headerType), array(value, string)]] as const;
            
        case 'unknown':
            return ['array', [string(headerType), string(value)]] as const;
            
        default:
            // Fallback for any unhandled header types
            return ['array', [string('unknown'), string(String(value))]] as const;
    }
};

// Convert headers object
const headers = (headers: { [key: string]: d_in.Header_Value }): d_out.Value => {
    const obj: { [key: string]: d_out.Value } = {};
    
    for (const [key, hValue] of Object.entries(headers)) {
        if (hValue !== undefined) {
            obj[key] = Header_Value(hValue);
        }
    }
    
    return ['object', obj] as const;
};

// Main conversion function
export const Mail = (mail: d_in.Mail): d_out.Value => {
    const obj: { [key: string]: d_out.Value } = {
        headers: headers(mail.headers),
        subject: mail.subject !== undefined ? string(mail.subject) : null_(),
        from: mail.from !== undefined ? array(mail.from, Address_Object) : null_(),
        to: mail.to !== undefined ? array(mail.to, Address_Object) : null_(),
        cc: mail.cc !== undefined ? array(mail.cc, Address_Object) : null_(),
        bcc: mail.bcc !== undefined ? array(mail.bcc, Address_Object) : null_(),
        replyTo: mail.replyTo !== undefined ? array(mail.replyTo, Address_Object) : null_(),
        date: mail.date !== undefined ? date(mail.date) : null_(),
        messageId: mail.messageId !== undefined ? string(mail.messageId) : null_(),
        inReplyTo: mail.inReplyTo !== undefined ? string(mail.inReplyTo) : null_(),
        references: mail.references !== undefined ? array(mail.references, string) : null_(),
        text: mail.text !== undefined ? string(mail.text) : null_(),
        html: (mail.html !== undefined && mail.html !== false) ? string(mail.html) : null_(),
        textAsHtml: mail.textAsHtml !== undefined ? string(mail.textAsHtml) : null_(),
        attachments: array(mail.attachments, Attachment)
    };
    
    return ['object', obj] as const;
};