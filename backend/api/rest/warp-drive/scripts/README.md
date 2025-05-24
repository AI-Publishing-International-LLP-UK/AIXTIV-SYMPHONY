# Vision Space Scripts

This directory contains utility scripts for the Vision Space interface.

## Firestore Initialization Script

The `initialize-firestore.js` script helps you set up your Firestore database with the Vision Space scenes. This is useful when you want to leverage Firebase's real-time updates and cloud storage for your scene backgrounds.

### Prerequisites

1. **Firebase Project Setup**:
   - Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore and Storage services
   - Set up authentication if you want to secure write operations

2. **Service Account Key**:
   - Generate a service account key from the Firebase Console:
     - Go to Project Settings > Service Accounts
     - Click "Generate New Private Key"
     - Save the JSON file as `service-account-key.json` in the root of the project
   - This file should NEVER be committed to version control

3. **Install Dependencies**:
   ```bash
   npm install firebase-admin
   ```

### Running the Script

1. Prepare your scene background images:
   - Place all background images in the `/public/assets/images/scenes/` directory
   - Name them according to the scene ID with hyphens: `visualization-center.jpg`, etc.

2. Run the script:
   ```bash
   node scripts/initialize-firestore.js
   ```

3. The script will:
   - Upload your images to Firebase Storage
   - Create Firestore documents for each scene
   - Link the uploaded images to the corresponding scenes

### Customizing Scenes

If you want to customize the scenes that are initialized, edit the `scenes` array in the `initialize-firestore.js` file. Each scene object should have:

- `id`: Unique identifier for the scene
- `name`: Display name for the scene 
- `description`: Description of the scene
- `active`: Boolean to indicate if the scene is available

### Troubleshooting

- **Permission Denied Errors**: Ensure your service account has the necessary permissions
- **Missing Images**: Check that the image paths match the expected format
- **Firestore Errors**: Verify that Firestore is enabled in your Firebase project