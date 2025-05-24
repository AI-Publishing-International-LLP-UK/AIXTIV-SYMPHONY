import { NextResponse } from 'next/server';

// Mock user data
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// In-memory database for users (in a real app, you'd use a database)
let users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'user',
  },
];

// GET handler to return all users
export async function GET() {
  return NextResponse.json({ users }, { status: 200 });
}

// POST handler to add a new user
export async function POST(request: Request) {
  try {
    // Parse the request body to get the new user data
    const body = await request.json();

    // Basic validation
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Create a new user with a generated ID
    const newUser: User = {
      id: (users.length + 1).toString(),
      name: body.name,
      email: body.email,
      role: body.role || 'user', // Default role
    };

    // Add the new user to our "database"
    users.push(newUser);

    // Return the newly created user with a 201 Created status
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    // Handle errors (like invalid JSON)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
}
