'use client';

import { LogOut, User } from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending || !session?.user) return null;

  const { user } = session;

  return (
    <div className="flex items-center gap-3">
      {user.image ? (
        <img
          src={user.image}
          alt={user.name}
          className="h-8 w-8 rounded-full"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
          <User className="h-4 w-4 text-gray-300" />
        </div>
      )}
      <span className="text-sm text-gray-300">{user.name}</span>
      <button
        onClick={async () => {
          await signOut();
          router.push('/login');
        }}
        className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
