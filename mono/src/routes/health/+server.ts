import { json } from '@sveltejs/kit';

declare const PKG: { version: string };

// Kept dynamic (the root layout prerenders everything): the timestamp must be
// generated per request, not baked at build time.
export const prerender = false;

export function GET() {
	return json(
		{
			status: 'ok',
			timestamp: new Date().toISOString(),
			version: PKG.version
		},
		{ headers: { 'cache-control': 'no-store' } }
	);
}

export const HEAD = GET;
