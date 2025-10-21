"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_DATA } from "@/types/navigation"
import { cn } from "@/lib/utils"

interface FullMegaMenuProps {
  isOpen: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClose: () => void
}

export function FullMegaMenu({ isOpen, onMouseEnter, onMouseLeave, onClose }: FullMegaMenuProps) {
  const pathname = usePathname()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="region"
      aria-label="주요 메뉴"
      className="fixed left-0 right-0 top-[var(--header-height)] z-40 bg-white/95 backdrop-blur-md border-b border-[var(--ax-border)] shadow-sm transition-all duration-200 ease-out"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={handleKeyDown}
    >
      <div className="mx-auto max-w-5xl px-3 py-6 md:px-4 lg:px-6">
        <div className="flex flex-nowrap gap-4 overflow-x-auto justify-center">
          {NAV_DATA.map((section) => (
            <div
              key={section.key}
              className={cn(
                "space-y-2 flex-none px-2 md:px-2 transition-opacity",
                section.key !== "axpress" && "opacity-30"
              )}
            >
              {section.children && (
                <ul className="space-y-4">
                  {section.children.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={item.path.startsWith("/axpress") ? item.path : "/not-found"}
                        className={cn(
                          "block text-xs text-gray-600 hover:text-[var(--ax-accent)] transition-colors truncate",
                          pathname === item.path && "text-[var(--ax-accent)] font-medium",
                        )}
                        onClick={onClose}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
