"use client"
export function Tooltip({content,children}:{content:any,children:any}){
  return (
    <div className="relative inline-block group">
      {children}
      <div className="hidden group-hover:block absolute z-50 -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">{content}</div>
    </div>
  )
}
