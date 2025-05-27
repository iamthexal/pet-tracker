# Pet Tracker Overview

## Project Description
Pet Tracker is a Next.js web application designed to help users manage and track their pets' health and care routines.

## Key Features
- **Dashboard**: Real-time statistics and updates about pets, appointments, and medications
- **Pet Management**: Individual pet profiles with tracking for:
  - Appointments
  - Medications
  - Feeding schedules
  - Weight history
  - Notes

## Technical Stack
- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore)
- **UI Components**: Radix UI components
- **Form Handling**: React Hook Form with Zod validation

## Project Structure
```
├── app/ # Next.js app directory with routes and API
├── components/ # Reusable React components
├── hooks/ # Custom React hooks
├── styles/ # Global styles and Tailwind config
└── firebase.json # Firebase configuration
```

## Development
Run the development server:

```bash
npm run dev
```

Access the application at `http://localhost:3000`

The project uses modern development practices including TypeScript for type safety and Firebase for backend services.

## Getting Started
To set up the project locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/robertlinton/pet-tracker.git
   cd pet-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Add a web app to your Firebase project
   - Copy the Firebase configuration and create a `.env.local` file in the root of your project with the following variables:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Contributing
We welcome contributions to improve Pet Tracker! To contribute, follow these steps:

1. Fork the repository
2. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b my-feature-branch
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m "Add new feature"
   ```
4. Push your changes to your fork:
   ```bash
   git push origin my-feature-branch
   ```
5. Open a pull request with a description of your changes

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
