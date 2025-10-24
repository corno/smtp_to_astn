import * as _ea from 'exupery-core-alg'

import * as d_in from "mailparser"

import * as d_out from "../types/normalized_email"

/**
 * Normalized types that provide a cleaner, more consistent interface
 * than the raw mailparser output
 */

/**
 * Convert mailparser header value to our Header_Value tagged union format
 */
function convertToHeaderValue(key: string, value: any): d_out.Header_Value {
    const lowerKey = key.toLowerCase();
    
    // Date fields
    if (lowerKey === 'date' || lowerKey.startsWith('resent-date') || value instanceof Date) {
        return ['date', value instanceof Date ? value : new Date(value)];
    }
    
    // Address fields (single)
    if (lowerKey === 'from' || lowerKey === 'sender' || lowerKey.startsWith('resent-from') || lowerKey.startsWith('resent-sender')) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return ['address', normalizeAddressObject(value as d_in.AddressObject)];
        }
    }
    
    // Address fields (multiple)
    if (lowerKey === 'to' || lowerKey === 'cc' || lowerKey === 'bcc' || lowerKey === 'reply-to' || 
        lowerKey.startsWith('resent-to') || lowerKey.startsWith('resent-cc') || lowerKey.startsWith('resent-bcc')) {
        if (Array.isArray(value)) {
            return ['address_list', value.map(addr => normalizeAddressObject(addr as d_in.AddressObject))];
        } else if (value && typeof value === 'object') {
            return ['address_list', [normalizeAddressObject(value as d_in.AddressObject)]];
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
                params: value.params ? _ea.set(value.params) : _ea.not_set()
            }];
        }
        return ['content_type', { 
            value: String(value), 
            params: _ea.not_set()
        }];
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
                params: value.params ? _ea.set(value.params) : _ea.not_set()
            }];
        }
        return ['content_disposition', { 
            value: String(value),
            params: _ea.not_set()
        }];
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
                from: value.from ? _ea.set(String(value.from)) : _ea.not_set(),
                by: value.by ? _ea.set(String(value.by)) : _ea.not_set(),
                via: value.via ? _ea.set(String(value.via)) : _ea.not_set(),
                with: value.with ? _ea.set(String(value.with)) : _ea.not_set(),
                id: value.id ? _ea.set(String(value.id)) : _ea.not_set(),
                for: value.for ? _ea.set(String(value.for)) : _ea.not_set(),
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
function normalizeAddressObject(addressObj: d_in.AddressObject): d_out.Address_Object {
    return {
        value: addressObj.value.map(emailAddr => ({
            address: emailAddr.address ? _ea.set(emailAddr.address) : _ea.not_set(),
            name: emailAddr.name || ''
        })),
        html: addressObj.html,
        text: addressObj.text
    };
}

/**
 * Normalize a single AddressObject or array of AddressObjects to always be an array
 */
function addresses(addr: d_in.AddressObject | d_in.AddressObject[] | undefined): d_out.Address_Object[] | undefined {
    if (!addr) return undefined;
    
    const addresses = Array.isArray(addr) ? addr : [addr];
    
    return addresses.map(normalizeAddressObject);
}

/**
 * Normalize the from field to a single Address_Object (RFC 5322 compliant)
 */
function fromAddress(addr: d_in.AddressObject | d_in.AddressObject[] | undefined): d_out.Address_Object | undefined {
    if (!addr) return undefined;
    
    // If it's an array, take the first address (RFC 5322 says there should be only one)
    const singleAddr = Array.isArray(addr) ? addr[0] : addr;
    
    return singleAddr ? normalizeAddressObject(singleAddr) : undefined;
}

/**
 * Normalize references to always be an array
 */
function normalizeReferences(refs: string | string[] | undefined): string[] | undefined {
    if (!refs) return undefined;
    return Array.isArray(refs) ? refs : [refs];
}

/**
 * Normalize attachments from mailparser format to our format
 */
function normalizeAttachments(attachments: any[]): d_out.Attachment[] {
    return attachments.map(att => ({
        filename: att.filename ? _ea.set(att.filename) : _ea.not_set(),
        contentType: att.contentType,
        contentDisposition: att.contentDisposition ? _ea.set(att.contentDisposition) : _ea.not_set(),
        checksum: att.checksum,
        size: att.size,
        content: att.content ? _ea.set(att.content.toString('base64')) : _ea.not_set(),
        cid: att.cid ? _ea.set(att.cid) : _ea.not_set(),
        related: att.related !== undefined ? _ea.set(att.related || false) : _ea.not_set()
    }));
}

/**
 * Transform raw mailparser output into a normalized, consistent format
 * 
 * This function handles:
 * - Converting address unions to consistent arrays
 * - Normalizing references to arrays
 * - Converting attachments to base64 strings
 * - Converting headers to tagged union format
 * - Providing a cleaner, more predictable interface
 */
export function normalizeMailparserOutput(parsed: d_in.ParsedMail): d_out.Mail {
    // Convert headers to our tagged union format
    const headers: { [key: string]: d_out.Header_Value } = {};
    if (parsed.headers) {
        for (const [key, value] of parsed.headers) {
            headers[key] = convertToHeaderValue(key, value);
        }
    }

    return {
        headers,
        subject: parsed.subject === undefined ? _ea.not_set(): _ea.set(parsed.subject),
        from: (() => {
            const fromAddr = fromAddress(parsed.from);
            return fromAddr === undefined ? _ea.not_set() : _ea.set(fromAddr);
        })(),
        to: addresses(parsed.to) || [],
        cc: addresses(parsed.cc) || [],
        bcc: addresses(parsed.bcc) || [],
        replyTo: addresses(parsed.replyTo) || [],
        date: parsed.date === undefined ? _ea.not_set() : _ea.set(parsed.date),
        messageId: parsed.messageId === undefined ? _ea.not_set() : _ea.set(parsed.messageId),
        inReplyTo: parsed.inReplyTo === undefined ? _ea.not_set() : _ea.set(parsed.inReplyTo),
        references: normalizeReferences(parsed.references) || [],
        text: parsed.text === undefined ? _ea.not_set() : _ea.set(parsed.text),
        html: parsed.html === undefined ? _ea.not_set() : _ea.set(parsed.html),
        textAsHtml: parsed.textAsHtml === undefined ? _ea.not_set() : _ea.set(parsed.textAsHtml),
        attachments: normalizeAttachments(parsed.attachments || [])
    };
}