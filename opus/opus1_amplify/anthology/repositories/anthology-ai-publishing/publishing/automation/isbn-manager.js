// ISBN Management and Validation System

class ISBNManager {
  constructor() {
    this.isbnValidator = new ISBNValidator();
    this.metadataManager = new MetadataManager();
    this.registrationHandler = new RegistrationHandler();
  }

  async processISBN(publication) {
    const format = publication.format;
    const useOwnISBN = publication.hasOwnISBN;

    if (useOwnISBN) {
      return this.validateOwnISBN(publication);
    } else {
      return this.requestKDPISBN(publication);
    }
  }

  async validateOwnISBN(publication) {
    const validationSteps = [
      this.isbnValidator.checkFormat(publication.isbn),
      this.isbnValidator.verifyRegistration(publication.isbn),
      this.isbnValidator.validateMetadata(publication),
    ];

    return Promise.all(validationSteps);
  }

  async requestKDPISBN(publication) {
    // Implementation for requesting KDP-assigned ISBN
    const formatType = this.determineFormatType(publication);
    return this.registrationHandler.requestKDPISBN(formatType);
  }

  async linkMetadata(isbn, publication) {
    return this.metadataManager.associateMetadata(isbn, {
      title: publication.title,
      format: publication.format,
      author: publication.author,
      publisher: publication.publisher,
    });
  }
}
