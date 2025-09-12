#!/bin/bash
# AI Publishing International LLP MCP Personalization Test Script

echo "🔍 Testing AI Publishing International LLP MCP Personalization"
echo "=================================================="

MCP_URL="https://mcp.aipub.2100.cool"

# Test function for each member
test_member_personalization() {
    local email="$1"
    local expected_name="$2"
    local expected_title="$3"
    
    echo ""
    echo "🧪 Testing: $email"
    echo "Expected: $expected_name - $expected_title"
    echo "----------------------------------------"
    
    # Test personalization by checking for name and title in response
    response=$(curl -s "$MCP_URL/?email=$email" | grep -o "$expected_name\|$expected_title" | head -3)
    
    if [[ -n "$response" ]]; then
        echo "✅ PASS: Personalization working"
        echo "Found: $(echo "$response" | tr '\n' ', ')"
    else
        echo "❌ FAIL: Personalization not found"
    fi
}

# Test each AI Publishing International LLP member
echo "Testing AI Publishing International LLP Members:"

test_member_personalization "mo@coaching2100.com" "Morgan" "Executive Administrative Officer"
test_member_personalization "uk@coaching2100.com" "Roger Mahoney" "Executive Director"
test_member_personalization "pc@coaching2100.com" "Phillip Corey Roark" "Chief Executive Officer"
test_member_personalization "jg@coaching2100.com" "Joshua Galbreath" "Executive Growth Officer"
test_member_personalization "et@coaching2100.com" "Eduardo Testa" "International Growth Officer"
test_member_personalization "av@coaching2100.com" "Alexander Oliveros" "Publicidad Latam"

echo ""
echo "🔍 Testing MCP Service Health:"
echo "==============================="

# Test basic connectivity
status_code=$(curl -s -o /dev/null -w "%{http_code}" "$MCP_URL")
echo "HTTP Status: $status_code"

if [ "$status_code" = "200" ]; then
    echo "✅ MCP Service: Online"
else
    echo "❌ MCP Service: Issues detected"
fi

# Test headers for MCP-specific information
echo ""
echo "🔍 Testing MCP Headers:"
echo "======================="

curl -s -I "$MCP_URL" | grep -E "x-mcp|x-pcp|x-quantum|x-dr-claude" | while read -r header; do
    echo "✅ $header"
done

echo ""
echo "🔍 Testing Interface Targeting:"
echo "==============================="

# Test interface targeting with different emails
interfaces_test=$(curl -s "$MCP_URL/?email=mo@coaching2100.com" | grep -o "mcp.aipub.2100.cool\|MOCOA\|AI Publishing" | head -3)

if [[ -n "$interfaces_test" ]]; then
    echo "✅ Interface targeting working"
    echo "Found: $(echo "$interfaces_test" | tr '\n' ', ')"
else
    echo "❌ Interface targeting issues"
fi

echo ""
echo "🔍 Testing Authentication Levels:"
echo "================================="

# Test for different auth level indicators
auth_test=$(curl -s "$MCP_URL/?email=mo@coaching2100.com" | grep -o "authLevel.*5\|enterprise\|executive" | head -3)

if [[ -n "$auth_test" ]]; then
    echo "✅ Authentication levels working"
    echo "Found: $(echo "$auth_test" | tr '\n' ', ')"
else
    echo "❌ Authentication level issues"
fi

echo ""
echo "📊 MCP Personalization Test Summary"
echo "==================================="
echo "MCP Endpoint: $MCP_URL"
echo "Test Date: $(date)"
echo "LLP Members in Registry: 6"
echo "Status: $([ "$status_code" = "200" ] && echo "OPERATIONAL" || echo "ISSUES DETECTED")"

echo ""
echo "🎯 Next Steps:"
echo "- Test with actual LLP member authentication"
echo "- Verify role-based access controls"
echo "- Test regional personalization"
echo "- Validate package-level features"
