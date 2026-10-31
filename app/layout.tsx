import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Telephone Lab — Keep the meaning',description:'Write a message, protect its important facts, and translate across Indian languages with Sarvam.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
