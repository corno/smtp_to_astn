#!/bin/bash

# Regression test suite for SMTP to JSON converter
echo "=== SMTP to JSON Regression Test Suite ==="
echo "Testing against expected outputs for regression detection..."
echo

cd /home/corno/workspace/smtp_to_astn/pub

#!/bin/bash

# Regression test suite for SMTP to JSON converter
echo "=== SMTP to JSON Regression Test Suite ==="
echo "Testing against expected outputs for regression detection..."
echo

cd /home/corno/workspace/smtp_to_astn/pub

# Counter for tests
total=0
passed=0
failed=0

# Array to store failed test info for Beyond Compare
failed_tests=()

# Function to run a single regression test
run_regression_test() {
    local test_dir=$1
    local test_name=$(basename "$test_dir")
    
    echo "Testing: $test_name"
    echo "----------------------------------------"
    
    total=$((total + 1))
    
    local source_file="$test_dir/source.eml"
    local expected_file="$test_dir/expected.json"
    local actual_file="$test_dir/actual.json"
    
    if [ ! -f "$source_file" ]; then
        echo "❌ Source file not found: $source_file"
        failed=$((failed + 1))
        return
    fi
    
    if [ ! -f "$expected_file" ]; then
        echo "❌ Expected file not found: $expected_file"
        echo "💡 Run generate-expected.sh to create expected outputs"
        failed=$((failed + 1))
        return
    fi
    
    # Run the test and capture output
    if actual_output=$(cat "$source_file" | node dist/index.js 2>&1); then
        # Validate JSON and pretty-print for comparison
        if actual_json=$(echo "$actual_output" | jq . 2>/dev/null); then
            expected_json=$(cat "$expected_file")
            
            # Compare the JSON outputs
            if [ "$actual_json" = "$expected_json" ]; then
                echo "✅ Output matches expected"
                passed=$((passed + 1))
                # Remove actual.json if test passes
                [ -f "$actual_file" ] && rm "$actual_file"
            else
                echo "❌ Output differs from expected"
                echo "Expected vs Actual differences:"
                echo "--- Expected ---"
                echo "$expected_json" | head -5
                echo "..."
                echo "--- Actual ---"
                echo "$actual_json" | head -5
                echo "..."
                
                # Save actual output to file for comparison
                echo "$actual_json" > "$actual_file"
                echo "💡 Actual output saved to: $actual_file"
                echo "💡 Use 'diff -u $expected_file $actual_file' for full diff"
                
                # Add to failed tests array
                failed_tests+=("$test_dir")
                failed=$((failed + 1))
            fi
        else
            echo "❌ Invalid JSON output"
            echo "Error: $actual_output"
            # Save error output to actual.json file
            echo "$actual_output" > "$actual_file"
            failed_tests+=("$test_dir")
            failed=$((failed + 1))
        fi
    else
        echo "❌ Failed to parse"
        echo "Error: $actual_output"
        # Save error output to actual.json file
        echo "$actual_output" > "$actual_file"
        failed_tests+=("$test_dir")
        failed=$((failed + 1))
    fi
    
    echo
}

# Make sure we have a built version
echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo
echo "🧪 Running regression tests..."
echo

# Run tests on all test directories
for test_dir in ../data/test/*/; do
    if [ -d "$test_dir" ] && [ -f "$test_dir/source.eml" ]; then
        run_regression_test "$test_dir"
    fi
done

# Summary
echo "==============================================="
echo "📊 Regression Test Results Summary"
echo "==============================================="
echo "Total tests: $total"
echo "Passed: $passed"
echo "Failed: $failed"

if [ $failed -eq 0 ]; then
    echo "🎉 All regression tests passed!"
    echo "✅ No regressions detected"
    exit 0
else
    echo "⚠️  Regression detected!"
    echo "💡 Some outputs don't match expected results"
    echo "   Run generate-expected.sh to update expected outputs if changes are intentional"
    echo
    
    # Open Beyond Compare for each failed test
    if [ ${#failed_tests[@]} -gt 0 ]; then
        echo "🔍 Opening Beyond Compare for failed tests..."
        echo "   (Close each Beyond Compare window to proceed to the next)"
        echo
        
        # Check if Beyond Compare is available
        if command -v bcompare &> /dev/null; then
            for test_dir in "${failed_tests[@]}"; do
                test_name=$(basename "$test_dir")
                expected_file="$test_dir/expected.json"
                actual_file="$test_dir/actual.json"
                
                if [ -f "$expected_file" ] && [ -f "$actual_file" ]; then
                    echo "📋 Comparing: $test_name"
                    echo "   Expected: $expected_file"
                    echo "   Actual:   $actual_file"
                    bcompare "$expected_file" "$actual_file"
                fi
            done
        else
            echo "⚠️  Beyond Compare (bcompare) not found in PATH"
            echo "   Install Beyond Compare or use manual diff commands:"
            for test_dir in "${failed_tests[@]}"; do
                test_name=$(basename "$test_dir")
                expected_file="$test_dir/expected.json"
                actual_file="$test_dir/actual.json"
                echo "   diff -u '$expected_file' '$actual_file'"
            done
        fi
    fi
    
    exit 1
fi