#!/bin/bash

# Local Testing Script for GitHub Actions Workflows
# This helps you test workflow logic before pushing to production

set -e

echo "🧪 GitHub Actions Workflow Testing Guide"
echo "========================================="
echo ""

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo "❌ 'act' is not installed"
    echo ""
    echo "Install with:"
    echo "  macOS:  brew install act"
    echo "  Linux:  curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    echo ""
    echo "Learn more: https://github.com/nektos/act"
    echo ""
    echo "Alternative: Test individual scripts manually (see below)"
    echo ""
fi

echo "📋 Available Tests:"
echo ""
echo "1. Test Site Accessibility (curl with redirects)"
echo "   curl -L -s -o /dev/null -w \"%{http_code}\" https://neuralsummary.com"
echo ""

echo "2. Test API Health Check (requires SSH access to server)"
echo "   ssh root@94.130.27.115 'docker exec transcribe-api wget --spider -q http://localhost:3001/health && echo \"API Healthy\" || echo \"API Failed\"'"
echo ""

echo "3. Test Redis Health (requires SSH access)"
echo "   ssh root@94.130.27.115 'docker exec transcribe-redis redis-cli ping'"
echo ""

echo "4. Validate Workflow YAML Syntax"
echo "   yamllint .github/workflows/*.yml"
echo ""

echo "5. Run Full Workflow with 'act' (if installed)"
echo "   act workflow_dispatch -W .github/workflows/health-check.yml"
echo ""

echo "========================================="
echo ""

# Quick tests you can run without SSH
echo "Running quick local tests..."
echo ""

# Test 1: Site accessibility
echo "Test 1: Checking site accessibility..."
SITE_STATUS=$(curl -L -s -o /dev/null -w "%{http_code}" https://neuralsummary.com 2>/dev/null || echo "000")
if [ "$SITE_STATUS" = "200" ]; then
    echo "✅ Site is accessible (HTTP $SITE_STATUS)"
else
    echo "❌ Site returned HTTP $SITE_STATUS"
fi
echo ""

# Test 2: Check if YAML is valid
echo "Test 2: Validating YAML syntax..."
if command -v yamllint &> /dev/null; then
    yamllint .github/workflows/*.yml && echo "✅ All workflow files have valid YAML syntax"
else
    echo "⏭️  yamllint not installed (brew install yamllint)"
    # Basic check - does it parse?
    for file in .github/workflows/*.yml; do
        if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            echo "✅ $file - syntax OK"
        else
            echo "❌ $file - syntax error"
        fi
    done
fi
echo ""

echo "========================================="
echo "✅ Local tests complete!"
echo ""
echo "To test deployment logic without pushing:"
echo "  1. Install 'act': brew install act"
echo "  2. Run: act workflow_dispatch -W .github/workflows/deploy.yml --secret-file .secrets"
echo ""
echo "Note: Full SSH-based tests require server access"
