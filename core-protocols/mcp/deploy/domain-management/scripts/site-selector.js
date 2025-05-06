const siteMappings = require('../config/site-mappings.json');
const characterMappings = require('../config/domain-character-mappings.json');

function selectSiteForDomain(domain) {
  // First check direct domain mappings
  const domainMapping = siteMappings.domainMappings[domain];
  if (domainMapping) {
    return domainMapping.primarySite;
  }

  // Check character domains
  for (const [character, config] of Object.entries(
    characterMappings.characters
  )) {
    if (config.domains.includes(domain)) {
      return config.siteId;
    }
  }

  // Apply fallback logic
  return determineFallbackSite(domain);
}

function determineFallbackSite(domain) {
  // Implementation for determining fallback site
}

module.exports = {
  selectSiteForDomain,
};
