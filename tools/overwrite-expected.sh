#!/bin/bash

# Generate expected.astn files for all test cases
echo "=== Generating Expected ASTN Files ==="
echo "This will create expected.astn files for regression testing"
echo

cd /home/corno/workspace/smtp_to_astn/pub

# Make sure we have a built version
echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo
echo "🔄 Generating expected outputs..."
echo

# Counter for generation
total=0
generated=0
failed=0

# Function to generate expected output for a single test
generate_expected() {
    local test_dir=$1
    local test_name=$(basename "$test_dir")
    
    echo "Processing: $test_name"
    echo "----------------------------------------"
    
    total=$((total + 1))
    
    local source_file="$test_dir/source.eml"
    local expected_file="$test_dir/expected.astn"
    
    if [ ! -f "$source_file" ]; then
        echo "❌ Source file not found: $source_file"
        failed=$((failed + 1))
        return
    fi
    
    # Generate the expected output
    if output=$(cat "$source_file" | node dist/index.js 2>&1); then
        # Just save the output directly (it's ASTN format, not JSON)
        echo "$output" > "$expected_file"
        echo "✅ Generated expected.astn"
        generated=$((generated + 1))
    else
        echo "❌ Failed to parse source file"
        echo "Error: $output"
        failed=$((failed + 1))
    fi
    
    echo
}

# Process all test directories
for test_dir in ../data/test/*/; do
    if [ -d "$test_dir" ] && [ -f "$test_dir/source.eml" ]; then
        generate_expected "$test_dir"
    fi
done

# Summary
echo "==============================================="
echo "📊 Generation Results Summary"
echo "==============================================="
echo "Total tests: $total"
echo "Generated: $generated"
echo "Failed: $failed"

if [ $failed -eq 0 ]; then
    echo "🎉 All expected.astn files generated successfully!"
    exit 0
else
    echo "⚠️  Some generations failed"
    exit 1
fi