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
    headers: Headers;
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

// Tagged union for different header value types
export type HeaderValue = 
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

export interface Headers {
    [key: string]: HeaderValue;
}

// Re-export AddressObject from mailparser for convenience
export { AddressObject } from 'mailparser';