import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import Calendar from '../Calendar.svelte';

afterEach(() => cleanup());

describe('Calendar day menu', () => {
	test('clicking a current-month day opens the edit menu', async () => {
		const { baseElement } = render(Calendar);
		const day = baseElement.querySelector<HTMLElement>('.day.currentMonth');
		expect(day).toBeTruthy();

		day!.click();
		await Promise.resolve();

		expect(baseElement.querySelector('[role="dialog"]')).toBeTruthy();
	});

	test('Escape closes the edit menu', async () => {
		const { baseElement } = render(Calendar);
		const day = baseElement.querySelector<HTMLElement>('.day.currentMonth')!;
		day.click();
		await Promise.resolve();
		expect(baseElement.querySelector('[role="dialog"]')).toBeTruthy();

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await Promise.resolve();

		expect(baseElement.querySelector('[role="dialog"]')).toBeNull();
	});
});
