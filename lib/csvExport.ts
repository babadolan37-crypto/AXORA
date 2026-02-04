export function toCSV(rows:Record<string,unknown>[], headers: string[]): string{
  const esc = (v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`
  const head = headers.map(esc).join(',')
  const body = rows.map(r=> headers.map(h=> esc((r as any)[h])).join(',')).join('\n')
  return head+'\n'+body
}
export function downloadCSV(name:string, csv:string){
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
