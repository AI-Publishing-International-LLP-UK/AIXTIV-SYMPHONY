#!/bin/bash
# Firebase Deployment Script for AIXTIV SYMPHONY

echo "=== AIXTIV SYMPHONY Firebase Deployment ==="
echo "Setting up Firebase deployment for your multi-component system"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Ensure user is logged in
# Check if logged in
firebase projects:list >/dev/null 2>&1
if [ $? -ne 0 ]; then
echo "You need to log in to Firebase first"
firebase login --no-localhost
else
echo "Already logged in to Firebase"
fi

# Initialize Firebase if not already done
if [ ! -f "firebase.json" ]; then
    echo "Initializing Firebase..."
    echo "Please select the following options when prompted:"
    echo " - Firestore: for database"
    echo " - Functions: for serverless functions"
    echo " - Hosting: for multiple sites"
    echo " - Storage: for file storage"
    echo " - Emulators: for local development"
    echo ""
    echo "Press Enter to continue with Firebase initialization..."
    read
    
    # Initialize Firebase with recommended features
    firebase init
fi

# Create firebase.json for multi-site hosting if it doesn't exist
if [ ! -f "firebase.json" ] || ! grep -q "\"hosting\":" "firebase.json"; then
    echo "Creating multi-site hosting configuration..."
    cat > firebase.json << 'EOL'
{
"hosting": [
    {
    "target": "anthology",
    "public": "anthology/build",
    "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
    ],
    "rewrites": [
        {
        "source": "**",
        "destination": "/index.html"
        }
    ]
    },
    {
    "target": "orchestrate",
    "public": "orchestrate/build",
    "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
    ],
    "rewrites": [
        {
        "source": "**",
        "destination": "/index.html"
        }
    ]
    },
    {
    "target": "academy",
    "public": "academy/build",
    "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
    ],
    "rewrites": [
        {
        "source": "**",
        "destination": "/index.html"
        }
    ]
    },
    {
    "target": "visualization",
    "public": "visualization/build",
    "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
    ],
    "rewrites": [
        {
        "source": "**",
        "destination": "/index.html"
        }
    ]
    }
],
"firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
},
"functions": {
    "source": "functions"
},
"storage": {
    "rules": "storage.rules"
}
}
EOL
fi

# Create basic Firestore rules
if [ ! -f "firestore.rules" ]; then
    echo "Creating Firestore security rules..."
    cat > firestore.rules << 'EOL'
rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
    // Allow authenticated access to user profiles
    match /users/{userId} {
    allow read: if request.auth != null && request.auth.uid == userId;
    allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated access to campaigns
    match /campaigns/{campaignId} {
    allow read: if request.auth != null;
    allow write: if request.auth != null;
    }
    
    // Allow authenticated access to domain content
    match /domainContent/{documentId} {
    allow read: if request.auth != null;
    allow write: if request.auth != null;
    }
    
    // Allow public read access to domain structure
    match /domainStructure/{documentId} {
    allow read: if true;
    allow write: if request.auth != null;
    }
    
    // More collection rules can be added here
}
}
EOL
fi

# Create Firestore indexes
if [ ! -f "firestore.indexes.json" ]; then
    echo "Creating Firestore indexes configuration..."
    cat > firestore.indexes.json << 'EOL'
{
"indexes": [],
"fieldOverrides": []
}
EOL
fi

# Create storage rules
if [ ! -f "storage.rules" ]; then
    echo "Creating Storage security rules..."
    cat > storage.rules << 'EOL'
rules_version = '2';
service firebase.storage {
match /b/{bucket}/o {
    match /{allPaths=**} {
    allow read, write: if request.auth != null;
    }
}
}
EOL
fi

# Create target directories if they don't exist
mkdir -p anthology/build orchestrate/build academy/build visualization/build

# Create placeholder index files if they don't exist
for dir in anthology orchestrate academy visualization; do
    if [ ! -f "$dir/build/index.html" ]; then
        echo "Creating placeholder for $dir..."
        mkdir -p $dir/build
        
        # Get capitalized directory name using tr
        dir_cap=$(echo "$dir" | tr '[:lower:]' '[:upper:]')
        dir_title=$(echo "$dir" | sed 's/\(.\)/\u\1/')
        
        cat > "$dir/build/index.html" << EOL
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AIXTIV SYMPHONY - $dir_title</title>
    <style>
    body {
        font-family: Arial, sans-serif;
        background-color: #1a202c;
        color: #e2e8f0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
    }
    .container {
        text-align: center;
        padding: 2rem;
        border-radius: 0.5rem;
        background-color: #2d3748;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        max-width: 80%;
    }
    h1 {
        color: #38b2ac;
        margin-bottom: 1rem;
    }
    p {
        margin-bottom: 2rem;
    }
    .logo {
        margin-bottom: 2rem;
        font-size: 2rem;
        color: #4fd1c5;
    }
    </style>
</head>
<body>
    <div class="container">
    <div class="logo">AIXTIV SYMPHONY</div>
    <h1>$dir_title Platform</h1>
    <p>This is a placeholder for the $dir_title component of AIXTIV SYMPHONY.</p>
    <p>Build version: 1.0</p>
    </div>
</body>
</html>
EOL
    fi
done

# Create .firebaserc file for project configuration
if [ ! -f ".firebaserc" ]; then
    echo "Retrieving your Firebase projects..."
    
    # Get list of projects
    projects=$(firebase projects:list --json | grep '"name"' | cut -d'"' -f4)
    project_ids=$(firebase projects:list --json | grep '"projectId"' | cut -d'"' -f4)
    
    if [ -z "$projects" ]; then
        echo "No projects found. Please create a Firebase project first."
        echo "Visit https://console.firebase.google.com/"
        exit 1
    fi
    
    # Display projects
    echo "Available Firebase projects:"
    i=1
    IFS=$'\n'
    for project in $projects; do
        project_id=$(echo "$project_ids" | sed -n "${i}p")
        echo "  $i) $project ($project_id)"
        i=$((i+1))
    done
    
    # Select project
    echo ""
    echo "Select a project by number:"
    read -r selection
    
    # Validate selection
    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "$i" ]; then
        echo "Invalid selection. Please run the script again."
        exit 1
    fi
    
    # Get selected project ID
    project_id=$(echo "$project_ids" | sed -n "${selection}p")
    echo "Selected project: $project_id"
    
    # Create .firebaserc file
    cat > .firebaserc << EOL
{
"projects": {
    "default": "${project_id}"
},
"targets": {
    "${project_id}": {
    "hosting": {
        "anthology": [
        "anthology-aixtiv"
        ],
        "orchestrate": [
        "orchestrate-aixtiv"
        ],
        "academy": [
        "academy-aixtiv"
        ],
        "visualization": [
        "visualization-aixtiv"
        ]
    }
    }
}
}
EOL
else
    # Extract project ID from existing .firebaserc
    project_id=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)
    echo "Using existing project configuration: $project_id"
fi

# Configure hosting targets
echo "Configuring Firebase hosting targets..."

# Ensure project exists and is accessible
if ! firebase projects:list | grep -q "$project_id"; then
    echo "Error: Project $project_id not found or not accessible."
    echo "Please check your Firebase project settings and permissions."
    exit 1
fi

# Apply hosting targets with error handling
echo "Setting up anthology hosting target..."
firebase target:apply hosting anthology anthology-aixtiv || {
    echo "Failed to set anthology target. Creating hosting site first..."
    firebase hosting:sites:create anthology-aixtiv
    firebase target:apply hosting anthology anthology-aixtiv
}

echo "Setting up orchestrate hosting target..."
firebase target:apply hosting orchestrate orchestrate-aixtiv || {
    echo "Failed to set orchestrate target. Creating hosting site first..."
    firebase hosting:sites:create orchestrate-aixtiv
    firebase target:apply hosting orchestrate orchestrate-aixtiv
}

echo "Setting up academy hosting target..."
firebase target:apply hosting academy academy-aixtiv || {
    echo "Failed to set academy target. Creating hosting site first..."
    firebase hosting:sites:create academy-aixtiv
    firebase target:apply hosting academy academy-aixtiv
}

echo "Setting up visualization hosting target..."
firebase target:apply hosting visualization visualization-aixtiv || {
    echo "Failed to set visualization target. Creating hosting site first..."
    firebase hosting:sites:create visualization-aixtiv
    firebase target:apply hosting visualization visualization-aixtiv
}

# Create basic functions directory if it doesn't exist
if [ ! -d "functions" ] || [ ! -f "functions/index.js" ]; then
    echo "Setting up Firebase Functions..."
    mkdir -p functions
    
    # Create functions/package.json if it doesn't exist
    if [ ! -f "functions/package.json" ]; then
        cd functions
        
        # Initialize package.json
        cat > package.json << 'EOL'
{
"name": "aixtiv-symphony-functions",
"description": "Cloud Functions for AIXTIV SYMPHONY",
"scripts": {
    "lint": "eslint .",
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
},
"engines": {
    "node": "18"
},
"main": "index.js",
"dependencies": {
    "firebase-admin": "^11.8.0",
    "firebase-functions": "^4.3.1",
    "axios": "^1.4.0"
},
"devDependencies": {
    "eslint": "^8.15.0",
    "eslint-config-google": "^0.14.0"
},
"private": true
}
EOL
        
        # Create basic index.js for functions
        cat > index.js << 'EOL'
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Hello world function to test deployment
exports.helloWorld = functions.https.onRequest((request, response) => {
response.send("Hello from AIXTIV SYMPHONY Functions!");
});

// Cloud Function to sync data between systems
exports.syncPlatformData = functions.firestore
.document('campaigns/{campaignId}')
.onUpdate((change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const campaignId = context.params.campaignId;
    
    console.log(`Campaign ${campaignId} updated`);
    // Add your sync logic here
    
    return null;
});

// Scheduled function to run publishing tasks
exports.scheduledPublishing = functions.pubsub
.schedule('every 30 minutes')
.onRun((context) => {
    console.log('Running scheduled publishing task');
    // Add your publishing logic here
    
    return null;
});
EOL
        
        cd ..
    fi
fi

# Final check and deployment
echo "Checking configuration before deployment..."

if [ -f "firebase.json" ] && [ -f ".firebaserc" ]; then
    echo "Firebase configuration is ready for deployment."
    
    # Ask for confirmation before deploying
    read -p "Do you want to deploy to Firebase now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deploying to Firebase..."
        
        # Set deployment options
        echo "What would you like to deploy?"
        echo "1) Everything (hosting, functions, firestore, storage)"
        echo "2) Hosting only"
        echo "3) Functions only"
        echo "4) Custom deployment"
        read -p "Enter your choice (1-4): " deploy_choice
        
        case $deploy_choice in
            1)
                echo "Deploying everything..."
                firebase deploy
                ;;
            2)
                echo "Deploying hosting only..."
                firebase deploy --only hosting
                ;;
            3)
                echo "Deploying functions only..."
                firebase deploy --only functions
                ;;
            4)
                echo "Available deployment options (comma-separated):"
                echo "- hosting:anthology"
                echo "- hosting:orchestrate"
                echo "- hosting:academy"
                echo "- hosting:visualization"
                echo "- functions"
                echo "- firestore"
                echo "- storage"
                read -p "Enter deployment options: " custom_options
                
                if [ -n "$custom_options" ]; then
                    firebase deploy --only $custom_options
                else
                    echo "No options selected, cancelling deployment."
                fi
                ;;
            *)
                echo "Invalid choice, deploying everything by default..."
                firebase deploy
                ;;
        esac
        
        echo ""
        echo "=== Deployment Complete ==="
        echo ""
        echo "Your AIXTIV SYMPHONY system is now live on Firebase!"
        echo ""
        echo "Next steps:"
        echo "1. Connect your custom domains in Firebase Hosting"
        echo "2. Upload your actual front-end builds to each component directory"
        echo "3. Configure your environment variables in the Firebase console"
        echo "4. Set up authentication and database access rules"
        echo "5. Deploy your custom functions for additional logic"
        echo ""
        echo "To view your deployments:"
        echo "- Visit the Firebase console: https://console.firebase.google.com"
        echo "- Select your project"
        echo "- Go to Hosting to see all your deployed sites"
    else
        echo "Error: Firebase configuration files are missing."
        exit 1
    fi
fi
