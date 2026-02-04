export function Table({children,...rest}:{children?:any,[key:string]:any}){return <table {...rest} className="w-full table border-collapse">{children}</table>}
export function THead({children,...rest}:{children?:any,[key:string]:any}){return <thead {...rest}><tr className="text-left">{children}</tr></thead>}
export function TH({children,...rest}:{children?:any,[key:string]:any}){return <th {...rest} className="px-3 py-2 border-b">{children}</th>}
export function TR({children,...rest}:{children?:any,[key:string]:any}){return <tr {...rest}>{children}</tr>}
export function TD({children,...rest}:{children?:any,[key:string]:any}){return <td {...rest} className="px-3 py-2 border-b">{children}</td>}
