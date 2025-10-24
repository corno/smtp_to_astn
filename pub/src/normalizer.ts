import { ParsedMail, AddressObject } from 'mailparser';

import * as normalized from "./types/normalized_email"

/**
 * Normalized types that provide a cleaner, more consistent interface
 * than the raw mailparser output
 */


/**
 * Normalize a single AddressObject or array of AddressObjects to always be an array
 */
function normalizeAddresses(addr: AddressObject | AddressObject[] | undefined): normalized.AddressObject[] | undefined {
    if (!addr) return undefined;
    
    const addresses = Array.isArray(addr) ? addr : [addr];
    
    return addresses.map(addressObj => ({
        value: addressObj.value.map(emailAddr => ({
            address: emailAddr.address,
            name: emailAddr.name || ''
        })),
        html: addressObj.html,
        text: addressObj.text
    }));
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
 * - Providing a cleaner, more predictable interface
 */
export function normalizeMailparserOutput(parsed: ParsedMail): normalized.SMTPMessage {
    return {
        headers: parsed.headers ? Object.fromEntries(parsed.headers) : {},
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