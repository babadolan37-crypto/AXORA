export function Card({children,className=''}:{children?:any,className?:string}){
  return <div className={`card bg-white p-4 rounded-xl border ${className}`}>{children}</div>
}
