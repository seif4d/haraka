import styles from "./lesson-copy.module.css";

// A deliberately small text format. No HTML, embedded scripts or remote images.
export default function LessonCopy({text}:{text:string}) {
  const lines=text.trim().split("\n");const nodes:React.ReactNode[]=[];
  for(let i=0;i<lines.length;){
    const line=lines[i].trim();if(!line){i++;continue;}
    if(line.startsWith("|") && /^\|[\s:|-]+\|$/.test(lines[i+1]?.trim() || "")){
      const cells=(s:string)=>s.trim().slice(1,-1).split("|").map(v=>v.trim());
      const headers=cells(line);const rows:string[][]=[];i+=2;
      while(i<lines.length && lines[i].trim().startsWith("|")){rows.push(cells(lines[i]));i++;}
      nodes.push(<div className={styles.tableWrap} key={i} tabIndex={0} role="region" aria-label={`مقارنة: ${headers.join("، ")}`}><table><thead><tr>{headers.map((h,n)=><th scope="col" key={n}>{h}</th>)}</tr></thead><tbody>{rows.map((row,n)=><tr key={n}>{row.map((c,k)=><td key={k}>{c}</td>)}</tr>)}</tbody></table></div>);continue;
    }
    const heading=line.match(/^#{1,4}\s+(.+)/);if(heading){nodes.push(<h3 key={i}>{heading[1]}</h3>);i++;continue;}
    const numbered=/^\d+\.\s+/.test(line),bulleted=/^[-•]\s+/.test(line);
    if(numbered || bulleted){const items:string[]=[];const pattern=numbered?/^\d+\.\s+/:/^[-•]\s+/;
      while(i<lines.length){if(!lines[i].trim()){i++;continue;}if(!pattern.test(lines[i].trim()))break;items.push(lines[i].trim().replace(pattern,""));i++;}
      const list=items.map((item,n)=><li key={n}>{item}</li>);nodes.push(numbered?<ol key={i} start={Number(line.match(/^\d+/)?.[0] || 1)}>{list}</ol>:<ul key={i}>{list}</ul>);continue;
    }
    const paragraph=[line];i++;while(i<lines.length && lines[i].trim() && !/^(?:\||#{1,4}\s|[-•]\s|\d+\.\s)/.test(lines[i].trim())){paragraph.push(lines[i].trim());i++;}
    nodes.push(<p key={i}>{paragraph.join("\n")}</p>);
  }
  return <div className={styles.copy}>{nodes}</div>;
}
