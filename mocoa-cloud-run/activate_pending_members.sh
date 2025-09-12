#!/bin/bash
# Activate pending AI Publishing International LLP members

echo "🔐 Activating Pending AI Publishing International LLP Members"
echo "============================================================="

# Update the member registry to activate pending members
echo "Updating member statuses from 'pending_authentication' to 'active'..."

# Create updated registry with all members active
cat > AI_PUB_LLP_MEMBER_REGISTRY_UPDATED.json << 'EOF'
{
  "registry_name": "AI Publishing International LLP Member Registry",
  "mcp_endpoint": "mcp.aipub.2100.cool",
  "last_updated": "2025-08-31T21:37:00Z",
  "total_members": 6,
  "active_members": 6,
  "status": "operational",
  
  "members": {
    "pc@coaching2100.com": {
      "displayName": "Mr. Phillip Corey Roark, CEO",
      "title": "Chief Executive Officer",
      "role": "ceo-diamond-sao",
      "authLevel": 5,
      "packageLevel": "diamond",
      "region": "Global",
      "department": "Executive Leadership",
      "accessRights": [
        "full_system_admin",
        "diamond_sao_access",
        "global_operations",
        "strategic_planning",
        "financial_oversight",
        "member_management"
      ],
      "joinDate": "2021-April-01",
      "status": "active",
      "paymentStatus": "enterprise_owner",
      "interface_access": "mocoa-owner-interface"
    },
    
    "mo@coaching2100.com": {
      "displayName": "Mr. Morgan O'Brien, EAO",
      "title": "Executive Administrative Officer",
      "role": "executive-admin-officer",
      "authLevel": 5,
      "packageLevel": "emerald",
      "region": "North America",
      "department": "Executive Administration",
      "accessRights": [
        "full_llp_access",
        "executive_dashboard",
        "administrative_oversight",
        "operational_management",
        "strategic_planning"
      ],
      "joinDate": "2025-Jul-01",
      "status": "active",
      "paymentStatus": "llp_member",
      "interface_access": "mcp.aipub.2100.cool"
    },
    
    "uk@coaching2100.com": {
      "displayName": "Mr. Roger Mahoney",
      "title": "Executive Director, EMEA",
      "role": "executive-director",
      "authLevel": 5,
      "packageLevel": "sapphire",
      "region": "EMEA",
      "department": "Executive Leadership",
      "accessRights": [
        "full_llp_access",
        "executive_dashboard",
        "emea_operations",
        "strategic_planning",
        "regional_management"
      ],
      "joinDate": "2021-APR-01",
      "status": "active",
      "paymentStatus": "llp_member",
      "interface_access": "mcp.aipub.2100.cool"
    },
    
    "jg@coaching2100.com": {
      "displayName": "Mr. Joshua Galbreath",
      "title": "Executive Growth Officer",
      "role": "executive-growth-officer",
      "authLevel": 5,
      "packageLevel": "sapphire",
      "region": "North America",
      "department": "Growth & Development",
      "accessRights": [
        "full_llp_access",
        "executive_dashboard",
        "growth_analytics",
        "strategic_planning",
        "market_development"
      ],
      "joinDate": "2024-Oct-31",
      "status": "active",
      "paymentStatus": "llp_member",
      "interface_access": "mcp.aipub.2100.cool"
    },
    
    "et@coaching2100.com": {
      "displayName": "Mr. Eduardo Testa",
      "title": "International Growth Officer",
      "role": "international-growth-officer",
      "authLevel": 5,
      "packageLevel": "sapphire",
      "region": "International",
      "department": "International Growth",
      "accessRights": [
        "full_llp_access",
        "executive_dashboard",
        "international_operations",
        "growth_analytics",
        "market_expansion"
      ],
      "joinDate": "2025-AUG-10",
      "status": "active",
      "paymentStatus": "llp_member",
      "interface_access": "mcp.aipub.2100.cool"
    },
    
    "av@coaching2100.com": {
      "displayName": "Sr. Alexander Oliveros",
      "title": "Publicidad Latam",
      "role": "latam-marketing-director",
      "authLevel": 5,
      "packageLevel": "sapphire",
      "region": "LATAM",
      "department": "Marketing & Advertising",
      "accessRights": [
        "full_llp_access",
        "regional_dashboard",
        "latam_operations",
        "marketing_campaigns",
        "advertising_management"
      ],
      "joinDate": "2025-Jul-01",
      "status": "active",
      "paymentStatus": "llp_member",
      "interface_access": "mcp.aipub.2100.cool"
    },
    
    "ym@coaching2100.com": {
      "displayName": "Sr. Yonatan Martinez",
      "title": "Publicidad Latam",
      "role": "latam-marketing-specialist",
      "authLevel": 5,
      "packageLevel": "sapphire",
      "region": "LATAM",
      "department": "Marketing & Advertising",
      "accessRights": [
        "full_llp_access",
        "regional_dashboard",
        "latam_operations",
        "marketing_campaigns",
        "advertising_management"
      ],
      "joinDate": "2025-Jul-01",
      "status": "active",
      "paymentStatus": "llp_member",
      "interface_access": "mcp.aipub.2100.cool"
    }
  },
  
  "authentication_routing": {
    "primary_domains": [
      "coaching2100.com",
      "aipub.com",
      "aipub.co.uk"
    ],
    "mcp_endpoint": "https://mcp.aipub.2100.cool",
    "auth_service": "sally-port",
    "fallback_registry": "local_member_registry"
  },
  
  "authentication_system": {
    "level_5": {
      "description": "Full access with payment/subscription active",
      "packages": ["diamond", "emerald", "sapphire", "opal", "onyx"],
      "access": "full_platform_access"
    },
    "level_4": {
      "description": "Credit card or payment terms setup but in free trial",
      "access": "trial_access"
    },
    "level_3": {
      "description": "No payment but can see limited tools",
      "access": "limited_tools"
    },
    "level_2": {
      "description": "In portal but unable to see anything - account suspended for non-payment",
      "access": "suspended_account"
    },
    "level_1": {
      "description": "Known user but no subscription and not assigned to active MCP company interface",
      "access": "no_active_subscription"
    }
  },
  
  "package_levels": {
    "diamond": "Premium enterprise package",
    "emerald": "Executive package", 
    "sapphire": "Professional package",
    "opal": "Standard package",
    "onyx": "Regional package"
  },
  
  "regional_operations": {
    "Global": "pc@coaching2100.com",
    "North America": ["mo@coaching2100.com", "jg@coaching2100.com"],
    "EMEA": ["uk@coaching2100.com"],
    "International": ["et@coaching2100.com"],
    "LATAM": ["av@coaching2100.com", "ym@coaching2100.com"]
  }
}
EOF

echo "✅ Updated registry created: AI_PUB_LLP_MEMBER_REGISTRY_UPDATED.json"
echo ""
echo "📝 Changes made:"
echo "- jg@coaching2100.com: pending_authentication → active"
echo "- et@coaching2100.com: pending_authentication → active" 
echo "- av@coaching2100.com: pending_authentication → active"
echo "- ym@coaching2100.com: pending_authentication → active"
echo ""
echo "🔄 To apply changes, replace the current registry file:"
echo "cp AI_PUB_LLP_MEMBER_REGISTRY_UPDATED.json AI_PUB_LLP_MEMBER_REGISTRY.json"
