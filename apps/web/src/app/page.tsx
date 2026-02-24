'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, ArrowRight } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';

export default function Home() {
  const router = useRouter();

  const handleNewProject = () => {
    const id = uuidv4();
    router.push(`/project/${id}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="absolute top-4 right-4">
        <UserMenu />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-10 w-10 text-indigo-400" />
          <h1 className="text-5xl font-bold tracking-tight text-white">
            SVG Spawn
          </h1>
        </div>
        <p className="text-lg text-gray-400 max-w-md text-center">
          AI-powered SVG animation. Upload an SVG, describe the animation you want, and watch it come to life.
        </p>
      </div>

      <button
        onClick={handleNewProject}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950"
      >
        New Project
        <ArrowRight className="h-5 w-5" />
      </button>
    </main>
  );
}
