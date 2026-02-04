export function Input({className='',...props}:any){
  return <input {...props} className={`w-full px-3 py-2 rounded-xl border bg-white ${className}`} />
}
