import { ParsedMail, AddressObject } from 'mailparser';

import * as normalized from "./types/normalized_email"

/**
 * Normalized types that provide a cleaner, more consistent interface
 * than the raw mailparser output
 */

/**
 * Convert mailparser header value to our Header_Value tagged union format
 */
function convertToHeaderValue(key: string, value: any): normalized.Header_Value {
    const lowerKey = key.toLowerCase();
    
    // Date fields
    if (lowerKey === 'date' || lowerKey.startsWith('resent-date') || value instanceof Date) {
        return ['date', value instanceof Date ? value : new Date(value)];
    }
    
    // Address fields (single)
    if (lowerKey === 'from' || lowerKey === 'sender' || lowerKey.startsWith('resent-from') || lowerKey.startsWith('resent-sender')) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return ['address', normalizeAddressObject(value as AddressObject)];
        }
    }
    
    // Address fields (multiple)
    if (lowerKey === 'to' || lowerKey === 'cc' || lowerKey === 'bcc' || lowerKey === 'reply-to' || 
        lowerKey.startsWith('resent-to') || lowerKey.startsWith('resent-cc') || lowerKey.startsWith('resent-bcc')) {
        if (Array.isArray(value)) {
            return ['address_list', value.map(addr => normalizeAddressObject(addr as AddressObject))];
        } else if (value && typeof value === 'object') {
            return ['address_list', [normalizeAddressObject(value as AddressObject)]];
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
function normalizeAddressObject(addressObj: AddressObject): normalized.AddressObject {
    return {
        value: addressObj.value.map(emailAddr => ({
            address: emailAddr.address,
            name: emailAddr.name || ''
        })),
        html: addressObj.html,
        text: addressObj.text
    };
}

/**
 * Normalize a single AddressObject or array of AddressObjects to always be an array
 */
function normalizeAddresses(addr: AddressObject | AddressObject[] | undefined): normalized.AddressObject[] | undefined {
    if (!addr) return undefined;
    
    const addresses = Array.isArray(addr) ? addr : [addr];
    
    return addresses.map(normalizeAddressObject);
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
function normalizeAttachments(attachments: any[]): normalized.Attachment[] {
    return attachments.map(att => ({
        filename: att.filename,
        contentType: att.contentType,
        contentDisposition: att.contentDisposition,
        checksum: att.checksum,
        size: att.size,
        content: att.content ? att.content.toString('base64') : undefined,
        cid: att.cid,
        related: att.related || false
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
export function normalizeMailparserOutput(parsed: ParsedMail): normalized.SMTPMessage {
    // Convert headers to our tagged union format
    const headers: { [key: string]: normalized.Header_Value } = {};
    if (parsed.headers) {
        for (const [key, value] of parsed.headers) {
            headers[key] = convertToHeaderValue(key, value);
        }
    }

    return {
        headers,
        subject: parsed.subject,
        from: normalizeAddresses(parsed.from),
        to: normalizeAddresses(parsed.to),
        cc: normalizeAddresses(parsed.cc),
        bcc: normalizeAddresses(parsed.bcc),
        replyTo: normalizeAddresses(parsed.replyTo),
        date: parsed.date,
        messageId: parsed.messageId,
        inReplyTo: parsed.inReplyTo,
        references: normalizeReferences(parsed.references),
        text: parsed.text,
        html: parsed.html,
        textAsHtml: parsed.textAsHtml,
        attachments: normalizeAttachments(parsed.attachments || [])
    };
}