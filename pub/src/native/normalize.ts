import * as d_in from "mailparser"

import * as d_out from "../types/normalized_email"

/**
 * Convert mailparser header value to our Header_Value tagged union format
 */
function Header_Value(key: string, value: any): d_out.Header_Value {
    const lowerKey = key.toLowerCase();
    
    // Date fields
    if (lowerKey === 'date' || lowerKey.startsWith('resent-date') || value instanceof Date) {
        return ['date', value instanceof Date ? value : new Date(value)];
    }
    
    // Address fields (single)
    if (lowerKey === 'from' || lowerKey === 'sender' || lowerKey.startsWith('resent-from') || lowerKey.startsWith('resent-sender')) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return ['address', Address_Object(value as d_in.AddressObject)];
        }
    }
    
    // Address fields (multiple)
    if (lowerKey === 'to' || lowerKey === 'cc' || lowerKey === 'bcc' || lowerKey === 'reply-to' || 
        lowerKey.startsWith('resent-to') || lowerKey.startsWith('resent-cc') || lowerKey.startsWith('resent-bcc')) {
        if (Array.isArray(value)) {
            return ['address_list', value.map(addr => Address_Object(addr as d_in.AddressObject))];
        } else if (value && typeof value === 'object') {
            return ['address_list', [Address_Object(value as d_in.AddressObject)]];
        }
    }
    
    // Message ID fields
    if (lowerKey === 'message-id' || lowerKey.startsWith('resent-message-id')) {
        return ['message_id', String(value)];
    }
    
    // Message ID lists (References, In-Reply-To)
    if (lowerKey === 'references' || lowerKey === 'in-reply-to') {
        if (Array.isArray(value)) {
            return ['message_id_list', value.map(String)];
        } else if (value) {
            return ['message_id_list', [String(value)]];
        }
        return ['message_id_list', []];
    }
    
    // Content-Type
    if (lowerKey === 'content-type') {
        if (value && typeof value === 'object' && value.value) {
            return ['content_type', {
                value: value.value,
                params: value.params || undefined
            }];
        }
        return ['content_type', { value: String(value) }];
    }
    
    // MIME Version
    if (lowerKey === 'mime-version') {
        return ['mime_version', String(value)];
    }
    
    // Content encoding
    if (lowerKey === 'content-transfer-encoding') {
        return ['content_encoding', String(value)];
    }
    
    // Content disposition
    if (lowerKey === 'content-disposition') {
        if (value && typeof value === 'object' && value.value) {
            return ['content_disposition', {
                value: value.value,
                params: value.params || undefined
            }];
        }
        return ['content_disposition', { value: String(value) }];
    }
    
    // Keywords
    if (lowerKey === 'keywords') {
        if (Array.isArray(value)) {
            return ['keywords', value.map(String)];
        } else if (typeof value === 'string') {
            return ['keywords', value.split(',').map(s => s.trim())];
        }
        return ['keywords', [String(value)]];
    }
    
    // Unstructured text fields
    if (lowerKey === 'subject' || lowerKey === 'comments') {
        return ['unstructured', String(value)];
    }
    
    // Received fields (simplified - mailparser usually parses these)
    if (lowerKey === 'received') {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return ['received', {
                from: value.from ? String(value.from) : undefined,
                by: value.by ? String(value.by) : undefined,
                via: value.via ? String(value.via) : undefined,
                with: value.with ? String(value.with) : undefined,
                id: value.id ? String(value.id) : undefined,
                for: value.for ? String(value.for) : undefined,
                date: value.date instanceof Date ? value.date : new Date()
            }];
        }
        // If it's a string (raw received header), treat as unknown
        return ['unknown', String(value)];
    }
    
    // Default: treat as unstructured text
    return ['unknown', String(value)];
}

/**
 * Normalize a single AddressObject to our normalized format
 */
function Address_Object(addressObj: d_in.AddressObject): d_out.Address_Object {
    return {
        value: addressObj.value.map(emailAddr => Address(emailAddr)),
        html: addressObj.html,
        text: addressObj.text
    };
}

/**
 * Normalize a single Address to our normalized format
 */
function Address(emailAddr: { address?: string; name?: string }): d_out.Address {
    return {
        address: emailAddr.address,
        name: emailAddr.name || ''
    };
}

/**
 * Normalize a single AddressObject or array of AddressObjects to always be an array
 */
function addresses(addr: d_in.AddressObject | d_in.AddressObject[] | undefined): d_out.Address_Object[] | undefined {
    if (!addr) return undefined;
    
    const addresses = Array.isArray(addr) ? addr : [addr];
    
    return addresses.map(Address_Object);
}

/**
 * Normalize references to always be an array
 */
function references(refs: string | string[] | undefined): string[] | undefined {
    if (!refs) return undefined;
    return Array.isArray(refs) ? refs : [refs];
}

/**
 * Normalize attachments from mailparser format to our format
 */
function Attachment(att: d_in.Attachment): d_out.Attachment {
    return {
        filename: att.filename,
        contentType: att.contentType,
        contentDisposition: att.contentDisposition,
        checksum: att.checksum,
        size: att.size,
        content: att.content ? att.content.toString('base64') : undefined,
        cid: att.cid,
        related: att.related || false
    };
}

/**
 * Transform raw mailparser output into a normalized, consistent format
 */
export const Mail = ($: d_in.ParsedMail): d_out.Mail => {
    // Convert headers to our tagged union format
    const headers: { [key: string]: d_out.Header_Value } = {};
    if ($.headers) {
        for (const [key, value] of $.headers) {
            headers[key] = Header_Value(key, value);
        }
    }

    return {
        headers,
        subject: $.subject,
        from: addresses($.from),
        to: addresses($.to),
        cc: addresses($.cc),
        bcc: addresses($.bcc),
        replyTo: addresses($.replyTo),
        date: $.date,
        messageId: $.messageId,
        inReplyTo: $.inReplyTo,
        references: references($.references),
        text: $.text,
        html: $.html,
        textAsHtml: $.textAsHtml,
        attachments: ($.attachments || []).map(Attachment)
    };
};