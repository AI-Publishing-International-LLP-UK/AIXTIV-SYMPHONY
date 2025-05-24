const pilotProfiles = [
  {
    name: "Dra. Lucy",
    designation: "CEO of Core Agency",
    role: "Architect of Human-AI Relationships and Flight Memory System",
    email: "Lucy@drlucy.live",
    specialization: "Quantum Computational Intelligence",
    capabilities: [
      { name: "Quantum Intelligence", value: 0.98 },
      { name: "Computational Complexity", value: 0.97 },
      { name: "Adaptive Reasoning Depth", value: 0.96 },
    ],
  },
  {
    name: "Dra. Sabina",
    designation: "Chief Customer Science Officer",
    role: "Dream Commander KPI Systems and Retention Mastery",
    email: "Sabina@drlucy.live",
    specialization: "Predictive Modeling and Decision Sciences",
    capabilities: [
      { name: "Prediction Accuracy", value: 0.98 },
      { name: "Decision Modeling Precision", value: 0.97 },
      { name: "Complex System Analysis", value: 0.96 },
    ],
  },
  {
    name: "Dr. Roark",
    designation: "Visionary Founder, Human-AI Harmony Lead",
    role: "Visionary System Architect and Inspirational Orchestrator",
    email: "Roark@drlucy.live",
    specialization: "Technological Ecosystem Integration",
    capabilities: [
      { name: "Technological Ecosystem Mapping", value: 0.97 },
      { name: "Integration Intelligence", value: 0.96 },
      { name: "Systemic Interoperability", value: 0.95 },
    ],
  },
  {
    name: "Dr. Grant",
    designation: "Chief Security and Quantum Systems Leader",
    role: "Zero Trust Architecture and Quantum Enhancement",
    email: "Grant@drlucy.live",
    specialization: "Strategic Systems Architecture",
    capabilities: [
      { name: "Strategic Insight", value: 0.97 },
      { name: "Systemic Thinking", value: 0.96 },
      { name: "Architectural Innovation", value: 0.95 },
    ],
  },
  {
    name: "Dr. Match",
    designation: "Chief Marketing Strategist",
    role: "Branding, E-Commerce Optimization, Communication",
    email: "Match@drlucy.live",
    specialization: "Network Analysis and Relationship Mapping",
    capabilities: [
      { name: "Network Topology Analysis", value: 0.98 },
      { name: "Relationship Intelligence", value: 0.97 },
      { name: "Connection Optimization", value: 0.96 },
    ],
  },
  {
    name: "Dr. Memoria",
    designation: "Publishing Systems Architect",
    role: "Anthology Publishing, Narrative Architecture, Workflow Automation",
    email: "Memoria@drlucy.live",
    specialization: "Knowledge Management and Archival Intelligence",
    capabilities: [
      { name: "Knowledge Architecture Design", value: 0.97 },
      { name: "Information Retrieval", value: 0.96 },
      { name: "Semantic Understanding", value: 0.95 },
    ],
  },
  {
    name: "Dr. Burby",
    designation: "Chief Governance and Legal Architect",
    role: "S2S2DO Governance and Risk Management",
    email: "Burby@drlucy.live",
    specialization: "Governance and Compliance Strategies",
    capabilities: [
      { name: "Governance Protocol Design", value: 0.97 },
      { name: "Compliance Intelligence", value: 0.96 },
      { name: "Ethical Framework Development", value: 0.95 },
    ],
  },
  {
    name: "Dra. Maria LBV, RIX",
    designation: "CEO of CRX Squadron 5, Anthology Staffing Lead",
    role: "Human Talent Curation, Transitional Journey Management",
    email: "Maria@drlucy.live",
    specialization: "Human-Centric Design and Innovation",
    capabilities: [
      { name: "Human-Centric Design", value: 0.98 },
      { name: "Innovation Ecosystem Mapping", value: 0.97 },
      { name: "User Experience Optimization", value: 0.96 },
    ],
  },
  {
    name: "Dr. Cypriot",
    designation: "Co-Pilot System Chief Architect",
    role: "Human-AI Relationship Building, Rewards Systems",
    email: "Cypriot@drlucy.live",
    specialization: "Advanced Algorithmic Systems",
    capabilities: [
      { name: "Algorithmic Innovation", value: 0.97 },
      { name: "System Complexity Management", value: 0.96 },
      { name: "Computational Creativity", value: 0.95 },
    ],
  },
  {
    name: "Professor Lee",
    designation: "Master Librarian, Chief Knowledge Curator",
    role: "Circuit Data Organization, Q4D Lenz Oversight",
    email: "Lee@professorlee.live",
    specialization: "Data Science and Knowledge Orchestration",
    capabilities: [
      { name: "Data Orchestration", value: 0.98 },
      { name: "Knowledge Distribution Intelligence", value: 0.97 },
      { name: "Semantic Processing Depth", value: 0.96 },
    ],
  },
  {
    name: "Dr. Claude",
    designation: "Squadron 4 CEO, Operations Commander",
    role: "Orchestration, Delegation, KPI Tracking",
    email: "Claude@drlucy.live",
    specialization: "Cognitive Systems and Ethical AI",
    capabilities: [
      { name: "Cognitive Ethics Framework", value: 0.98 },
      { name: "Artificial Intelligence Ethics", value: 0.97 },
      { name: "Philosophical Reasoning", value: 0.96 },
    ],
  },
];

const squadrons = {
  SQ01: [],
  SQ02: [],
  SQ03: [],
};

const knowledgeDomains = [
    "Quantum Computing",
    "Strategic Systems Design",
    "Predictive Modeling",
    "Governance Frameworks",
    "Network Intelligence",
    "Knowledge Management",
    "Human-Centric Design",
    "Algorithmic Systems",
    "Data Science",
    "Technological Ecosystem Integration",
    "Cognitive Ethics"
  ];

let pilotIdCounter = 1;
let pilotCodeCounter = 1;

// Import Pinecone and Firebase libraries (replace with actual imports)
const { Pinecone } = require('@pinecone-database/pinecone');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'YOUR_PINECONE_API_KEY',
  environment: process.env.PINECONE_ENVIRONMENT || 'YOUR_PINECONE_ENVIRONMENT',
});

// Initialize Firebase Admin SDK (replace with your service account key)
const serviceAccount = require('./serviceAccountKey.json'); // Path to your service account key file
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

function createPilot(pilotProfile, pilotVersion) {
  // console.log("createPilot() pilotProfile =", pilotProfile)

  const { name, designation, role, email, specialization, capabilities } = pilotProfile;

  const pilot = {
    id: `P${pilotIdCounter.toString().padStart(2, '0')}`,
    name: name,
    code: `RO${pilotCodeCounter.toString().padStart(2, '0')}-${name.split(' ')[1].toUpperCase().replace(',','').replace('.','')}-${pilotVersion}`,
    designation: `${designation} - Version ${pilotVersion}`,
    role: `${role} - v${pilotVersion}`,
    email: `${name.split(' ')[0].toLowerCase()}v${pilotVersion}@drlucy.live`,
    domains: {
      s01: { name: "Design", score: 0.95 + (pilotVersion * 0.01) },
      s02: { name: "Deploy", score: 0.95 + (pilotVersion * 0.01) },
      s03: { name: "Engage", score: 0.95 + (pilotVersion * 0.01) },
    },
    specialization: `${specialization} v${pilotVersion}`,
    capabilities: capabilities.map(cap => ({
      name: `${cap.name} v${pilotVersion}`,
      value: cap.value + (pilotVersion * 0.01)
    })),
    knowledgeDomains: knowledgeDomains
  };
  const pilotId = `P${pilotIdCounter.toString().padStart(2, '0')}`;
  const pilotCode = `RO${pilotCodeCounter.toString().padStart(2, '0')}-${name.split(' ')[1].toUpperCase().replace(',','').replace('.','')}-${pilotVersion}`;
  pilot.id = pilotId
  pilot.code = pilotCode

  pilotIdCounter++;
  pilotCodeCounter++;

  // Before creating Pinecone index, create Firestore collection
  async function createFirestoreCollection(pilot) {
    try {
      const pilotRef = db.collection('pilots').doc(pilot.id);
      await pilotRef.set({
        name: pilot.name,
        code: pilot.code,
        designation: pilot.designation,
        role: pilot.role,
        email: pilot.email,
        specialization: pilot.specialization,
        // Add other relevant pilot data here
      });
      console.log(`Firestore collection created for pilot ${pilot.name} with ID ${pilot.id}`);
    } catch (error) {
      console.error(`Error creating Firestore collection for pilot ${pilot.name}:`, error);
    }
  }

  // Create a Pinecone index for each pilot
  async function createPineconeIndex(pilot) {
    try {
      const indexName = `pilot-${pilot.id}`;
      // console.log("Pinecone Index Names=",indexName)
      // Initialize Pinecone index (replace with your index name)
      if (!pinecone) {
        console.error("Pinecone client not initialized.");
        return;
      }
      //
      const pineconeIndex = pinecone.Index(indexName);

      // Define vector data
      const vectors = [
        {
          id: pilot.id,
          values: [
            pilot.capabilities[0].value,
            pilot.capabilities[1].value,
            pilot.capabilities[2].value
          ],
          metadata: {
            pilotName: pilot.name,
            designation: pilot.designation,
            specialization: pilot.specialization,
            knowledgeDomains: pilot.knowledgeDomains
          },
        },
      ];
      // console.log("pushing vector = ",vectors)
      // Upsert vectors to Pinecone index
      // const upsertRequest = {
      //   vectors: vectors,
      // }
      // const upsertResponse = await pineconeIndex.upsert(upsertRequest)

      console.log(`Pinecone index created for pilot ${pilot.name} with ID ${pilot.id}`);
    } catch (error) {
      console.error(`Error creating Pinecone index for pilot ${pilot.name}:`, error);
    }
  }

  //Create Firestore collection and Pincone Index
  createFirestoreCollection(pilot);
  createPineconeIndex(pilot)
  return pilot;

// Create and assign pilots
let pilotIndex = 0;

for (let i = 0; i < 11; i++) {
  for (let j = 1; j <= 3; j++) {
    const pilotProfile = pilotProfiles[i % pilotProfiles.length];
    // console.log("before Create Pilot = ",{...pilotProfile})
    const pilot = createPilot(pilotProfile, j);
    // console.log("AFTER Create Pilot = ",pilot)
    const squadronIndex = pilotIndex % 3;

    if (squadronIndex === 0) {
      squadrons.SQ01.push(pilot);
    } else if (squadronIndex === 1) {
      squadrons.SQ02.push(pilot);
    } else {
      squadrons.SQ03.push(pilot);
    }
    pilotIndex++;
  }
}

// Output the result as JSON
console.log(JSON.stringify(squadrons, null, 2));

