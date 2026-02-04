export function Select({className='',...props}:any){
  return <select {...props} className={`w-full px-3 py-2 rounded-xl border bg-white ${className}`} />
}
