export function fmtRp(n:number){return 'Rp '+Intl.NumberFormat('id-ID').format(n)}
export function fmtDate(iso:string){const d=new Date(iso);return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}
