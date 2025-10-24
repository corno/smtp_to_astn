#!/usr/bin/env node

// Quick test to compare our JSON builder with JSON.stringify
const testObject = {
  string: "Hello \"World\"",
  number: 42,
  boolean: true,
  null_value: null,
  array: [1, 2, "three"],
  nested: {
    b_first: "should be sorted",
    a_second: "alphabetically"
  },
  special_chars: "Line 1\nLine 2\tTabbed\rCarriage Return",
  unicode: "Unicode: \u0001\u001f"
};

console.log("=== Custom JSON Builder ===");
// This would use our custom builder (simplified version for testing)
class SimpleJSONBuilder {
  escapeString(str) {
    return str
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
  }
  
  build(obj) {
    return JSON.stringify(obj, Object.keys(obj).sort(), 2);
  }
}

const builder = new SimpleJSONBuilder();
console.log(builder.build(testObject));

console.log("\n=== Standard JSON.stringify ===");
console.log(JSON.stringify(testObject, null, 2));