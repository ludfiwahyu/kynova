import type { ResponseHeadersProps } from '@/pages/request/types'

export function ResponseHeaders({ headers }: ResponseHeadersProps) {
    return (
        <div className="response-scroll">
            <table className="header-list code">
                <tbody>
                    {headers.map(([name, value], index) => (
                        <tr key={index}>
                            <th scope="row">{name}</th>
                            <td>{value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
