/**
 * Normalized types that provide a cleaner, more consistent interface
 * than the raw mailparser output
 */

export interface Address {
    address?: string;
    name: string;
}

export interface AddressObject {
    value: Address[];
    html: string;
    text: string;
}

export interface Attachment {
    filename?: string;
    contentType: string;
    contentDisposition?: string;
    checksum: string;
    size: number;
    content?: string; // base64 encoded
    cid?: string;
    related?: boolean;
}

export interface SMTPMessage {
    headers: { [key: string]: any }; // Raw headers map
    subject?: string;
    from?: AddressObject[];    // Always array
    to?: AddressObject[];      // Always array
    cc?: AddressObject[];      // Always array
    bcc?: AddressObject[];     // Always array
    replyTo?: AddressObject[]; // Always array
    date?: Date;
    messageId?: string;
    inReplyTo?: string;
    references?: string[];               // Always array
    text?: string;
    html?: string | false;
    textAsHtml?: string;
    attachments: Attachment[];
}