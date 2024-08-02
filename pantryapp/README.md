# Pantry Manager

Pantry Manager is a Next.js-based web application designed to help users manage their pantry inventory efficiently. It provides an intuitive interface for adding, removing, and tracking pantry items, as well as generating recipes based on available ingredients.

## Features

- Add pantry items manually or using image recognition
- Track item quantities with easy increment/decrement functionality
- Search functionality for quick item lookup
- Generate recipes based on available pantry items
- Responsive design for both desktop and mobile use

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework for building the application
- [Firebase Firestore](https://firebase.google.com/products/firestore) - Cloud-hosted NoSQL database for storing pantry data
- [OpenAI API](https://openai.com/blog/openai-api) - For image recognition and recipe generation
- [Material-UI (MUI)](https://mui.com/) - React UI framework for faster and easier web development
- [React Camera Pro](https://www.npmjs.com/package/react-camera-pro) - For capturing images of pantry items

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/your-username/pantry-manager.git
   cd pantry-manager
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   ```
   Replace `your_openai_api_key` with your actual OpenAI API key.

4. Set up Firebase:
   - Create a Firebase project and set up Firestore
   - Add your Firebase configuration to the project

5. Run the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

- To add an item, click the "Add Item" button and either type the item name or use the camera to capture an image.
- Use the +/- buttons to adjust item quantities.
- Use the search bar to find specific items quickly.
- Click "Generate Recipe" to get a recipe suggestion based on your current pantry items.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.