"use client"

import { Search, Bell, User } from "lucide-react"

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-8">
      <div className="relative hidden w-96 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <button className="relative rounded-full p-2 hover:bg-accent md:hidden">
          <Search className="h-5 w-5 text-muted-foreground" />
        </button>
        <button className="relative rounded-full p-2 hover:bg-accent">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive"></span>
        </button>
        <div className="h-8 w-[1px] bg-border mx-1 md:mx-2"></div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium">Reyad Hussein</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
          <div className="bg-primary/10 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-primary/20">
            <User className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>
    </header>
  )
}
