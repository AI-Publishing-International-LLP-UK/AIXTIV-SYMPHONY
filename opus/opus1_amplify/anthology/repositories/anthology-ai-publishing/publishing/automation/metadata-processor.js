// Metadata Processing and Validation System

class MetadataProcessor {
  constructor() {
    this.validator = new MetadataValidator();
    this.formatter = new MetadataFormatter();
    this.optimizer = new MetadataOptimizer();
  }

  async processMetadata(publication) {
    try {
      // Validate core metadata
      const validatedMetadata = await this.validateMetadata(publication);

      // Format for KDP submission
      const formattedMetadata = await this.formatMetadata(validatedMetadata);

      // Optimize for discovery
      const optimizedMetadata = await this.optimizeMetadata(formattedMetadata);

      return optimizedMetadata;
    } catch (error) {
      console.error('Metadata processing failed:', error);
      throw error;
    }
  }

  async validateMetadata(publication) {
    const validations = [
      this.validator.checkTitle(publication.title),
      this.validator.checkAuthor(publication.author),
      this.validator.checkDescription(publication.description),
      this.validator.checkKeywords(publication.keywords),
      this.validator.checkCategories(publication.categories),
    ];

    return Promise.all(validations);
  }

  async formatMetadata(metadata) {
    return {
      title: await this.formatter.formatTitle(metadata.title),
      subtitle: await this.formatter.formatSubtitle(metadata.subtitle),
      series: await this.formatter.formatSeries(metadata.series),
      description: await this.formatter.formatDescription(metadata.description),
      keywords: await this.formatter.formatKeywords(metadata.keywords),
      categories: await this.formatter.formatCategories(metadata.categories),
    };
  }

  async optimizeMetadata(metadata) {
    return {
      title: await this.optimizer.optimizeTitle(metadata.title),
      description: await this.optimizer.optimizeDescription(
        metadata.description
      ),
      keywords: await this.optimizer.optimizeKeywords(metadata.keywords),
      categories: await this.optimizer.optimizeCategories(metadata.categories),
    };
  }
}
