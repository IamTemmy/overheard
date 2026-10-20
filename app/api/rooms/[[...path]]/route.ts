import {env} from 'cloudflare:workers';
import {handleRequest} from '../../../../src/server/persistent.mjs';
export const dynamic='force-dynamic';
export async function GET(req:Request){return handleRequest(req,env);}
export async function POST(req:Request){return handleRequest(req,env);}
