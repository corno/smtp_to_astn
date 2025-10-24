import { AddressObject } from 'mailparser';

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
    headers: { [key: string]: any };
    subject?: string;
    from?: AddressObject;
    to?: AddressObject | AddressObject[];
    cc?: AddressObject | AddressObject[];
    bcc?: AddressObject | AddressObject[];
    date?: Date;
    messageId?: string;
    inReplyTo?: string;
    references?: string | string[];
    text?: string;
    html?: string | false;
    textAsHtml?: string;
    attachments: Attachment[];
}

export interface Headers {
    [key: string]: any;
}

// Re-export AddressObject from mailparser for convenience
export { AddressObject } from 'mailparser';