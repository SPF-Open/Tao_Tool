/**
 * Regression tests for the import page:
 * - a file XLSX cannot read must surface a notification instead of an
 *   unhandled promise rejection;
 * - a file that parses but yields zero questions must warn the user
 *   (SheetJS is lenient: almost any input becomes *some* workbook);
 * - the workbook store must be fed by the page so the sheet list, the
 *   auto-selected sheet and the export button all come alive;
 * - store subscriptions must not outlive the page (the old manual
 *   store.subscribe calls leaked and re-parsed once per past visit).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { get } from 'svelte/store';
import * as XLSX from 'xlsx';
import ImportPage from './+page.svelte';
import { file, currentSheet, workbook } from '$lib/import/helper/store';
import { notifications } from '$lib/ui/notifications';
import { Question } from '$lib/import/helper/question';

function makeXlsxFile(): File {
	const sheet = XLSX.utils.aoa_to_sheet([
		['Title', 'Prompt'],
		['Q1', 'What?']
	]);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
	const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
	return new File([bytes], 'questions.xlsx');
}

function makeJunkZipFile(): File {
	// ZIP local-file-header signature followed by junk: enough for SheetJS to
	// attempt an unzip and fail outright (raw garbage without the signature
	// parses into an empty workbook instead of throwing).
	const junk = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]);
	return new File([junk], 'broken.xlsx');
}

async function waitFor(assertion: () => void): Promise<void> {
	await vi.waitFor(assertion, { timeout: 2000 });
}

beforeEach(() => {
	file.set(null);
	currentSheet.set('');
	workbook.set(null);
	notifications.set([]);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe('import page', () => {
	test('an unreadable file shows an error notification instead of crashing', async () => {
		render(ImportPage);
		file.set(makeJunkZipFile());

		await waitFor(() => {
			const items = get(notifications);
			expect(items.some((n) => n.variant === 'error')).toBe(true);
		});
	});

	test('a parseable file without questions warns the user', async () => {
		render(ImportPage);
		// Raw bytes without the ZIP signature: XLSX.read succeeds (lenient
		// fallback) but no usable sheet/content means zero questions.
		file.set(new File([new Uint8Array([1, 2, 3, 4])], 'empty-ish.xlsx'));

		await waitFor(() => {
			const items = get(notifications);
			expect(items.some((n) => n.variant === 'warning')).toBe(true);
		});
	});

	test('a loaded file populates the workbook store and auto-selects a sheet', async () => {
		// The page is the single writer of the workbook store; Menu.svelte
		// derives the sheet list from it and auto-selects the first usable
		// sheet. If the store is not fed, the whole export flow stays disabled.
		render(ImportPage);
		file.set(makeXlsxFile());

		await waitFor(() => {
			const wb = get(workbook);
			expect(wb).toBeTruthy();
			expect(wb!.SheetNames).toContain('Sheet1');
		});
		await waitFor(() => {
			expect(get(currentSheet)).toBe('Sheet1');
		});
	});

	test('parsing runs once per change, even after remounting the page', async () => {
		const parseSpy = vi.spyOn(Question, 'parseSheet').mockReturnValue([]);

		// First visit: loading a file parses once.
		const first = render(ImportPage);
		file.set(makeXlsxFile());
		currentSheet.set('Sheet1');
		await waitFor(() => expect(parseSpy).toHaveBeenCalledTimes(1));

		// Leaving the page must tear its subscriptions down.
		first.unmount();

		// Second visit: the still-loaded file parses once more on mount…
		render(ImportPage);
		await waitFor(() => expect(parseSpy).toHaveBeenCalledTimes(2));

		// …and a sheet change parses exactly once, not once per past visit.
		currentSheet.set('Other');
		await waitFor(() => expect(parseSpy).toHaveBeenCalledTimes(3));
	});
});
