"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href: string;
  children?: React.ReactNode;
}

export default function BackButton({ href, children = "Terug" }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {children}
    </Link>
  );
}
