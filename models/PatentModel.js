const mongoose = require('mongoose');

// Address schema (reusable for various address types)
const AddressSchema = new mongoose.Schema({
  nameLineOneText: String,
  nameLineTwoText: String,
  addressLineOneText: String,
  addressLineTwoText: String,
  addressLineThreeText: String,
  addressLineFourText: String,
  geographicRegionName: String,
  geographicRegionCode: String,
  postalCode: String,
  cityName: String,
  countryCode: String,
  countryName: String,
  postalAddressCategory: String
}, { _id: false });

// Telecommunication schema
const TelecommunicationSchema = new mongoose.Schema({
  telecommunicationNumber: String,
  extensionNumber: String,
  telecomTypeCode: String
}, { _id: false });

// Applicant schema
const ApplicantSchema = new mongoose.Schema({
  applicantNameText: String,
  firstName: String,
  middleName: String,
  lastName: String,
  preferredName: String,
  namePrefix: String,
  nameSuffix: String,
  countryCode: String,
  correspondenceAddressBag: [AddressSchema]
}, { _id: false });

// Inventor schema
const InventorSchema = new mongoose.Schema({
  firstName: String,
  middleName: String,
  lastName: String,
  namePrefix: String,
  nameSuffix: String,
  preferredName: String,
  countryCode: String,
  inventorNameText: String,
  correspondenceAddressBag: [AddressSchema]
}, { _id: false });

// Assignment schema
const AssignmentSchema = new mongoose.Schema({
  reelNumber: Number,
  frameNumber: Number,
  reelAndFrameNumber: String,
  pageTotalQuantity: Number,
  assignmentDocumentLocationURI: String,
  assignmentReceivedDate: String,
  assignmentRecordedDate: String,
  assignmentMailedDate: String,
  conveyanceText: String,
  assignorBag: [{
    assignorName: String,
    executionDate: String
  }],
  assigneeBag: [{
    assigneeNameText: String,
    assigneeAddress: AddressSchema
  }],
  correspondenceAddressBag: [{
    correspondentNameText: String,
    addressLineOneText: String,
    addressLineTwoText: String,
    addressLineThreeText: String,
    addressLineFourText: String
  }]
}, { _id: false });

// Attorney/Power of Attorney schema
const AttorneySchema = new mongoose.Schema({
  firstName: String,
  middleName: String,
  lastName: String,
  namePrefix: String,
  nameSuffix: String,
  preferredName: String,
  countryCode: String,
  registrationNumber: String,
  activeIndicator: String,
  registeredPractitionerCategory: String,
  attorneyAddressBag: [AddressSchema],
  telecommunicationAddressBag: [TelecommunicationSchema]
}, { _id: false });

// Continuity relationship schemas
const ParentContinuitySchema = new mongoose.Schema({
  firstInventorToFileIndicator: Boolean,
  parentApplicationStatusCode: Number,
  parentPatentNumber: String,
  parentApplicationStatusDescriptionText: String,
  parentApplicationFilingDate: String,
  parentApplicationNumberText: String,
  childApplicationNumberText: String,
  claimParentageTypeCode: String,
  claimParentageTypeCodeDescriptionText: String
}, { _id: false });

const ChildContinuitySchema = new mongoose.Schema({
  childApplicationStatusCode: Number,
  parentApplicationNumberText: String,
  childApplicationNumberText: String,
  childApplicationStatusDescriptionText: String,
  childApplicationFilingDate: String,
  firstInventorToFileIndicator: Boolean,
  childPatentNumber: String,
  claimParentageTypeCode: String,
  claimParentageTypeCodeDescriptionText: String
}, { _id: false });

// Event data schema
const EventDataSchema = new mongoose.Schema({
  eventCode: String,
  eventDescriptionText: String,
  eventDate: String
}, { _id: false });

// Patent Term Adjustment schema
const PatentTermAdjustmentSchema = new mongoose.Schema({
  aDelayQuantity: Number,
  adjustmentTotalQuantity: Number,
  applicantDayDelayQuantity: Number,
  bDelayQuantity: Number,
  cDelayQuantity: Number,
  nonOverlappingDayQuantity: Number,
  overlappingDayQuantity: Number,
  patentTermAdjustmentHistoryDataBag: [{
    eventDate: String,
    applicantDayDelayQuantity: Number,
    eventDescriptionText: String,
    eventSequenceNumber: Number,
    ipOfficeDayDelayQuantity: Number,
    originatingEventSequenceNumber: Number,
    ptaPTECode: String
  }]
}, { _id: false });

// Document metadata schema
const DocumentMetaDataSchema = new mongoose.Schema({
  zipFileName: String,
  productIdentifier: String,
  fileLocationURI: String,
  fileCreateDateTime: String,
  xmlFileName: String
}, { _id: false });

// Main Patent schema
const PatentSchema = new mongoose.Schema({
  // Application identification
  applicationNumberText: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  
  // Application metadata
  applicationMetaData: {
    nationalStageIndicator: Boolean,
    entityStatusData: {
      smallEntityStatusIndicator: Boolean,
      businessEntityStatusCategory: String
    },
    publicationDateBag: [String],
    publicationSequenceNumberBag: [String],
    publicationCategoryBag: [String],
    docketNumber: String,
    firstInventorToFileIndicator: String,
    firstApplicantName: String,
    firstInventorName: String,
    applicationConfirmationNumber: Number,
    applicationStatusDate: String,
    applicationStatusDescriptionText: String,
    filingDate: {
      type: String,
      index: true
    },
    effectiveFilingDate: String,
    grantDate: {
      type: String,
      index: true
    },
    groupArtUnitNumber: String,
    applicationTypeCode: String,
    applicationTypeLabelName: String,
    applicationTypeCategory: String,
    inventionTitle: {
      type: String,
      index: 'text'
    },
    patentNumber: {
      type: String,
      index: true
    },
    applicationStatusCode: {
      type: Number,
      index: true
    },
    earliestPublicationNumber: String,
    earliestPublicationDate: String,
    pctPublicationNumber: String,
    pctPublicationDate: String,
    internationalRegistrationPublicationDate: String,
    internationalRegistrationNumber: String,
    examinerNameText: String,
    class: String,
    subclass: String,
    uspcSymbolText: String,
    customerNumber: Number,
    cpcClassificationBag: [{
      type: String,
      index: true
    }],
    applicantBag: [ApplicantSchema],
    inventorBag: [InventorSchema]
  },
  
  // Correspondence addresses
  correspondenceAddressBag: [AddressSchema],
  
  // Assignment information
  assignmentBag: [AssignmentSchema],
  
  // Attorney information
  recordAttorney: {
    customerNumberCorrespondenceData: [{
      patronIdentifier: Number,
      organizationStandardName: String,
      powerOfAttorneyAddressBag: [AddressSchema],
      telecommunicationAddressBag: [TelecommunicationSchema]
    }],
    powerOfAttorneyBag: [AttorneySchema],
    attorneyBag: [AttorneySchema]
  },
  
  // Foreign priority
  foreignPriorityBag: [{
    ipOfficeName: String,
    filingDate: String,
    applicationNumberText: String
  }],
  
  // Continuity relationships
  parentContinuityBag: [ParentContinuitySchema],
  childContinuityBag: [ChildContinuitySchema],
  
  // Patent term adjustment
  patentTermAdjustmentData: PatentTermAdjustmentSchema,
  
  // Event timeline
  eventDataBag: [EventDataSchema],
  
  // Document metadata
  pgpubDocumentMetaData: DocumentMetaDataSchema,
  grantDocumentMetaData: DocumentMetaDataSchema,
  
  // System fields
  lastIngestionDateTime: {
    type: String,
    default: () => new Date().toISOString()
  },
  
  // Search optimization fields
  searchText: {
    type: String,
    index: 'text'
  },
  
  // Processing metadata
  processingMetadata: {
    importedAt: {
      type: Date,
      default: Date.now
    },
    datasetFile: String,
    processingVersion: {
      type: String,
      default: '1.0.0'
    }
  }
}, {
  timestamps: true,
  collection: 'patents'
});

// Compound indexes for common queries
PatentSchema.index({ 'applicationMetaData.filingDate': 1, 'applicationMetaData.applicationStatusCode': 1 });
PatentSchema.index({ 'applicationMetaData.patentNumber': 1, 'applicationMetaData.grantDate': 1 });
PatentSchema.index({ 'applicationMetaData.cpcClassificationBag': 1, 'applicationMetaData.applicationStatusCode': 1 });
PatentSchema.index({ 'applicationMetaData.firstApplicantName': 1, 'applicationMetaData.filingDate': 1 });

// Text index for full-text search
PatentSchema.index({
  'applicationMetaData.inventionTitle': 'text',
  'searchText': 'text',
  'applicationMetaData.firstApplicantName': 'text',
  'applicationMetaData.firstInventorName': 'text'
});

// Pre-save middleware to create searchText field
PatentSchema.pre('save', function(next) {
  const searchFields = [
    this.applicationMetaData?.inventionTitle,
    this.applicationMetaData?.firstApplicantName,
    this.applicationMetaData?.firstInventorName,
    this.applicationMetaData?.examinerNameText,
    ...(this.applicationMetaData?.cpcClassificationBag || [])
  ].filter(Boolean);
  
  this.searchText = searchFields.join(' ');
  next();
});

// Static methods for common queries
PatentSchema.statics.findByPatentNumber = function(patentNumber) {
  return this.findOne({ 'applicationMetaData.patentNumber': patentNumber });
};

PatentSchema.statics.findByApplicationNumber = function(applicationNumber) {
  return this.findOne({ applicationNumberText: applicationNumber });
};

PatentSchema.statics.searchByTitle = function(titleQuery, options = {}) {
  return this.find(
    { $text: { $search: titleQuery } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } }).limit(options.limit || 100);
};

PatentSchema.statics.findByClassification = function(cpcClass) {
  return this.find({ 'applicationMetaData.cpcClassificationBag': cpcClass });
};

PatentSchema.statics.findByDateRange = function(startDate, endDate, dateField = 'filingDate') {
  const query = {};
  query[`applicationMetaData.${dateField}`] = {
    $gte: startDate,
    $lte: endDate
  };
  return this.find(query);
};

module.exports = mongoose.model('Patent', PatentSchema);
