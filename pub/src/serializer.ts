import { Value } from './types/json.js';

const escapeString = (str: string): string => {
    // Ensure we have a string
    const safeStr = typeof str === 'string' ? str : String(str);
    return safeStr
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/[\b]/g, '\\b')
        .replace(/\f/g, '\\f')
        .replace(/[\u0000-\u001f\u007f-\u009f]/g, (match) => {
            return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4);
        });
};

// Functional serializer for JSON_Value
export const serializeJSONValue = (jsonValue: Value, indent: string = '  ', level: number = 0): string => {
    const currentIndent = indent.repeat(level);
    const nextIndent = indent.repeat(level + 1);
    
    const [type, value] = jsonValue;
    
    switch (type) {
        case 'null':
            return 'null';
            
        case 'boolean':
        case 'number':
            return value.toString();
            
        case 'string':
            return `"${escapeString(value)}"`;
            
        case 'array':
            if (value.length === 0) {
                return '[]';
            }
            const arrayElements = value
                .map(item => `${nextIndent}${serializeJSONValue(item, indent, level + 1)}`)
                .join(',\n');
            return `[\n${arrayElements}\n${currentIndent}]`;
            
        case 'object':
            const keys = Object.keys(value).sort();
            if (keys.length === 0) {
                return '{}';
            }
            const objectProperties = keys
                .map(key => {
                    const serializedValue = serializeJSONValue(value[key], indent, level + 1);
                    return `${nextIndent}"${escapeString(key)}": ${serializedValue}`;
                })
                .join(',\n');
            return `{\n${objectProperties}\n${currentIndent}}`;
            
        default:
            // TypeScript will ensure this never happens due to exhaustive checking
            const _exhaustive: never = type;
            return 'null';
    }
};