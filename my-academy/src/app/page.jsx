'use client';

import React from 'react';
import Button from '../components/styled/Button';
import { Card, CardMedia } from '../components/styled/Card';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to Academy
        </h1>

        <Card className="max-w-2xl mb-8">
          <h2 className="text-2xl font-semibold mb-4">About Our Academy</h2>
          <p className="mb-4">
            Our academy provides world-class education and training for aspiring
            professionals. We offer a wide range of courses designed to help you
            develop the skills you need to succeed in today's competitive world.
          </p>
          <p>
            With expert instructors, practical learning experiences, and a
            supportive community, you'll have everything you need to reach your
            full potential.
          </p>
        </Card>

        <Button>Get Started</Button>
      </div>
    </main>
  );
}
