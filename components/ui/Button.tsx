export function Button({className='',...props}:any){
  return <button {...props} className={`px-3 py-2 rounded-lg border shadow-soft ${className}`}>{props.children}</button>
}
