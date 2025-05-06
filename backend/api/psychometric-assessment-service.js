const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../monitoring/logger');
const careerDictionaryService = require('./career-dictionary-service');

/**
 * Psychometric Assessment Service
 *
 * Provides comprehensive psychometric assessment functionality integrating
 * multiple frameworks (MBTI, DISC, Holland RIASEC, Hogan) with career data.
 */
class PsychometricAssessmentService {
  constructor() {
    this.db = admin.firestore();

    // Collection references
    this.collections = {
      assessments: this.db.collection('psychometric_assessments'),
      results: this.db.collection('psychometric_results'),
      careerMatches: this.db.collection('career_matches'),
      userProfiles: this.db.collection('user_profiles'),
    };
  }

  /**
   * Initialize the psychometric assessment service
   */
  async initialize() {
    try {
      // Ensure all collection paths exist
      const collections = Object.keys(this.collections);

      for (const collectionKey of collections) {
        const collectionRef = this.collections[collectionKey];
        const snapshot = await collectionRef.limit(1).get();

        if (snapshot.empty) {
          logger.info(`Initializing collection: ${collectionRef.path}`);
          // Add a placeholder document to ensure collection exists
          await collectionRef.doc('_metadata').set({
            created: admin.firestore.FieldValue.serverTimestamp(),
            description: `Psychometric assessment collection for ${collectionKey}`,
          });
        }
      }

      logger.info('Psychometric Assessment Service initialized successfully');
      return true;
    } catch (error) {
      logger.error(
        `Error initializing Psychometric Assessment Service: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Create a new assessment for a user
   * @param {string} userId - User ID
   * @param {Object} assessmentData - Assessment configuration
   * @returns {Promise<Object>} - New assessment details
   */
  async createAssessment(userId, assessmentData) {
    try {
      // Validate input
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { type, title, description, config = {} } = assessmentData;

      if (
        !type ||
        !['mbti', 'disc', 'holland', 'hogan', 'comprehensive'].includes(type)
      ) {
        throw new Error(
          'Valid assessment type is required (mbti, disc, holland, hogan, comprehensive)'
        );
      }

      // Create assessment document
      const assessmentId = uuidv4();
      const assessmentRef = this.collections.assessments.doc(assessmentId);

      // Structure assessment data
      const assessment = {
        id: assessmentId,
        userId,
        type,
        title: title || `${type.toUpperCase()} Assessment`,
        description: description || `Standard ${type.toUpperCase()} assessment`,
        config,
        status: 'created',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Save assessment
      await assessmentRef.set(assessment);

      return {
        success: true,
        assessment: {
          id: assessmentId,
          ...assessment,
        },
      };
    } catch (error) {
      logger.error(`Error creating assessment: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Submit assessment responses
   * @param {string} assessmentId - Assessment ID
   * @param {Array} responses - Array of assessment responses
   * @returns {Promise<Object>} - Processing result
   */
  async submitResponses(assessmentId, responses) {
    try {
      // Validate input
      if (!assessmentId) {
        throw new Error('Assessment ID is required');
      }

      if (!Array.isArray(responses) || responses.length === 0) {
        throw new Error('Valid responses array is required');
      }

      // Get assessment document
      const assessmentRef = this.collections.assessments.doc(assessmentId);
      const assessmentDoc = await assessmentRef.get();

      if (!assessmentDoc.exists) {
        throw new Error(`Assessment not found: ${assessmentId}`);
      }

      const assessment = assessmentDoc.data();

      // Update assessment status
      await assessmentRef.update({
        status: 'submitted',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        responseCount: responses.length,
      });

      // Process responses based on assessment type
      let result;
      switch (assessment.type) {
        case 'mbti':
          result = this.processMBTIResponses(responses);
          break;
        case 'disc':
          result = this.processDISCResponses(responses);
          break;
        case 'holland':
          result = this.processHollandResponses(responses);
          break;
        case 'hogan':
          result = this.processHoganResponses(responses);
          break;
        case 'comprehensive':
          result = this.processComprehensiveResponses(responses);
          break;
        default:
          throw new Error(`Unsupported assessment type: ${assessment.type}`);
      }

      // Store result
      const resultId = uuidv4();
      const resultRef = this.collections.results.doc(resultId);

      const resultData = {
        id: resultId,
        assessmentId,
        userId: assessment.userId,
        type: assessment.type,
        result,
        rawResponses: responses,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await resultRef.set(resultData);

      // Update assessment status
      await assessmentRef.update({
        status: 'completed',
        resultId,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Generate career matches based on assessment result
      const careerMatches = await this.generateCareerMatches(
        assessment.userId,
        assessment.type,
        result
      );

      return {
        success: true,
        resultId,
        type: assessment.type,
        result,
        careerMatches: careerMatches.matches || [],
      };
    } catch (error) {
      logger.error(`Error submitting responses: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process MBTI assessment responses
   * @param {Array} responses - Array of MBTI responses
   * @returns {Object} - MBTI result
   */
  processMBTIResponses(responses) {
    // Count preferences
    let e = 0,
      i = 0,
      s = 0,
      n = 0,
      t = 0,
      f = 0,
      j = 0,
      p = 0;

    // Process each response
    responses.forEach(response => {
      const { dimension, value } = response;

      switch (dimension) {
        case 'ei':
          value === 'e' ? e++ : i++;
          break;
        case 'sn':
          value === 's' ? s++ : n++;
          break;
        case 'tf':
          value === 't' ? t++ : f++;
          break;
        case 'jp':
          value === 'j' ? j++ : p++;
          break;
      }
    });

    // Determine preferences
    const ei = e > i ? 'E' : 'I';
    const sn = s > n ? 'S' : 'N';
    const tf = t > f ? 'T' : 'F';
    const jp = j > p ? 'J' : 'P';

    // Calculate scores
    const eiScore = Math.round((Math.max(e, i) / (e + i)) * 100);
    const snScore = Math.round((Math.max(s, n) / (s + n)) * 100);
    const tfScore = Math.round((Math.max(t, f) / (t + f)) * 100);
    const jpScore = Math.round((Math.max(j, p) / (j + p)) * 100);

    // Construct type
    const type = `${ei}${sn}${tf}${jp}`;

    return {
      type,
      scores: {
        e,
        i,
        s,
        n,
        t,
        f,
        j,
        p,
      },
      preferences: {
        ei: { preference: ei, score: eiScore },
        sn: { preference: sn, score: snScore },
        tf: { preference: tf, score: tfScore },
        jp: { preference: jp, score: jpScore },
      },
      description: this.getMBTIDescription(type),
    };
  }

  /**
   * Get MBTI type description
   * @param {string} type - MBTI type
   * @returns {Object} - Type description
   */
  getMBTIDescription(type) {
    const descriptions = {
      ISTJ: {
        name: 'Inspector',
        traits: ['Responsible', 'Organized', 'Logical', 'Dependable'],
        strengths: ['Detail-oriented', 'Practical', 'Reliable'],
        challenges: ['Resistance to change', 'Difficulty with ambiguity'],
      },
      ISFJ: {
        name: 'Protector',
        traits: ['Nurturing', 'Loyal', 'Traditional', 'Detail-oriented'],
        strengths: ['Supportive', 'Practical', 'Responsible'],
        challenges: ['Self-sacrificing', 'Difficulty saying no'],
      },
      INFJ: {
        name: 'Counselor',
        traits: ['Insightful', 'Idealistic', 'Complex', 'Deep'],
        strengths: ['Visionary', 'Empathetic', 'Creative'],
        challenges: ['Perfectionism', 'Burnout from helping others'],
      },
      INTJ: {
        name: 'Mastermind',
        traits: ['Strategic', 'Independent', 'Analytical', 'Determined'],
        strengths: ['Innovative', 'Logical', 'Objective'],
        challenges: ['Overly critical', 'Difficulty with emotional expression'],
      },
      ISTP: {
        name: 'Craftsman',
        traits: ['Pragmatic', 'Logical', 'Adaptable', 'Independent'],
        strengths: ['Technical expertise', 'Crisis management', 'Efficiency'],
        challenges: ['Commitment issues', 'Emotional distance'],
      },
      ISFP: {
        name: 'Composer',
        traits: ['Artistic', 'Sensitive', 'Gentle', 'Adaptable'],
        strengths: [
          'Aesthetic appreciation',
          'Hands-on creativity',
          'Compassion',
        ],
        challenges: [
          'Conflict avoidance',
          'Difficulty with long-term planning',
        ],
      },
      INFP: {
        name: 'Healer',
        traits: ['Idealistic', 'Compassionate', 'Creative', 'Authentic'],
        strengths: ['Value-driven', 'Empathetic', 'Adaptable'],
        challenges: ['Idealism', 'Difficulty with criticism'],
      },
      INTP: {
        name: 'Architect',
        traits: ['Analytical', 'Abstract', 'Theoretical', 'Objective'],
        strengths: [
          'Conceptual problem-solving',
          'Logical analysis',
          'Innovation',
        ],
        challenges: [
          'Overthinking',
          'Difficulty with practical implementation',
        ],
      },
      ESTP: {
        name: 'Dynamo',
        traits: ['Energetic', 'Risk-taking', 'Pragmatic', 'Present-focused'],
        strengths: ['Crisis management', 'Negotiation', 'Resourcefulness'],
        challenges: ['Impulsivity', 'Boredom with routine'],
      },
      ESFP: {
        name: 'Performer',
        traits: ['Enthusiastic', 'Spontaneous', 'Friendly', 'Practical'],
        strengths: ['People skills', 'Adaptability', 'Showmanship'],
        challenges: [
          'Dislike of structure',
          'Focus on immediate gratification',
        ],
      },
      ENFP: {
        name: 'Champion',
        traits: ['Enthusiastic', 'Creative', 'People-oriented', 'Optimistic'],
        strengths: ['Innovation', 'Inspiration', 'Relationship building'],
        challenges: ['Disorganization', 'Difficulty with follow-through'],
      },
      ENTP: {
        name: 'Visionary',
        traits: ['Innovative', 'Adaptable', 'Analytical', 'Resourceful'],
        strengths: ['Strategic thinking', 'Debate skills', 'Creativity'],
        challenges: ['Argumentativeness', 'Difficulty completing projects'],
      },
      ESTJ: {
        name: 'Supervisor',
        traits: ['Organized', 'Logical', 'Traditional', 'Efficient'],
        strengths: ['Leadership', 'Dependability', 'Decision-making'],
        challenges: ['Inflexibility', 'Judgmental tendencies'],
      },
      ESFJ: {
        name: 'Provider',
        traits: ['Caring', 'Traditional', 'Organized', 'Social'],
        strengths: ['Cooperation', 'Practical support', 'Attention to needs'],
        challenges: ['Sensitivity to criticism', 'Difficulty with change'],
      },
      ENFJ: {
        name: 'Teacher',
        traits: ['Charismatic', 'Empathetic', 'Organized', 'Diplomatic'],
        strengths: ['Leadership', 'Communication', 'Inspiration'],
        challenges: ['People-pleasing', 'Avoiding necessary conflict'],
      },
      ENTJ: {
        name: 'Commander',
        traits: ['Strategic', 'Logical', 'Efficient', 'Decisive'],
        strengths: [
          'Leadership',
          'Long-term planning',
          'Organizational ability',
        ],
        challenges: ['Impatience', 'Domineering tendencies'],
      },
    };

    return (
      descriptions[type] || {
        name: 'Unknown Type',
        traits: ['Please consult a professional for accurate assessment'],
        strengths: [],
        challenges: [],
      }
    );
  }

  /**
   * Process DISC assessment responses
   * @param {Array} responses - Array of DISC responses
   * @returns {Object} - DISC result
   */
  processDISCResponses(responses) {
    // Initialize counters
    let d = 0,
      i = 0,
      s = 0,
      c = 0,
      total = 0;

    // Process each response
    responses.forEach(response => {
      const { dimension, value } = response;
      const score = parseInt(value, 10) || 0;

      switch (dimension) {
        case 'd':
          d += score;
          break;
        case 'i':
          i += score;
          break;
        case 's':
          s += score;
          break;
        case 'c':
          c += score;
          break;
      }

      total += score;
    });

    // Calculate percentages
    const dPercent = Math.round((d / total) * 100);
    const iPercent = Math.round((i / total) * 100);
    const sPercent = Math.round((s / total) * 100);
    const cPercent = Math.round((c / total) * 100);

    // Determine primary and secondary style
    const scores = [
      { dimension: 'D', score: dPercent },
      { dimension: 'I', score: iPercent },
      { dimension: 'S', score: sPercent },
      { dimension: 'C', score: cPercent },
    ];

    scores.sort((a, b) => b.score - a.score);

    const primaryStyle = scores[0].dimension;
    const secondaryStyle = scores[1].dimension;

    // Determine profile type
    const profileType = `${primaryStyle}${secondaryStyle}`;

    return {
      scores: {
        D: dPercent,
        I: iPercent,
        S: sPercent,
        C: cPercent,
      },
      primaryStyle,
      secondaryStyle,
      profileType,
      description: this.getDISCDescription(profileType),
    };
  }

  /**
   * Get DISC profile description
   * @param {string} profileType - DISC profile type
   * @returns {Object} - Profile description
   */
  getDISCDescription(profileType) {
    const descriptions = {
      DI: {
        name: 'Dominant Influencer',
        traits: ['Assertive', 'Persuasive', 'Competitive', 'Outgoing'],
        workStyle: ['Takes charge', 'Result-oriented', 'Enjoys challenges'],
        communicationStyle: ['Direct', 'Enthusiastic', 'Fast-paced'],
      },
      DC: {
        name: 'Dominant Compliant',
        traits: ['Determined', 'Analytical', 'Task-oriented', 'Challenging'],
        workStyle: [
          'Independent',
          'Logical',
          'Focuses on results and accuracy',
        ],
        communicationStyle: ['Brief', 'Factual', 'To the point'],
      },
      DS: {
        name: 'Dominant Steady',
        traits: ['Determined', 'Persistent', 'Independent', 'Stable'],
        workStyle: ['Results-driven', 'Works systematically', 'Consistent'],
        communicationStyle: ['Direct', 'Factual', 'Reserved'],
      },
      ID: {
        name: 'Influencing Dominant',
        traits: ['Persuasive', 'Enthusiastic', 'Assertive', 'People-oriented'],
        workStyle: ['Motivates others', 'Inspires action', 'Competitive'],
        communicationStyle: ['Expressive', 'Convincing', 'Engaging'],
      },
      IS: {
        name: 'Influencing Steady',
        traits: ['Outgoing', 'Supportive', 'Friendly', 'Optimistic'],
        workStyle: ['Team player', 'Encourages others', 'Relationship-focused'],
        communicationStyle: ['Warm', 'Enthusiastic', 'Personable'],
      },
      IC: {
        name: 'Influencing Compliant',
        traits: ['Expressive', 'Detailed', 'Verbal', 'Analytical'],
        workStyle: [
          'Creative problem-solver',
          'Good at persuasion',
          'Details important',
        ],
        communicationStyle: [
          'Persuasive',
          'Talkative',
          'Supportive with facts',
        ],
      },
      SD: {
        name: 'Steady Dominant',
        traits: ['Persistent', 'Determined', 'Team-oriented', 'Reliable'],
        workStyle: ['Methodical', 'Consistent', 'Cautiously decisive'],
        communicationStyle: ['Patient', 'Direct', 'Thoughtful'],
      },
      SI: {
        name: 'Steady Influencer',
        traits: ['Supportive', 'Friendly', 'Patient', 'Good listener'],
        workStyle: ['Collaborative', 'Consistent', 'Helps others'],
        communicationStyle: ['Warm', 'Considerate', 'Patient'],
      },
      SC: {
        name: 'Steady Compliant',
        traits: ['Patient', 'Analytical', 'Methodical', 'Precise'],
        workStyle: ['Systematic', 'Detail-oriented', 'Support-focused'],
        communicationStyle: ['Calm', 'Factual', 'Step-by-step'],
      },
      CD: {
        name: 'Compliant Dominant',
        traits: ['Analytical', 'Assertive', 'Logical', 'Precise'],
        workStyle: ['Quality-focused', 'Problem-solver', 'Systems-oriented'],
        communicationStyle: ['Detailed', 'Factual', 'Direct'],
      },
      CI: {
        name: 'Compliant Influencer',
        traits: ['Detailed', 'Verbal', 'Cautious', 'Logical'],
        workStyle: ['Quality-conscious', 'Careful', 'Explains thoroughly'],
        communicationStyle: ['Precise', 'Informative', 'Articulate'],
      },
      CS: {
        name: 'Compliant Steady',
        traits: ['Analytical', 'Methodical', 'Accurate', 'Patient'],
        workStyle: ['Detail-oriented', 'Systematic', 'Quality-focused'],
        communicationStyle: ['Detailed', 'Diplomatic', 'Careful'],
      },
    };

    return (
      descriptions[profileType] || {
        name: 'Balanced Profile',
        traits: ['Adaptable', 'Well-rounded', 'Flexible'],
        workStyle: ['Adjusts to situation', 'Versatile approach'],
        communicationStyle: ['Adaptive', 'Matches audience needs'],
      }
    );
  }

  /**
   * Process Holland/RIASEC assessment responses
   * @param {Array} responses - Array of Holland/RIASEC responses
   * @returns {Object} - Holland/RIASEC result
   */
  processHollandResponses(responses) {
    // Initialize counters
    let r = 0,
      i = 0,
      a = 0,
      s = 0,
      e = 0,
      c = 0;

    // Process each response
    responses.forEach(response => {
      const { dimension, value } = response;
      const score = parseInt(value, 10) || 0;

      switch (dimension.toLowerCase()) {
        case 'r':
        case 'realistic':
          r += score;
          break;
        case 'i':
        case 'investigative':
          i += score;
          break;
        case 'a':
        case 'artistic':
          a += score;
          break;
        case 's':
        case 'social':
          s += score;
          break;
        case 'e':
        case 'enterprising':
          e += score;
          break;
        case 'c':
        case 'conventional':
          c += score;
          break;
      }
    });

    // Calculate percentages (assuming max score of 10 per dimension)
    const maxPossible = (responses.length / 6) * 10; // Assuming balanced questions across dimensions

    const rPercent = Math.round((r / maxPossible) * 100);
    const iPercent = Math.round((i / maxPossible) * 100);
    const aPercent = Math.round((a / maxPossible) * 100);
    const sPercent = Math.round((s / maxPossible) * 100);
    const ePercent = Math.round((e / maxPossible) * 100);
    const cPercent = Math.round((c / maxPossible) * 100);

    // Determine top three types
    const scores = [
      { dimension: 'R', score: rPercent },
      { dimension: 'I', score: iPercent },
      { dimension: 'A', score: aPercent },
      { dimension: 'S', score: sPercent },
      { dimension: 'E', score: ePercent },
      { dimension: 'C', score: cPercent },
    ];

    scores.sort((a, b) => b.score - a.score);

    const primaryType = scores[0].dimension;
    const secondaryType = scores[1].dimension;
    const tertiaryType = scores[2].dimension;

    // Construct RIASEC code
    const riasecCode = `${primaryType}${secondaryType}${tertiaryType}`;

    return {
      scores: {
        R: rPercent,
        I: iPercent,
        A: aPercent,
        S: sPercent,
        E: ePercent,
        C: cPercent,
      },
      primaryType,
      secondaryType,
      tertiaryType,
      riasecCode,
      description: this.getHollandDescription(primaryType, secondaryType),
    };
  }

  /**
   * Get Holland/RIASEC description
   * @param {string} primaryType - Primary RIASEC type
   * @param {string} secondaryType - Secondary RIASEC type
   * @returns {Object} - Type description
   */
  getHollandDescription(primaryType, secondaryType) {
    const typeDescriptions = {
      R: {
        name: 'Realistic',
        traits: ['Practical', 'Physical', 'Hands-on', 'Tool-oriented'],
        strengths: [
          'Technical skills',
          'Mechanical aptitude',
          'Physical coordination',
        ],
        environments: ['Outdoors', 'Workshop', 'Laboratory', 'Construction'],
      },
      I: {
        name: 'Investigative',
        traits: ['Analytical', 'Intellectual', 'Scientific', 'Curious'],
        strengths: ['Problem-solving', 'Research skills', 'Critical thinking'],
        environments: [
          'Laboratory',
          'University',
          'Research institution',
          'Technology company',
        ],
      },
      A: {
        name: 'Artistic',
        traits: ['Creative', 'Expressive', 'Original', 'Independent'],
        strengths: ['Creativity', 'Artistic ability', 'Emotional expression'],
        environments: ['Studio', 'Theater', 'Design firm', 'Self-employment'],
      },
      S: {
        name: 'Social',
        traits: ['Helpful', 'Supportive', 'Collaborative', 'Empathetic'],
        strengths: ['Communication', 'Teaching ability', 'People skills'],
        environments: [
          'School',
          'Healthcare facility',
          'Community organization',
          'Counseling center',
        ],
      },
      E: {
        name: 'Enterprising',
        traits: ['Persuasive', 'Leadership-oriented', 'Ambitious', 'Energetic'],
        strengths: ['Leadership', 'Persuasion', 'Public speaking'],
        environments: ['Business', 'Politics', 'Sales', 'Management'],
      },
      C: {
        name: 'Conventional',
        traits: ['Organized', 'Detail-oriented', 'Procedural', 'Structured'],
        strengths: ['Organization', 'Attention to detail', 'Reliability'],
        environments: [
          'Office',
          'Financial institution',
          'Administrative role',
          'Data management',
        ],
      },
    };

    // Get descriptions for primary and secondary types
    const primary = typeDescriptions[primaryType];
    const secondary = typeDescriptions[secondaryType];

    // Combine descriptions
    return {
      primary: primary.name,
      secondary: secondary.name,
      combinedType: `${primary.name}-${secondary.name}`,
      traits: [...primary.traits.slice(0, 2), ...secondary.traits.slice(0, 2)],
      strengths: [
        ...primary.strengths.slice(0, 2),
        ...secondary.strengths.slice(0, 2),
      ],
      environments: [
        ...primary.environments.slice(0, 2),
        ...secondary.environments.slice(0, 2),
      ],
      careerThemes: this.getHollandCareerThemes(primaryType, secondaryType),
    };
  }

  /**
   * Get Holland/RIASEC career themes
   * @param {string} primaryType - Primary RIASEC type
   * @param {string} secondaryType - Secondary RIASEC type
   * @returns {Array} - Career themes
   */
  getHollandCareerThemes(primaryType, secondaryType) {
    const careerThemes = {
      RI: ['Engineering', 'Technical', 'Agriculture', 'Construction'],
      RA: ['Craft work', 'Technical drawing', 'Outdoor recreation'],
      RS: ['Protective services', 'Athletics/coaching', 'Animal care'],
      RE: ['Military', 'Law enforcement', 'Skilled trades management'],
      RC: ['Production', 'Quality control', 'Technical support'],

      IR: ['Applied sciences', 'Medical technology', 'Environmental science'],
      IA: ['Research', 'Medical science', 'Natural sciences'],
      IS: ['Medicine', 'Social sciences', 'Education', 'Psychology'],
      IE: ['Biotech entrepreneurship', 'Economic analysis', 'Pharmaceutical'],
      IC: ['Data science', 'Information systems', 'Finance analysis'],

      AR: ['Design', 'Visual arts', 'Craft arts', 'Architecture'],
      AI: ['Writing', 'Media', 'Fine arts', 'Social criticism'],
      AS: ['Performing arts', 'Art therapy', 'Teaching arts'],
      AE: ['Entertainment', 'Creative direction', 'Media production'],
      AC: ['Web design', 'Technical writing', 'Graphic design'],

      SR: ['Fitness/recreation', 'Healthcare support', 'Physical therapy'],
      SI: ['Counseling', 'Healthcare', 'Education', 'Social research'],
      SA: ['Music therapy', 'Education', 'Counseling', 'Coaching'],
      SE: [
        'Education administration',
        'Religious leadership',
        'Healthcare management',
      ],
      SC: ['Social services', 'Administrative support', 'Health records'],

      ER: ['Construction management', 'Agriculture management', 'Food service'],
      EI: ['Executive leadership', 'Law', 'Consulting', 'Research direction'],
      EA: ['Marketing', 'Public relations', 'Media management'],
      ES: ['Sales', 'Politics', 'Customer service', 'Real estate'],
      EC: ['Banking', 'Retail management', 'Hotel management'],

      CR: ['Building inspection', 'Quality control', 'Financial services'],
      CI: ['Information technology', 'Accounting', 'Financial analysis'],
      CA: ['Web development', 'Editing', 'Communications', 'Technical writing'],
      CS: ['Administrative services', 'Customer support', 'Office management'],
      CE: ['Office supervision', 'Audit', 'Human resources management'],
    };

    // Handle reverse order
    const code = `${primaryType}${secondaryType}`;
    const reversedCode = `${secondaryType}${primaryType}`;

    return (
      careerThemes[code] ||
      careerThemes[reversedCode] || [
        'Diverse career paths available',
        'Consider individual interests within your type pattern',
      ]
    );
  }

  /**
   * Process Hogan assessment responses
   * @param {Array} responses - Array of Hogan responses
   * @returns {Object} - Hogan result
   */
  processHoganResponses(responses) {
    // Initialize HPI (Hogan Personality Inventory) scores
    const hpi = {
      adjustment: 0,
      ambition: 0,
      sociability: 0,
      interpersonal_sensitivity: 0,
      prudence: 0,
      inquisitive: 0,
      learning_approach: 0,
    };

    // Initialize HDS (Hogan Development Survey) scores if available
    const hds = {
      excitable: 0,
      skeptical: 0,
      cautious: 0,
      reserved: 0,
      leisurely: 0,
      bold: 0,
      mischievous: 0,
      colorful: 0,
      imaginative: 0,
      diligent: 0,
      dutiful: 0,
    };

    // Initialize MVPI (Motives, Values, Preferences Inventory) scores if available
    const mvpi = {
      recognition: 0,
      power: 0,
      hedonism: 0,
      altruism: 0,
      affiliation: 0,
      tradition: 0,
      security: 0,
      commerce: 0,
      aesthetics: 0,
      science: 0,
    };

    // Count responses for each dimension
    const counts = {
      hpi: {
        adjustment: 0,
        ambition: 0,
        sociability: 0,
        interpersonal_sensitivity: 0,
        prudence: 0,
        inquisitive: 0,
        learning_approach: 0,
      },
      hds: {
        excitable: 0,
        skeptical: 0,
        cautious: 0,
        reserved: 0,
        leisurely: 0,
        bold: 0,
        mischievous: 0,
        colorful: 0,
        imaginative: 0,
        diligent: 0,
        dutiful: 0,
      },
      mvpi: {
        recognition: 0,
        power: 0,
        hedonism: 0,
        altruism: 0,
        affiliation: 0,
        tradition: 0,
        security: 0,
        commerce: 0,
        aesthetics: 0,
        science: 0,
      },
    };

    // Process each response
    responses.forEach(response => {
      const { category, dimension, value } = response;
      const score = parseInt(value, 10) || 0;

      // Check which inventory the response belongs to
      if (category === 'hpi' && hpi.hasOwnProperty(dimension)) {
        hpi[dimension] += score;
        counts.hpi[dimension]++;
      } else if (category === 'hds' && hds.hasOwnProperty(dimension)) {
        hds[dimension] += score;
        counts.hds[dimension]++;
      } else if (category === 'mvpi' && mvpi.hasOwnProperty(dimension)) {
        mvpi[dimension] += score;
        counts.mvpi[dimension]++;
      }
    });

    // Calculate average scores (percentiles) for each dimension
    Object.keys(hpi).forEach(dim => {
      if (counts.hpi[dim] > 0) {
        hpi[dim] = Math.round((hpi[dim] / (counts.hpi[dim] * 10)) * 100);
      }
    });

    Object.keys(hds).forEach(dim => {
      if (counts.hds[dim] > 0) {
        hds[dim] = Math.round((hds[dim] / (counts.hds[dim] * 10)) * 100);
      }
    });

    Object.keys(mvpi).forEach(dim => {
      if (counts.mvpi[dim] > 0) {
        mvpi[dim] = Math.round((mvpi[dim] / (counts.mvpi[dim] * 10)) * 100);
      }
    });

    // Determine leadership style based on HPI scores
    const leadershipStyle = this.determineHoganLeadershipStyle(hpi);

    // Determine potential derailers based on HDS scores
    const potentialDerailers = this.determineHoganDerailers(hds);

    // Determine key values based on MVPI scores
    const keyValues = this.determineHoganValues(mvpi);

    return {
      hpi,
      hds,
      mvpi,
      leadershipStyle,
      potentialDerailers,
      keyValues,
    };
  }

  /**
   * Determine Hogan leadership style based on HPI scores
   * @param {Object} hpi - HPI scores
   * @returns {Object} - Leadership style description
   */
  determineHoganLeadershipStyle(hpi) {
    // Determine primary leadership characteristics
    let characteristics = [];

    if (hpi.adjustment > 70) characteristics.push('Resilient');
    if (hpi.ambition > 70) characteristics.push('Driven');
    if (hpi.sociability > 70) characteristics.push('Outgoing');
    if (hpi.interpersonal_sensitivity > 70) characteristics.push('Diplomatic');
    if (hpi.prudence > 70) characteristics.push('Detail-oriented');
    if (hpi.inquisitive > 70) characteristics.push('Strategic');
    if (hpi.learning_approach > 70) characteristics.push('Knowledgeable');

    // Determine overall leadership style based on score patterns
    let style = '';
    let strengths = [];
    let challenges = [];

    if (hpi.ambition > 70 && hpi.sociability > 60) {
      style = 'Charismatic Leader';
      strengths = ['Inspires others', 'Communicates vision', 'Drives change'];
      challenges = ['May overlook details', 'Can be impulsive'];
    } else if (hpi.ambition > 70 && hpi.prudence > 70) {
      style = 'Results-Focused Leader';
      strengths = ['Goal-oriented', 'Organized', 'Efficient'];
      challenges = ['May be inflexible', 'Could be perceived as demanding'];
    } else if (hpi.interpersonal_sensitivity > 70 && hpi.adjustment > 60) {
      style = 'Supportive Leader';
      strengths = ['Builds strong teams', 'Good listener', 'Creates harmony'];
      challenges = [
        'May avoid necessary conflict',
        'Could struggle with tough decisions',
      ];
    } else if (hpi.inquisitive > 70 && hpi.learning_approach > 70) {
      style = 'Strategic Thinker';
      strengths = ['Innovative', 'Forward-thinking', 'Analytical'];
      challenges = ['May be theoretical', 'Could lack practicality'];
    } else {
      style = 'Balanced Leader';
      strengths = ['Adaptable approach', 'Situational leadership', 'Versatile'];
      challenges = [
        'May need to emphasize strengths more',
        'Could develop clearer style',
      ];
    }

    return {
      style,
      characteristics,
      strengths,
      challenges,
    };
  }

  /**
   * Determine potential derailers based on HDS scores
   * @param {Object} hds - HDS scores
   * @returns {Array} - Potential derailers
   */
  determineHoganDerailers(hds) {
    const derailers = [];

    if (hds.excitable > 70) derailers.push('Emotional volatility');
    if (hds.skeptical > 70) derailers.push('Cynicism and mistrust');
    if (hds.cautious > 70) derailers.push('Risk aversion');
    if (hds.reserved > 70) derailers.push('Poor communication');
    if (hds.leisurely > 70) derailers.push('Passive resistance');
    if (hds.bold > 70) derailers.push('Arrogance');
    if (hds.mischievous > 70) derailers.push('Risk-taking');
    if (hds.colorful > 70) derailers.push('Attention-seeking');
    if (hds.imaginative > 70) derailers.push('Unusual thinking');
    if (hds.diligent > 70) derailers.push('Perfectionism');
    if (hds.dutiful > 70) derailers.push('Conformity');

    return derailers;
  }

  /**
   * Determine key values based on MVPI scores
   * @param {Object} mvpi - MVPI scores
   * @returns {Array} - Key values
   */
  determineHoganValues(mvpi) {
    const values = [];

    if (mvpi.recognition > 70)
      values.push('Public recognition and acknowledgment');
    if (mvpi.power > 70) values.push('Leadership and influence');
    if (mvpi.hedonism > 70) values.push('Enjoyment and pleasure');
    if (mvpi.altruism > 70)
      values.push('Helping others and social contribution');
    if (mvpi.affiliation > 70) values.push('Social connection and belonging');
    if (mvpi.tradition > 70) values.push('Structure and established practices');
    if (mvpi.security > 70) values.push('Predictability and stability');
    if (mvpi.commerce > 70)
      values.push('Business outcomes and financial results');
    if (mvpi.aesthetics > 70) values.push('Creative expression and beauty');
    if (mvpi.science > 70) values.push('Knowledge and intellectual inquiry');

    return values;
  }

  /**
   * Process comprehensive assessment responses
   * @param {Array} responses - Array of comprehensive assessment responses
   * @returns {Object} - Comprehensive result
   */
  processComprehensiveResponses(responses) {
    // Organize responses by assessment type
    const mbtiResponses = responses.filter(r => r.category === 'mbti');
    const discResponses = responses.filter(r => r.category === 'disc');
    const hollandResponses = responses.filter(r => r.category === 'holland');

    // Process each assessment type
    const mbtiResult =
      mbtiResponses.length > 0
        ? this.processMBTIResponses(mbtiResponses)
        : null;
    const discResult =
      discResponses.length > 0
        ? this.processDISCResponses(discResponses)
        : null;
    const hollandResult =
      hollandResponses.length > 0
        ? this.processHollandResponses(hollandResponses)
        : null;

    // Compile the integrated assessment (HOMBDIHO)
    const results = {
      mbti: mbtiResult,
      disc: discResult,
      holland: hollandResult,
    };

    // Generate integrated assessment
    const integratedAssessment = this.generateIntegratedAssessment(results);

    return {
      individualAssessments: results,
      integratedAssessment,
    };
  }

  /**
   * Generate integrated assessment from individual results
   * @param {Object} results - Individual assessment results
   * @returns {Object} - Integrated assessment
   */
  generateIntegratedAssessment(results) {
    const { mbti, disc, holland } = results;

    // Extract key traits from each assessment
    const mbtiTraits = mbti ? mbti.description.traits : [];
    const discTraits = disc ? disc.description.traits : [];
    const hollandTraits = holland ? holland.description.traits : [];

    // Compile integrated traits
    const allTraits = [...mbtiTraits, ...discTraits, ...hollandTraits];

    // Extract strengths
    const mbtiStrengths = mbti ? mbti.description.strengths : [];
    const discWorkStyle = disc ? disc.description.workStyle : [];
    const hollandStrengths = holland ? holland.description.strengths : [];

    // Compile integrated strengths
    const allStrengths = [
      ...mbtiStrengths,
      ...discWorkStyle,
      ...hollandStrengths,
    ];

    // Extract career preferences
    const mbtiType = mbti ? mbti.type : '';
    const discProfile = disc ? disc.profileType : '';
    const hollandCode = holland ? holland.riasecCode : '';

    // Generate career direction recommendations
    const careerDirections = this.generateIntegratedCareerDirections(
      mbtiType,
      discProfile,
      hollandCode
    );

    return {
      personalityProfile: {
        primaryTraits: [...new Set(allTraits)].slice(0, 5),
        strengths: [...new Set(allStrengths)].slice(0, 5),
        workStyleSummary: this.generateWorkStyleSummary(mbti, disc, holland),
      },
      careerDirections,
      profiles: {
        mbtiType: mbti ? mbti.type : null,
        discProfile: disc ? disc.profileType : null,
        hollandCode: holland ? holland.riasecCode : null,
      },
    };
  }

  /**
   * Generate work style summary from assessment results
   * @param {Object} mbti - MBTI result
   * @param {Object} disc - DISC result
   * @param {Object} holland - Holland result
   * @returns {string} - Work style summary
   */
  generateWorkStyleSummary(mbti, disc, holland) {
    let summary = '';

    if (mbti) {
      if (mbti.type.includes('E')) {
        summary += 'Draws energy from social interaction. ';
      } else {
        summary += 'Processes information internally before sharing. ';
      }

      if (mbti.type.includes('S')) {
        summary += 'Focuses on concrete facts and details. ';
      } else {
        summary += 'Sees patterns and future possibilities. ';
      }

      if (mbti.type.includes('T')) {
        summary += 'Makes decisions based on logical analysis. ';
      } else {
        summary += 'Considers impact on people when making decisions. ';
      }

      if (mbti.type.includes('J')) {
        summary += 'Prefers structure and planning. ';
      } else {
        summary += 'Adapts flexibly to changing circumstances. ';
      }
    }

    if (disc) {
      if (disc.scores.D > 70) {
        summary += 'Takes charge of situations. ';
      }
      if (disc.scores.I > 70) {
        summary += 'Communicates enthusiastically with others. ';
      }
      if (disc.scores.S > 70) {
        summary += 'Works steadily and cooperatively. ';
      }
      if (disc.scores.C > 70) {
        summary += 'Focuses on quality and accuracy. ';
      }
    }

    if (holland) {
      const primary = holland.primaryType;
      if (primary === 'R') summary += 'Enjoys hands-on, practical work. ';
      if (primary === 'I')
        summary += 'Values intellectual challenges and analysis. ';
      if (primary === 'A') summary += 'Expresses creativity and innovation. ';
      if (primary === 'S')
        summary += 'Prioritizes helping and working with others. ';
      if (primary === 'E') summary += 'Takes initiative and leads projects. ';
      if (primary === 'C')
        summary += 'Excels in organized, structured environments. ';
    }

    return summary.trim();
  }

  /**
   * Generate integrated career directions based on assessment results
   * @param {string} mbtiType - MBTI type
   * @param {string} discProfile - DISC profile
   * @param {string} hollandCode - Holland/RIASEC code
   * @returns {Array} - Career directions
   */
  generateIntegratedCareerDirections(mbtiType, discProfile, hollandCode) {
    // Map common career paths based on MBTI type
    const mbtiCareers = {
      ISTJ: [
        'Accounting',
        'IT Management',
        'Logistics',
        'Operations Management',
      ],
      ISFJ: [
        'Nursing',
        'Administration',
        'Primary Education',
        'Customer Service',
      ],
      INFJ: [
        'Counseling',
        'HR Development',
        'Writing',
        'Non-profit Leadership',
      ],
      INTJ: [
        'Strategic Planning',
        'Financial Analysis',
        'Scientific Research',
        'Systems Design',
      ],
      ISTP: [
        'Engineering',
        'Forensics',
        'Technical Support',
        'Crisis Response',
      ],
      ISFP: [
        'Graphic Design',
        'Healthcare Support',
        'Culinary Arts',
        'Personal Care',
      ],
      INFP: ['Counseling', 'Content Creation', 'UX Design', 'Teaching'],
      INTP: [
        'Software Development',
        'Data Analysis',
        'Academic Research',
        'Architecture',
      ],
      ESTP: ['Sales', 'Entrepreneurship', 'Emergency Services', 'Sports'],
      ESFP: [
        'Event Planning',
        'Customer Experience',
        'Primary Education',
        'Hospitality',
      ],
      ENFP: [
        'Marketing',
        'Counseling',
        'Public Relations',
        'Training & Development',
      ],
      ENTP: [
        'Entrepreneurship',
        'Consulting',
        'Creative Direction',
        'Product Development',
      ],
      ESTJ: [
        'Project Management',
        'Law Enforcement',
        'Financial Services',
        'Healthcare Administration',
      ],
      ESFJ: ['Healthcare', 'Customer Service', 'Education', 'Social Services'],
      ENFJ: ['HR Management', 'Teaching', 'Non-profit Leadership', 'Coaching'],
      ENTJ: [
        'Executive Leadership',
        'Management Consulting',
        'Law',
        'Business Development',
      ],
    };

    // Map career paths based on DISC profile
    const discCareers = {
      DI: [
        'Sales Leadership',
        'Entrepreneurship',
        'Executive Management',
        'Politics',
      ],
      DC: [
        'Financial Analysis',
        'Legal Practice',
        'Operations Leadership',
        'Engineering Management',
      ],
      DS: [
        'Project Management',
        'Operations Management',
        'Healthcare Administration',
        'Military Leadership',
      ],
      ID: ['Marketing', 'Event Management', 'Public Relations', 'Sales'],
      IS: ['Teaching', 'HR', 'Customer Success', 'Non-profit'],
      IC: [
        'Training & Development',
        'Communications',
        'Technical Sales',
        'Market Research',
      ],
      SD: [
        'Healthcare',
        'Operations Support',
        'Administrative Leadership',
        'Community Services',
      ],
      SI: ['Counseling', 'Social Work', 'Customer Relations', 'Education'],
      SC: [
        'Support Services',
        'Quality Assurance',
        'Healthcare Support',
        'Administrative Services',
      ],
      CD: ['Analytics', 'Quality Control', 'Process Improvement', 'Research'],
      CI: ['Technical Writing', 'Systems Analysis', 'Research', 'IT Support'],
      CS: [
        'Accounting',
        'Administrative Support',
        'Data Analysis',
        'Project Coordination',
      ],
    };

    // Extract Holland code careers
    const hollandCareerMap = {
      RIA: ['Engineering', 'Medical Technology', 'Environmental Science'],
      RIE: [
        'Technical Management',
        'Engineering Leadership',
        'Systems Administration',
      ],
      RIS: [
        'Medical Technology',
        'Environmental Conservation',
        'Agriculture Science',
      ],
      RAI: ['Architecture', 'Technical Design', 'Craft Artisanship'],
      RAS: ['Physical Therapy', 'Occupational Health', 'Sports Training'],
      RAE: [
        'Construction Management',
        'Craft Entrepreneurship',
        'Technical Arts',
      ],
      RSI: ['Healthcare Technology', 'Exercise Science', 'Safety Management'],
      RSA: ['Coaching', 'Physical Education', 'Recreational Therapy'],
      RSE: [
        'Protective Services Leadership',
        'Sports Management',
        'Healthcare Management',
      ],
      REI: ['Production Management', 'Technical Sales', 'Entrepreneurship'],
      RES: [
        'Military Leadership',
        'Law Enforcement Administration',
        'Coaching',
      ],
      REA: [
        'Construction Management',
        'Technical Entertainment',
        'Outdoor Leadership',
      ],
      IRC: ['Research Science', 'Medical Research', 'Software Development'],
      IRA: ['Medicine', 'Environmental Science', 'Research & Development'],
      IRE: [
        'Engineering Research',
        'Technical Development',
        'Systems Architecture',
      ],
      IAR: [
        'Scientific Illustration',
        'Medical Research',
        'Scientific Writing',
      ],
      IAS: ['Psychology', 'Health Sciences', 'Behavioral Research'],
      IAE: [
        'Research Leadership',
        'Scientific Communications',
        'Health Advocacy',
      ],
      ISR: ['Medicine', 'Social Science Research', 'Educational Research'],
      ISA: ['Psychology', 'Social Sciences', 'Educational Theory'],
      ISE: [
        'Research Administration',
        'Educational Leadership',
        'Clinical Practice Management',
      ],
      IER: [
        'Research & Development Management',
        'Technical Management',
        'Scientific Leadership',
      ],
      IES: [
        'Healthcare Administration',
        'Educational Administration',
        'Research Management',
      ],
      IEA: [
        'Research Program Direction',
        'Scientific Entrepreneurship',
        'Creative Technology',
      ],
      // Additional combinations can be added as needed
    };

    // Initialize career suggestions
    let careerSuggestions = [];

    // Add MBTI-based careers
    if (mbtiType && mbtiCareers[mbtiType]) {
      careerSuggestions = [...careerSuggestions, ...mbtiCareers[mbtiType]];
    }

    // Add DISC-based careers
    if (discProfile && discCareers[discProfile]) {
      careerSuggestions = [...careerSuggestions, ...discCareers[discProfile]];
    }

    // Add Holland-based careers
    if (hollandCode && hollandCode.length >= 3) {
      const code3 = hollandCode.substring(0, 3);
      const code3a = `${code3[0]}${code3[1]}${code3[2]}`;
      const code3b = `${code3[0]}${code3[2]}${code3[1]}`;

      if (hollandCareerMap[code3a]) {
        careerSuggestions = [...careerSuggestions, ...hollandCareerMap[code3a]];
      }
      if (hollandCareerMap[code3b]) {
        careerSuggestions = [...careerSuggestions, ...hollandCareerMap[code3b]];
      }
    }

    // Remove duplicates and trim list
    return [...new Set(careerSuggestions)].slice(0, 10);
  }

  /**
   * Generate career matches based on assessment results
   * @param {string} userId - User ID
   * @param {string} assessmentType - Assessment type
   * @param {Object} result - Assessment result
   * @returns {Promise<Object>} - Career matches
   */
  async generateCareerMatches(userId, assessmentType, result) {
    try {
      // Determine which fields to use for matching based on assessment type
      let matchCriteria = {};

      switch (assessmentType) {
        case 'mbti':
          matchCriteria = {
            mbtiType: result.type,
          };
          break;
        case 'disc':
          matchCriteria = {
            discProfile: result.profileType,
          };
          break;
        case 'holland':
          matchCriteria = {
            hollandCode: result.riasecCode,
          };
          break;
        case 'comprehensive':
          const { mbti, disc, holland } = result.individualAssessments;
          matchCriteria = {
            mbtiType: mbti ? mbti.type : null,
            discProfile: disc ? disc.profileType : null,
            hollandCode: holland ? holland.riasecCode : null,
          };
          break;
        default:
          matchCriteria = {};
      }

      // Search career dictionary for matches
      let careerMatches = [];

      // Check MBTI matches
      if (matchCriteria.mbtiType) {
        try {
          const mbtiRef = careerDictionaryService.collections.mbti.doc(
            matchCriteria.mbtiType
          );
          const mbtiDoc = await mbtiRef.get();

          if (mbtiDoc.exists) {
            const mbtiData = mbtiDoc.data();
            const onetCodes = mbtiData.onetCodes || [];

            // Get O*NET occupations for these codes
            for (const code of onetCodes.slice(0, 10)) {
              const occupation =
                await careerDictionaryService.getComprehensiveOccupation(code);

              if (occupation.success) {
                careerMatches.push({
                  matchType: 'mbti',
                  confidence: 'high',
                  occupation: occupation.occupation,
                });
              }
            }
          }
        } catch (error) {
          logger.error(`Error getting MBTI career matches: ${error.message}`);
        }
      }

      // Check Holland/RIASEC matches
      if (matchCriteria.hollandCode && matchCriteria.hollandCode.length >= 3) {
        try {
          const primaryCode = matchCriteria.hollandCode.charAt(0);
          const secondaryCode = matchCriteria.hollandCode.charAt(1);

          // Search for occupations with matching RIASEC codes
          const hollandQuery = await careerDictionaryService.searchCareerData({
            keywords: `${primaryCode} ${secondaryCode}`,
            limit: 10,
          });

          if (hollandQuery.success && hollandQuery.results.length > 0) {
            hollandQuery.results.forEach(result => {
              if (result.source === 'onet') {
                careerMatches.push({
                  matchType: 'holland',
                  confidence: 'medium',
                  occupation: result,
                });
              }
            });
          }
        } catch (error) {
          logger.error(
            `Error getting Holland career matches: ${error.message}`
          );
        }
      }

      // Remove duplicates based on occupation code
      const uniqueMatches = [];
      const seenCodes = new Set();

      careerMatches.forEach(match => {
        const code = match.occupation.code || match.occupation.id;
        if (!seenCodes.has(code)) {
          seenCodes.add(code);
          uniqueMatches.push(match);
        }
      });

      // Store career matches
      const matchesId = uuidv4();
      const matchesRef = this.collections.careerMatches.doc(matchesId);

      const matchesData = {
        id: matchesId,
        userId,
        assessmentType,
        criteria: matchCriteria,
        matches: uniqueMatches,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await matchesRef.set(matchesData);

      return {
        success: true,
        matchesId,
        criteria: matchCriteria,
        matches: uniqueMatches,
      };
    } catch (error) {
      logger.error(`Error generating career matches: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update user profile with assessment results
   * @param {string} userId - User ID
   * @param {string} resultId - Assessment result ID
   * @returns {Promise<Object>} - Update result
   */
  async updateUserProfile(userId, resultId) {
    try {
      // Get assessment result
      const resultRef = this.collections.results.doc(resultId);
      const resultDoc = await resultRef.get();

      if (!resultDoc.exists) {
        throw new Error(`Result not found: ${resultId}`);
      }

      const result = resultDoc.data();

      // Get current user profile
      const profileRef = this.collections.userProfiles.doc(userId);
      const profileDoc = await profileRef.get();

      // Create or update profile
      const profileUpdate = {
        userId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        assessmentResults: admin.firestore.FieldValue.arrayUnion({
          resultId,
          type: result.type,
          timestamp: result.createdAt,
        }),
      };

      // Add assessment-specific data
      switch (result.type) {
        case 'mbti':
          profileUpdate.mbtiType = result.result.type;
          break;
        case 'disc':
          profileUpdate.discProfile = result.result.profileType;
          break;
        case 'holland':
          profileUpdate.hollandCode = result.result.riasecCode;
          break;
        case 'comprehensive':
          if (result.result.individualAssessments.mbti) {
            profileUpdate.mbtiType =
              result.result.individualAssessments.mbti.type;
          }
          if (result.result.individualAssessments.disc) {
            profileUpdate.discProfile =
              result.result.individualAssessments.disc.profileType;
          }
          if (result.result.individualAssessments.holland) {
            profileUpdate.hollandCode =
              result.result.individualAssessments.holland.riasecCode;
          }
          break;
      }

      // Update or create profile
      if (profileDoc.exists) {
        await profileRef.update(profileUpdate);
      } else {
        await profileRef.set({
          ...profileUpdate,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return {
        success: true,
        userId,
        profileUpdated: true,
      };
    } catch (error) {
      logger.error(`Error updating user profile: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user profile with assessment history
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile with assessment history
   */
  async getUserProfile(userId) {
    try {
      // Get user profile
      const profileRef = this.collections.userProfiles.doc(userId);
      const profileDoc = await profileRef.get();

      if (!profileDoc.exists) {
        return {
          success: false,
          error: `User profile not found: ${userId}`,
        };
      }

      const profile = profileDoc.data();

      // Get latest assessment results
      const assessmentResults = [];

      if (
        profile.assessmentResults &&
        Array.isArray(profile.assessmentResults)
      ) {
        // Sort by timestamp (newest first)
        profile.assessmentResults.sort((a, b) => {
          const timeA =
            a.timestamp instanceof admin.firestore.Timestamp
              ? a.timestamp.toMillis()
              : 0;
          const timeB =
            b.timestamp instanceof admin.firestore.Timestamp
              ? b.timestamp.toMillis()
              : 0;
          return timeB - timeA;
        });

        // Get latest 5 results
        for (const assessmentResult of profile.assessmentResults.slice(0, 5)) {
          const resultRef = this.collections.results.doc(
            assessmentResult.resultId
          );
          const resultDoc = await resultRef.get();

          if (resultDoc.exists) {
            const result = resultDoc.data();
            assessmentResults.push({
              id: result.id,
              type: result.type,
              timestamp: result.createdAt,
              summary: this.getAssessmentSummary(result),
            });
          }
        }
      }

      // Get latest career matches
      const matchesQuery = await this.collections.careerMatches
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      let latestMatches = [];

      if (!matchesQuery.empty) {
        const matchesDoc = matchesQuery.docs[0];
        const matchesData = matchesDoc.data();

        latestMatches = matchesData.matches || [];
      }

      return {
        success: true,
        profile: {
          userId,
          mbtiType: profile.mbtiType,
          discProfile: profile.discProfile,
          hollandCode: profile.hollandCode,
          personalityTraits: profile.personalityTraits || [],
          strengths: profile.strengths || [],
          workStyle: profile.workStyle || '',
          assessmentResults,
          careerMatches: latestMatches.slice(0, 5),
        },
      };
    } catch (error) {
      logger.error(`Error getting user profile: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get assessment summary
   * @param {Object} result - Assessment result
   * @returns {Object} - Assessment summary
   */
  getAssessmentSummary(result) {
    switch (result.type) {
      case 'mbti':
        return {
          type: result.result.type,
          name: result.result.description.name,
          traits: result.result.description.traits.slice(0, 3),
        };
      case 'disc':
        return {
          profileType: result.result.profileType,
          name: result.result.description.name,
          traits: result.result.description.traits.slice(0, 3),
        };
      case 'holland':
        return {
          riasecCode: result.result.riasecCode,
          primary: result.result.description.primary,
          secondary: result.result.description.secondary,
          careerThemes: result.result.description.careerThemes.slice(0, 3),
        };
      case 'comprehensive':
        const integratedAssessment = result.result.integratedAssessment;
        return {
          mbtiType: integratedAssessment.profiles.mbtiType,
          discProfile: integratedAssessment.profiles.discProfile,
          hollandCode: integratedAssessment.profiles.hollandCode,
          traits: integratedAssessment.personalityProfile.primaryTraits.slice(
            0,
            3
          ),
          careerDirections: integratedAssessment.careerDirections.slice(0, 3),
        };
      default:
        return {};
    }
  }
}

// Create singleton instance
const psychometricAssessmentService = new PsychometricAssessmentService();

module.exports = psychometricAssessmentService;
