import * as _et from 'exupery-core-types'

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
    headers: { [key: string]: Header_Value }; // Raw headers map
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

// Tagged union for different header value types
export type Header_Value = 
    | ["unstructured", string]                    // Simple text headers like Subject, Comments
    | ["date", Date]                             // Date headers
    | ["address", AddressObject]                 // Single address headers like From, Sender
    | ["address_list", AddressObject[]]          // Multiple address headers like To, Cc
    | ["message_id", string]                     // Message-ID format
    | ["message_id_list", string[]]              // References, In-Reply-To (can be multiple)
    | ["content_type", {                         // Content-Type with parameters
        value: string;
        params?: { [key: string]: string };
    }]
    | ["mime_version", string]                   // MIME-Version
    | ["content_encoding", string]               // Content-Transfer-Encoding
    | ["content_disposition", {                  // Content-Disposition with parameters
        value: string;
        params?: { [key: string]: string };
    }]
    | ["received", {                             // Received trace fields
        from?: string;
        by?: string;
        via?: string;
        with?: string;
        id?: string;
        for?: string;
        date: Date;
    }]
    | ["keywords", string[]]                     // Keywords field (comma-separated)
    | ["unknown", string];                       // Fallback for unrecognized headers