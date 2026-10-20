import type {Metadata} from 'next';
export const metadata:Metadata={title:'OVERHEARD — It hears everything.',description:'A cooperative radio thriller. Use shared memories to outwit the Listener.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
