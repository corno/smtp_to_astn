import * as _et from 'exupery-core-types'

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

const array_old = <T>(arr: T[], converter: (item: T) => d_out.Value): d_out.Value => {
    return ['array', arr.map(converter)] as const;
};

const array = <T>(arr: _et.Array<T>, converter: (item: T) => d_out.Value): d_out.Value => {
    return ['array', arr.__get_raw_copy().map(converter)] as const;
};

// Convert Address
const Address = (address: d_in.Address): d_out.Value => {
    const obj: { [key: string]: d_out.Value } = {
        name: string(address.name),
        address: address.address.transform(
            ($) => string($),
            () => null_()
        )
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
        filename: attachment.filename.transform(
            ($) => string($),
            () => null_()
        ),
        contentType: string(attachment.contentType),
        contentDisposition: attachment.contentDisposition.transform(
            ($) => string($),
            () => null_()
        ),
        checksum: string(attachment.checksum),
        size: number(attachment.size),
        content: attachment.content.transform(
            ($) => string($),
            () => null_()
        ),
        cid: attachment.cid.transform(
            ($) => string($),
            () => null_()
        ),
        related: attachment.related.transform(
            ($) => boolean($),
            () => boolean(false)
        )
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
                params: value.params.transform(
                    ($) => ['object', Object.fromEntries(
                        Object.entries($).map(([k, v]) => [k, string(v)])
                    )] as const,
                    () => null_()
                )
            };
            return ['array', [string(headerType), ['object', contentTypeObj]]] as const;
            
        case 'mime_version':
        case 'content_encoding':
            return ['array', [string(headerType), string(value)]] as const;
            
        case 'content_disposition':
            const dispositionObj: { [key: string]: d_out.Value } = {
                value: string(value.value),
                params: value.params.transform(
                    ($) => ['object', Object.fromEntries(
                        Object.entries($).map(([k, v]) => [k, string(v)])
                    )] as const,
                    () => null_()
                )
            };
            return ['array', [string(headerType), ['object', dispositionObj]]] as const;
            
        case 'received':
            const receivedObj: { [key: string]: d_out.Value } = {
                from: value.from.transform(
                    ($) => string($),
                    () => null_()
                ),
                by: value.by.transform(
                    ($) => string($),
                    () => null_()
                ),
                via: value.via.transform(
                    ($) => string($),
                    () => null_()
                ),
                with: value.with.transform(
                    ($) => string($),
                    () => null_()
                ),
                id: value.id.transform(
                    ($) => string($),
                    () => null_()
                ),
                for: value.for.transform(
                    ($) => string($),
                    () => null_()
                ),
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
        subject: mail.subject.transform(
            ($) => string($),
            () => null_()
        ),
        from: mail.from.transform(
            ($) => Address_Object($),
            () => null_()
        ),
        to: array(mail.to, Address_Object),
        cc: array(mail.cc, Address_Object),
        bcc: array(mail.bcc, Address_Object),
        replyTo: array(mail.replyTo, Address_Object),
        date: mail.date.transform(
            ($) => date($),
            () => null_()
        ),
        messageId: mail.messageId.transform(
            ($) => string($),
            () => null_()
        ),
        inReplyTo: mail.inReplyTo.transform(
            ($) => string($),
            () => null_()
        ),
        references: array(mail.references, string),
        text: mail.text.transform(
            ($) => string($),
            () => null_()
        ),
        html: mail.html.transform(
            ($) => $ !== false ? string($) : null_(),
            () => null_()
        ),
        textAsHtml: mail.textAsHtml.transform(
            ($) => string($),
            () => null_()
        ),
        attachments: array(mail.attachments, Attachment)
    };
    
    return ['object', obj] as const;
};