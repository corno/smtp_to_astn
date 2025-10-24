#!/usr/bin/env node

// Demo of the functional JSON approach with your JSON_Value type

type JSON_Value = 
 | readonly ['string', string]
 | readonly ['number', number]
 | readonly ['boolean', boolean]
 | readonly ['null']
 | readonly ['array', readonly JSON_Value[]]
 | readonly ['object', { [key: string]: JSON_Value }];

const toJSONValue = (value) => {
    if (value === null || value === undefined) {
        return ['null'];
    }
    
    if (typeof value === 'boolean') {
        return ['boolean', value];
    }
    
    if (typeof value === 'number') {
        if (!isFinite(value)) {
            return ['null'];
        }
        return ['number', value];
    }
    
    if (typeof value === 'string') {
        return ['string', value];
    }
    
    if (value instanceof Date) {
        return ['string', value.toISOString()];
    }
    
    if (Array.isArray(value)) {
        return ['array', value.map(toJSONValue)];
    }
    
    if (typeof value === 'object') {
        const entries = Object.entries(value)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, toJSONValue(v)]);
        
        const obj = {};
        entries.forEach(([key, jsonValue]) => {
            obj[key] = jsonValue;
        });
        
        return ['object', obj];
    }
    
    return ['null'];
};

// Test data
const testData = {
    name: "John Doe",
    age: 30,
    active: true,
    score: null,
    hobbies: ["reading", "coding"],
    address: {
        street: "123 Main St",
        city: "Springfield"
    },
    invalidNumber: Infinity,
    date: new Date('2025-10-24T10:30:00.000Z')
};

console.log("=== Original Data ===");
console.log(testData);

console.log("\n=== Intermediate JSON_Value Format ===");
const jsonValue = toJSONValue(testData);
console.log(JSON.stringify(jsonValue, null, 2));

console.log("\n=== Benefits of this approach ===");
console.log("1. Type safety with exhaustive pattern matching");
console.log("2. Clear separation between conversion and serialization");
console.log("3. Easy to extend with custom types");
console.log("4. Immutable intermediate representation");
console.log("5. Composable and testable functions");