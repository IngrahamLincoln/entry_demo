'use client'; // Required for Clerk components

import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
  } from '@clerk/nextjs'
  
  export function Header() {
    return (
      <header className="flex justify-end items-center p-4 gap-4 h-16 border-b border-gray-700">
        <SignedOut>
          <SignInButton />
          <SignUpButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
    );
  } 