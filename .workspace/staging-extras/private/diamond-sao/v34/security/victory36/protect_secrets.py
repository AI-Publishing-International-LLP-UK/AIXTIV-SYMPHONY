#!/usr/bin/env python3
import re
import os
import glob

def protect_diamond_sao_secrets(filepath):
    """Replace Diamond SAO constants with environment variable references"""
    print(f"Protecting secrets in: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Create backup
    backup_path = f"{filepath}.pre_secrets"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Replace Diamond SAO classification levels
    content = re.sub(
        r"this\.classificationLevel = 'DIAMOND_SAO_APEX'",
        "this.classificationLevel = process.env.DIAMOND_SAO_CLASSIFICATION_LEVEL || 'RESTRICTED'",
        content
    )
    
    # Replace sensitive architecture IDs
    content = re.sub(
        r"this\.architectureId = 'VICTORY36_TRUE_ASOOS_METHODOLOGY'",
        "this.architectureId = process.env.VICTORY36_ARCHITECTURE_ID || 'V36_METHODOLOGY'",
        content
    )
    
    # Replace collective IDs
    content = re.sub(
        r"this\.collectiveId = 'VICTORY36_HQRIX_COLLECTIVE'",
        "this.collectiveId = process.env.VICTORY36_COLLECTIVE_ID || 'V36_COLLECTIVE'",
        content
    )
    
    # Replace integration IDs
    content = re.sub(
        r"this\.integrationId = 'VICTORY36_SALLYPORT_DIAMOND'",
        "this.integrationId = process.env.VICTORY36_INTEGRATION_ID || 'V36_INTEGRATION'",
        content
    )
    
    # Replace specific access patterns
    content = re.sub(
        r"access: 'RESTRICTED_DIAMOND_SAO'",
        "access: process.env.DIAMOND_SAO_ACCESS_LEVEL || 'RESTRICTED'",
        content
    )
    
    # Add environment variable loading at the top if not present
    if 'require(\'dotenv\')' not in content and 'process.env.' in content:
        # Find the first require statement and add dotenv after it
        require_match = re.search(r"(const .* = require\('.*'\);)", content)
        if require_match:
            first_require = require_match.group(1)
            content = content.replace(
                first_require,
                f"{first_require}\nrequire('dotenv').config();"
            )
        else:
            # Add at the top if no requires found
            content = "require('dotenv').config();\n" + content
    
    # Write the protected content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Protected secrets in: {filepath}")

def create_env_template():
    """Create a template for environment variables"""
    env_template = """# Victory36 Diamond SAO Environment Variables
# WARNING: These values are highly classified - store in Cloudflare R2 secrets

# Classification and Security Levels
DIAMOND_SAO_CLASSIFICATION_LEVEL=DIAMOND_SAO_APEX
DIAMOND_SAO_ACCESS_LEVEL=RESTRICTED_DIAMOND_SAO

# Victory36 System Identifiers  
VICTORY36_ARCHITECTURE_ID=VICTORY36_TRUE_ASOOS_METHODOLOGY
VICTORY36_COLLECTIVE_ID=VICTORY36_HQRIX_COLLECTIVE
VICTORY36_INTEGRATION_ID=VICTORY36_SALLYPORT_DIAMOND

# Additional Security Configurations
VICTORY36_VERSION=V36.TRUE.2025.08.12
VICTORY36_SECURITY_DOMAIN=DEVICE_PROTECTION
"""
    
    with open('.env.victory36.template', 'w') as f:
        f.write(env_template)
    
    print("Created .env.victory36.template - DO NOT COMMIT TO GIT!")

def main():
    # Protect secrets in all JavaScript files
    js_files = glob.glob("*.js")
    for filepath in js_files:
        if not filepath.endswith('.backup') and not filepath.endswith('.corrupted') and not filepath.endswith('.pre_secrets'):
            protect_diamond_sao_secrets(filepath)
    
    # Create environment template
    create_env_template()

if __name__ == "__main__":
    main()
